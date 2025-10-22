export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Universal fetch that works both in Tauri and Browser.
 */
export async function unifiedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (isTauri()) {
    // Dynamically import inside function
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
    return await tauriFetch(url, options);
  } else {
    return await window.fetch(url, options);
  }
}
