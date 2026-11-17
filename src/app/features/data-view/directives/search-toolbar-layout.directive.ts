import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

@Directive({
  selector: '[appSearchToolbarLayout]',
  host: { '[class.search-wrapped]': 'searchWrapped()' },
})
export class SearchToolbarLayoutDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchWrapped = signal(false);

  constructor() {
    afterNextRender(() => {
      const toolbar = this.element.nativeElement;
      const filters = toolbar.querySelector<HTMLElement>('.toolbar-filters');
      const actions = toolbar.querySelector<HTMLElement>('.toolbar-actions');
      if (!filters || !actions || typeof ResizeObserver === 'undefined') return;

      // 依左右區塊的實際寬度判斷，避免固定螢幕 breakpoint 擠壓搜尋區。
      const updateLayout = () => {
        const gap = parseFloat(getComputedStyle(toolbar).columnGap) || 0;
        const availableWidth =
          toolbar.clientWidth -
          filters.getBoundingClientRect().width -
          actions.getBoundingClientRect().width -
          gap * 2;
        this.searchWrapped.set(availableWidth < 300);
      };
      const observer = new ResizeObserver(updateLayout);
      [toolbar, filters, actions].forEach(element => observer.observe(element));
      updateLayout();
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
