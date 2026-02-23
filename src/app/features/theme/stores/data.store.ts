import { computed, effect, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatasetService } from '../../dataset/service/dataset.service';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';
import { DatasetData } from '../../dataset/model';
import { QueryActionType, ShareTag, ThemeDataset } from '../models';
import { ShareTagService } from '../services/share-tag.service';
import { EMPTY } from 'rxjs';

@Injectable()
export class DataStore {
  readonly datasetService = inject(DatasetService);
  readonly headerStore = inject(HeaderStore);
  readonly routeStore = inject(RouteStore);
  readonly shareTagService = inject(ShareTagService);

  readonly RANDOM_KEY = '__random';
  readonly DATASET_NAME_KEY = '__datasetName';

  // request list of dataset data names from header datasets
  datasetDataListReq = computed(() => {
    const list = this.headerStore
      .themeDatasetList()
      .flatMap(x => x.datasetList);
    return Array.from(new Set(list));
  });

  datasetDataList = rxResource({
    params: () => this.datasetDataListReq(),
    stream: ({ params }) => {
      return this.datasetService.findDatasetDataByNameList(params);
    },
    defaultValue: [] as DatasetData[],
  });

  datasetDataMap = computed<
    {
      themeDataset: ThemeDataset;
      datasetDataList: DatasetData[];
    }[]
  >(() => {
    const dataList = this.datasetDataList.value() ?? [];
    const datasetList = this.headerStore.themeDatasetList();
    const dataMap = new Map<string, typeof dataList>();
    for (const d of dataList) {
      const arr = dataMap.get(d.datasetName);
      if (arr) {
        arr.push(d);
      } else {
        dataMap.set(d.datasetName, [d]);
      }
    }
    return datasetList.map(themeDataset => ({
      themeDataset,
      datasetDataList: themeDataset.datasetList.flatMap(
        name => dataMap.get(name) ?? []
      ),
    }));
  });

  // compute currently selected dataset
  useDataset = computed(() => {
    const list = this.headerStore.themeDatasetList();
    const seq = this.routeStore.datasetSeq();
    return (
      list.find(x => x.seq === seq) ??
      list.find(x => x.isDefault) ??
      list[0] ?? {
        seq: -1,
        label: '',
        datasetList: [],
        isDefault: false,
      }
    );
  });

  // clear cache when underlying dataset data or header changes
  private _clearEffect = effect(() => {
    this.datasetDataList.value();
    this.headerStore.headerId();
  });

  // assemble useData for the selected dataset
  useData = computed(() => {
    const dataset = this.useDataset();
    const dataList = this.datasetDataMap().find(
      x => x.themeDataset.label === dataset.label
    );

    if (!dataList || dataList.datasetDataList.length === 0) return [];

    return dataList.datasetDataList.flatMap(x =>
      x.data.map(data => ({
        ...data,
        [this.RANDOM_KEY]:
          data[this.RANDOM_KEY] ??
          crypto.getRandomValues(new Uint32Array(1))[0],
        [this.DATASET_NAME_KEY]: x.datasetName,
      }))
    );
  });

  useDataNameSet = computed(() => {
    const key = this.headerStore.defaultKey();
    return new Set(this.useData().map(x => x[key]));
  });

  // convenience to get useShareTag (selected tag based on route param)
  useShareTag = computed(() => {
    const seq = this.routeStore.shareTagSeq();
    const themeTagListForSelect = [
      { seq: -1, shareTagId: '' },
      ...this.headerStore.themeTagList(),
    ];
    if (seq === -1) {
      return { seq: -1, shareTagId: '' };
    }
    return themeTagListForSelect[seq];
  });

  shareTagValueListReq = computed(() =>
    this.headerStore.themeTagList().map(t => t.shareTagId)
  );

  shareTagValueList = rxResource({
    params: () => this.shareTagValueListReq(),
    stream: ({ params }) => this.shareTagService.getShareTagValues(params),
    defaultValue: [],
  });

  // placeholder for shareTagValueMap (will be expanded in ResourceStore)
  shareTagValueMap = computed<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};
    for (const t of this.headerStore.themeTagList()) {
      result[t.shareTagId] = [];
    }
    for (const v of this.shareTagValueList.value() ?? []) {
      (result[v.shareTagId] ??= []).push(v.value);
    }
    return result;
  });

  allShareTag = rxResource({
    stream: () => this.shareTagService.getAllTag(),
    defaultValue: [],
  });
  shareTags = computed<ShareTag[]>(() => {
    const tagIdSet = new Set(
      this.headerStore.themeTagList().map(t => t.shareTagId)
    );
    return this.allShareTag.value().filter(t => tagIdSet.has(t.shareTagId));
  });
  shareTagNameMap = computed<Record<string, string>>(() => {
    return this.shareTags().reduce(
      (acc, t) => {
        acc[t.shareTagId] = t.shareTagName;
        return acc;
      },
      {} as Record<string, string>
    );
  });

  // convenience to change dataset via RouteStore
  changeDataset(seq: number) {
    this.routeStore.patchQuery({ type: QueryActionType.dataset, seq });
  }

  // convenience to change shareTag via RouteStore
  changeShareTag(seq: number) {
    this.routeStore.patchQuery({ type: QueryActionType.tag, seq });
  }
}
