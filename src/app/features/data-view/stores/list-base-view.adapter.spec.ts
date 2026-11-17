import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DatasetService } from '../../dataset/service/dataset.service';
import { GroupDatasetService } from '../../dataset/service/group-dataset.service';
import { ShareTagService } from '../../theme/services/share-tag.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DataStore } from './data.store';
import { HeaderStore } from './header.store';
import { FilterStore } from './filter.store';
import { ResourceStore } from './resource.store';
import { RouteStore } from './route.store';
import { UIStateStore } from './ui.state.store';
import { ListBaseViewStoreAdapter } from './list-base-view.adapter';

function setup() {
  const data = signal<Record<string, unknown>[]>([{ id: 'same' }]);
  const tag = signal({ seq: -1, shareTagId: '' });
  const tagValues = signal<Record<string, string[]>>({});
  const dataset = signal({ datasetList: ['a'] });
  const pending = new Subject<void>();
  const route = { searchValue: signal('kept'), patchQuery: vi.fn() };
  const reload = vi.fn();
  const refreshDataByNameList = vi.fn(() => pending);
  TestBed.configureTestingModule({
    providers: [
      ListBaseViewStoreAdapter,
      UIStateStore,
      {
        provide: DataStore,
        useValue: {
          useData: data,
          useShareTag: tag,
          shareTagValueMap: tagValues,
          useDataset: dataset,
          datasetDataList: { reload },
        },
      },
      { provide: HeaderStore, useValue: { defaultKey: signal('id') } },
      { provide: RouteStore, useValue: route },
      { provide: DatasetService, useValue: { refreshDataByNameList } },
      { provide: FilterStore, useValue: {} },
      { provide: ResourceStore, useValue: {} },
      { provide: GroupDatasetService, useValue: {} },
      { provide: SelectTableService, useValue: {} },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
      { provide: ShareTagService, useValue: {} },
      { provide: MatDialog, useValue: {} },
    ],
  });
  return {
    adapter: TestBed.inject(ListBaseViewStoreAdapter),
    ui: TestBed.inject(UIStateStore),
    data,
    tag,
    tagValues,
    dataset,
    route,
    pending,
    reload,
    refreshDataByNameList,
  };
}

it('快速刷新建立新 reference，衍生顯示值會立即更新，且 Dataset 與主鍵欄位互不干擾', () => {
  const { adapter, ui } = setup();
  const displayed = computed(
    () => adapter.getQuickRefreshResult('a', 'id', 'same')?.['title']
  );
  const original = ui.quickRefreshResult();
  expect(displayed()).toBeUndefined();
  adapter.setQuickRefreshResult('a', 'id', 'same', { title: 'A' });
  expect(ui.quickRefreshResult()).not.toBe(original);
  expect(displayed()).toBe('A');
  adapter.setQuickRefreshResult('b', 'id', 'same', { title: 'B' });
  adapter.setQuickRefreshResult('a', 'name', 'same', { title: 'Name' });
  expect(displayed()).toBe('A');
  expect(adapter.getQuickRefreshResult('b', 'id', 'same')).toEqual({
    title: 'B',
  });
  expect(adapter.getQuickRefreshResult('a', 'name', 'same')).toEqual({
    title: 'Name',
  });
});

it('完整刷新成功後只清除該次 Dataset 快取，操作途中切換 Dataset 不影響清除範圍', () => {
  const { adapter, dataset, pending, reload, refreshDataByNameList } = setup();
  adapter.setQuickRefreshResult('a', 'id', 'same', { title: 'A' });
  adapter.setQuickRefreshResult('b', 'id', 'same', { title: 'B' });
  adapter.onRefresh();
  dataset.set({ datasetList: ['b'] });
  expect(adapter.getQuickRefreshResult('a', 'id', 'same')).toEqual({
    title: 'A',
  });
  pending.next();
  pending.complete();
  expect(refreshDataByNameList).toHaveBeenCalledWith(['a']);
  expect(reload).toHaveBeenCalledOnce();
  expect(adapter.getQuickRefreshResult('a', 'id', 'same')).toBeUndefined();
  expect(adapter.getQuickRefreshResult('b', 'id', 'same')).toEqual({
    title: 'B',
  });
});

it.each<Record<string, string[]>>([{}, { tag: [] }, { tag: ['missing'] }])(
  '標籤沒有有效候選值 %j 時不修改搜尋或導覽',
  values => {
    const { adapter, tag, tagValues, route } = setup();
    tag.set({ seq: 7, shareTagId: 'tag' });
    tagValues.set(values);
    expect(() => adapter.randomSearch()).not.toThrow();
    expect(route.searchValue()).toBe('kept');
    expect(route.patchQuery).not.toHaveBeenCalled();
  }
);

it('空白與缺少主鍵的資料不會寫入搜尋狀態，數值 0 可用於搜尋', () => {
  const { adapter, data, route } = setup();
  data.set([{}, { id: null }, { id: '  ' }]);
  adapter.randomSearch();
  expect(route.patchQuery).not.toHaveBeenCalled();
  expect(route.searchValue()).toBe('kept');
  data.set([{ id: 0 }]);
  adapter.randomSearch();
  expect(route.searchValue()).toBe('0');
  expect(route.patchQuery).toHaveBeenCalledOnce();
});
