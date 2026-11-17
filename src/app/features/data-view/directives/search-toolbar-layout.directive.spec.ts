import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SearchToolbarLayoutDirective } from './search-toolbar-layout.directive';

@Component({
  imports: [SearchToolbarLayoutDirective],
  template: `
    <div class="view-toolbar" appSearchToolbarLayout style="column-gap: 16px">
      <div class="toolbar-filters"></div>
      <div class="toolbar-search"></div>
      <div class="toolbar-actions"></div>
    </div>
  `,
})
class TestToolbar {}

it('左右內容變寬或容器縮小使搜尋空間不足 300px 時換行，恢復空間後回到原列並在銷毀時停止監聽', async () => {
  let toolbarWidth = 732;
  let filtersWidth = 240;
  const actionsWidth = 160;
  let resize: () => void = () => {};
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = observe;
      disconnect = disconnect;
    }
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains('view-toolbar') ? toolbarWidth : 0;
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return {
        width: this.classList.contains('toolbar-filters')
          ? filtersWidth
          : actionsWidth,
      } as DOMRect;
    }
  );

  try {
    const fixture = TestBed.createComponent(TestToolbar);
    await fixture.whenStable();
    const toolbar = fixture.nativeElement.querySelector(
      '.view-toolbar'
    ) as HTMLElement;
    expect(observe).toHaveBeenCalledTimes(3);
    expect(toolbar.classList.contains('search-wrapped')).toBe(false);

    toolbarWidth = 731;
    resize();
    await fixture.whenStable();
    expect(toolbar.classList.contains('search-wrapped')).toBe(true);

    toolbarWidth = 900;
    resize();
    await fixture.whenStable();
    expect(toolbar.classList.contains('search-wrapped')).toBe(false);

    filtersWidth = 410;
    resize();
    await fixture.whenStable();
    expect(toolbar.classList.contains('search-wrapped')).toBe(true);

    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});
