import { Injectable, signal } from '@angular/core';

@Injectable()
export class UIStateStore {
  // UI state for hover effects
  hoveredIndex = signal<number>(-1);

  // fixed image modal path
  fixedImagePath = signal<string>('');

  // refresh trigger date (for image cache busting)
  refreshDate = signal<Date>(new Date());

  // 依 Dataset 與主鍵欄位隔離快取，避免不同資料來源互相覆蓋。
  readonly quickRefreshResult = signal<
    Record<string, Record<string, Record<string, unknown>>>
  >({});

  // keyboard state
  ctrlPressed = signal<boolean>(false);

  setQuickRefreshResult(
    datasetName: string,
    byKey: string,
    primeKey: unknown,
    result: Record<string, unknown>
  ) {
    const key = JSON.stringify([byKey, primeKey]);
    this.quickRefreshResult.update(cache => ({
      ...cache,
      [datasetName]: { ...cache[datasetName], [key]: result },
    }));
  }

  getQuickRefreshResult(datasetName: string, byKey: string, primeKey: unknown) {
    return this.quickRefreshResult()[datasetName]?.[
      JSON.stringify([byKey, primeKey])
    ];
  }

  clearQuickRefreshResults(datasetNames: readonly string[]) {
    const names = new Set(datasetNames);
    this.quickRefreshResult.update(cache =>
      Object.fromEntries(
        Object.entries(cache).filter(([name]) => !names.has(name))
      )
    );
  }
}
