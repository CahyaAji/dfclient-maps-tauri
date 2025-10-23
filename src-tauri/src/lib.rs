use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::net::UdpSocket;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct UdpMessage {
    #[serde(rename = "type")]
    message_type: String,
    data: serde_json::Value,
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct NumberData {
    value: u32,
}

struct UdpState {
    is_running: Arc<Mutex<bool>>,
    task_handle: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

#[tauri::command]
async fn start_udp_listener(
    app_handle: AppHandle,
    state: tauri::State<'_, UdpState>,
    port: u16,
) -> Result<String, String> {
    let mut is_running = state.is_running.lock().await;

    // If already running, don't fail — just acknowledge
    if *is_running {
        return Ok(format!("Already listening on port {}!", port));
    }

    // Create socket with SO_REUSEADDR equivalent
    let socket = UdpSocket::bind(format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| format!("Failed to bind: {}", e))?;

    *is_running = true;
    drop(is_running); // Release lock early

    let is_running_clone = state.is_running.clone();
    let app_handle_clone = app_handle.clone();

    // Spawn the listening task and store its handle
    let task_handle = tokio::spawn(async move {
        let mut buf = [0; 1024];

        loop {
            // Check if we should stop
            {
                let running = is_running_clone.lock().await;
                if !*running {
                    break;
                }
            }

            // Use a timeout for recv_from to allow periodic checking of is_running
            match tokio::time::timeout(
                tokio::time::Duration::from_millis(100),
                socket.recv_from(&mut buf),
            )
            .await
            {
                Ok(Ok((len, _))) => {
                    if let Ok(json_str) = String::from_utf8(buf[..len].to_vec()) {
                        if let Ok(message) = serde_json::from_str::<UdpMessage>(&json_str) {
                            let _ = app_handle_clone.emit("udp-message", &message);
                        }
                    }
                }
                Ok(Err(e)) => {
                    eprintln!("UDP receive error: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                }
                Err(_) => {
                    // Timeout - continue to check is_running
                    continue;
                }
            }
        }

        println!("UDP listener, task ended");
    });

    // Store the task handle
    let mut task_handle_guard = state.task_handle.lock().await;
    *task_handle_guard = Some(task_handle);

    Ok(format!("Listening on port {}", port))
}

#[tauri::command]
async fn stop_udp_listener(state: tauri::State<'_, UdpState>) -> Result<String, String> {
    // Signal the task to stop
    {
        let mut is_running = state.is_running.lock().await;
        if !*is_running {
            // Already stopped — return Ok instead of Err
            return Ok("Already stopped".to_string());
        }
        *is_running = false;
    }

    // Abort the task if it exists
    {
        let mut task_handle_guard = state.task_handle.lock().await;
        if let Some(handle) = task_handle_guard.take() {
            handle.abort();
            // Small delay for cleanup
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }
    }

    Ok("Stopped".to_string())
}

#[tauri::command]
async fn send_udp_number(number: u32, port: u16) -> Result<String, String> {
    if number > 1000000 {
        return Err("Number must be between 0-1000000".to_string());
    }

    // Use port 0 to let the OS assign a random port for sending
    let socket = UdpSocket::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to create socket: {}", e))?;

    let message = UdpMessage {
        message_type: "number".to_string(),
        data: serde_json::to_value(NumberData { value: number }).unwrap(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    let json_data =
        serde_json::to_string(&message).map_err(|e| format!("Failed to serialize: {}", e))?;

    socket
        .send_to(json_data.as_bytes(), format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| format!("Failed to send: {}", e))?;

    Ok("Sent".to_string())
}

#[tauri::command]
async fn send_udp_message(
    message_type: String,
    data: serde_json::Value,
    port: u16,
) -> Result<String, String> {
    let socket = UdpSocket::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to create socket: {}", e))?;

    let message = UdpMessage {
        message_type,
        data,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    let json_data =
        serde_json::to_string(&message).map_err(|e| format!("Failed to serialize: {}", e))?;

    socket
        .send_to(json_data.as_bytes(), format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| format!("Failed to send: {}", e))?;

    Ok("Sent".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(UdpState {
            is_running: Arc::new(Mutex::new(false)),
            task_handle: Arc::new(Mutex::new(None)),
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            start_udp_listener,
            stop_udp_listener,
            send_udp_number,
            send_udp_message
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
