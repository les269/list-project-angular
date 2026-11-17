import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DatasetService } from '../../dataset/service/dataset.service';
import { ShareTagService } from '../../theme/services/share-tag.service';
import { DataStore } from './data.store';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';

async function setup() {
  const datasetSeq = signal(20);
  const shareTagSeq = signal(7);
  const shareTagService = {
    getShareTagValues: vi.fn(() => of([])),
    getAllTag: vi.fn(() => of([])),
    addTagValue: vi.fn(() => of(undefined)),
    deleteTagValue: vi.fn(() => of(undefined)),
  };
  TestBed.configureTestingModule({
    providers: [
      DataStore,
      {
        provide: HeaderStore,
        useValue: {
          themeDatasetList: signal([
            { seq: 10, label: 'same', datasetList: ['a'], isDefault: true },
            { seq: 20, label: 'same', datasetList: ['b'], isDefault: false },
          ]),
          themeTagList: signal([
            { seq: 2, shareTagId: 'first' },
            { seq: 7, shareTagId: 'second' },
          ]),
          defaultKey: signal('name'),
        },
      },
      { provide: RouteStore, useValue: { datasetSeq, shareTagSeq } },
      {
        provide: DatasetService,
        useValue: {
          findDatasetDataByNameList: vi.fn(() =>
            of([
              { datasetName: 'a', data: [{ name: 'A' }] },
              { datasetName: 'b', data: [{ name: 'B' }] },
            ])
          ),
        },
      },
      { provide: ShareTagService, useValue: shareTagService },
    ],
  });
  const store = TestBed.inject(DataStore);
  await TestBed.inject(ApplicationRef).whenStable();
  return { store, datasetSeq, shareTagSeq, shareTagService };
}

it('同名 Dataset 使用 seq 選取正確資料，保留來源標記且不改動原始資料', async () => {
  const { store, datasetSeq } = await setup();
  expect(store.useData()[0]['name']).toBe('B');
  expect(store.useData()[0][store.DATASET_NAME_KEY]).toBe('b');
  expect(store.useData()[0][store.RANDOM_KEY]).toEqual(expect.any(Number));
  expect(store.datasetDataList.value()[1].data[0]).toEqual({ name: 'B' });
  datasetSeq.set(10);
  expect(store.useData()[0]['name']).toBe('A');
});

it('標籤 seq 不連續時仍選取正確標籤，無效 seq 使用未篩選狀態', async () => {
  const { store, shareTagSeq } = await setup();
  expect(store.useShareTag()).toEqual({ seq: 7, shareTagId: 'second' });
  shareTagSeq.set(2);
  expect(store.useShareTag()).toEqual({ seq: 2, shareTagId: 'first' });
  shareTagSeq.set(99);
  expect(store.useShareTag()).toEqual({ seq: -1, shareTagId: '' });
});

it('尚未載入的標籤值可新增，不因空清單拋錯', async () => {
  const { store, shareTagService } = await setup();
  const value = { shareTagId: 'new', value: 'item' };
  expect(() => store.tagValueUpdate(value)).not.toThrow();
  expect(shareTagService.addTagValue).toHaveBeenCalledWith(value);
});
