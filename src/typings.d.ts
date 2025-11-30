/* Global typings for Tauri environment detection */
declare global {
  interface Window {
    __TAURI_IPC__?: any;
  }
}

export {};
