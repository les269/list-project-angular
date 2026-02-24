import { Injectable, signal } from '@angular/core';

@Injectable()
export class UIStateStore {
  // UI state for hover effects
  hoveredIndex = signal<number>(-1);

  // fixed image modal path
  fixedImagePath = signal<string>('');

  // refresh trigger date (for image cache busting)
  refreshDate = signal<Date>(new Date());

  // quick refresh result cache
  quickRefreshResult = signal<Record<string, any>>({});

  // keyboard state
  ctrlPressed = signal<boolean>(false);
}
