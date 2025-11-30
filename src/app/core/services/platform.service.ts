import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  /**
   * 判斷是否運行在 Tauri (desktop) 環境。
   * 使用 feature-detection：檢查 window.__TAURI_IPC__ 是否存在。
   */
  isDesktop(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof (window as any).__TAURI_IPC__ !== 'undefined'
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * 在桌面環境使用 Tauri 的 shell.open 打開外部連結；否則回退到 window.open。
   */
  async openExternal(url: string) {
    if (!url) return;
    if (this.isDesktop()) {
      try {
        const { open } = await import('@tauri-apps/plugin-shell');
        open(url);
        return;
      } catch (e) {
        // 若動態 import 或呼叫失敗，退回到瀏覽器開啟
        console.warn('tauri shell.open failed, fallback to window.open', e);
      }
    }

    try {
      window.open(url, '_blank');
    } catch (e) {
      console.error('failed to open url', e);
    }
  }
}
