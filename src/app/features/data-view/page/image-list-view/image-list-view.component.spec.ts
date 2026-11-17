import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { API_BASE_URL } from '../../../../core/tokens/api-base-url.token';
import { ListBaseViewStoreAdapter } from '../../stores/list-base-view.adapter';
import { UIStateStore } from '../../stores/ui.state.store';
import { ImageListViewComponent } from './image-list-view.component';

it('快速刷新回應會立即更新畫面，且不覆蓋另一個 Dataset 的同名主鍵', async () => {
  const response = new Subject<Record<string, unknown>>();
  const quickRefreshDataset = vi.fn(() => response);
  TestBed.configureTestingModule({
    providers: [
      UIStateStore,
      provideRouter([]),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  const ui = new UIStateStore();
  const store = {
    DATASET_NAME_KEY: '__datasetName',
    defaultKey: signal('id'),
    headerId: signal('test'),
    queryParamMap: signal(undefined),
    themeOtherSetting: signal({
      useSpider: 'spider',
      quickRefreshType: 'url',
      quickRefresh: 'link',
    }),
    datasetService: { quickRefreshDataset },
    snackbarService: { openI18N: vi.fn() },
    setQuickRefreshResult: ui.setQuickRefreshResult.bind(ui),
    getQuickRefreshResult: ui.getQuickRefreshResult.bind(ui),
  };
  TestBed.overrideComponent(ImageListViewComponent, {
    set: {
      providers: [{ provide: ListBaseViewStoreAdapter, useValue: store }],
      template: `<p>{{ getData({ __datasetName: 'a', id: 'same', title: 'old A' }).title }}</p>
      <p>{{ getData({ __datasetName: 'b', id: 'same', title: 'old B' }).title }}</p>`,
    },
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const fixture = TestBed.createComponent(ImageListViewComponent);
  await fixture.whenStable();
  const titles = () =>
    Array.from(fixture.nativeElement.querySelectorAll('p'), p =>
      (p as HTMLElement).textContent?.trim()
    );
  expect(titles()).toEqual(['old A', 'old B']);
  const row = {
    __datasetName: 'a',
    id: 'same',
    title: 'old A',
    link: 'https://example.test',
  };
  fixture.componentInstance.quickRefresh(row);
  response.next({ title: 'new A' });
  response.complete();
  await fixture.whenStable();
  expect(titles()).toEqual(['new A', 'old B']);
  expect(row.title).toBe('old A');
  expect(quickRefreshDataset).toHaveBeenCalledWith(
    expect.objectContaining({ datasetName: 'a', byKey: 'id', primeKey: 'same' })
  );
});
