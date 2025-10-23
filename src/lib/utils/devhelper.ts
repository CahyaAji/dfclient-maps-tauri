export async function isTauriRuntime(): Promise<boolean> {
  try {
    // dynamic import — safe for both web and tauri
    const tauri = await import("@tauri-apps/api/core");
    return typeof tauri !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Universal fetch that works both in Tauri and Browser.
 */
export async function unifiedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const inTauri = await isTauriRuntime();

  if (inTauri) {
    try {
      const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
      return await tauriFetch(url, options);
    } catch (err) {
      console.warn(
        "Tauri plugin-http not available, falling back to browser fetch.",
        err
      );
      return await window.fetch(url, options);
    }
  } else {
    return await window.fetch(url, options);
  }
}
