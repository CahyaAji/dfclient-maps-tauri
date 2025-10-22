import type { ClientOptions } from "@tauri-apps/plugin-http";

export function isTauri(): boolean {
  return !!window.__TAURI__;
}

let tauriFetch:
  | ((
      input: URL | Request | string,
      init?: RequestInit & ClientOptions
    ) => Promise<Response>)
  | ((arg0: any, arg1: {}) => any);
if (isTauri()) {
  const mod = await import("@tauri-apps/plugin-http");
  tauriFetch = mod.fetch;
}

/**
 * Unified fetch that works both in Tauri and browser dev mode
 */
export async function unifiedFetch(
  url: URL | Request | string,
  options: RequestInit & ClientOptions = {}
): Promise<Response> {
  if (isTauri() && tauriFetch) {
    return tauriFetch(url, options);
  } else {
    return window.fetch(url, options);
  }
}
