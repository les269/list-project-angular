import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { FileService } from '../../../core/services/file.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DatasetService } from '../../dataset/service/dataset.service';
import { GroupDatasetService } from '../../dataset/service/group-dataset.service';
import { ShareTagService } from '../services/share-tag.service';
import { ThemeService } from '../services/theme.service';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  QueryAction,
  QueryActionType,
  ShareTag,
  SortType,
  ThemeCustom,
  ThemeCustomValueResponse,
  ThemeDataset,
  ThemeHeader,
  ThemeHeaderType,
  ThemeImage,
  ThemeLabel,
  ThemeOtherSetting,
  ThemeTag,
  ThemeTopCustom,
} from '../models';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  dynamicSort,
  getHeaderId,
  getRandomInt,
  isBlank,
  isNotBlank,
  isNumber,
  replaceValue,
  sortSeq,
} from '../../../shared/util/helper';
import { api } from '../../../../environments/environment';
import { updateTitle } from '../../../shared/state/layout.actions';
import { EditGroupDatasetDataComponent } from '../../dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import { DatasetData } from '../../dataset/model';

@Injectable()
export class ListBaseViewStore {
  readonly themeService = inject(ThemeService);
  readonly router: Router = inject(Router);
  readonly route: ActivatedRoute = inject(ActivatedRoute);
  readonly store: Store = inject(Store);
  readonly datasetService: DatasetService = inject(DatasetService);
  readonly matDialog: MatDialog = inject(MatDialog);
  readonly groupdatasetService: GroupDatasetService =
    inject(GroupDatasetService);
  readonly selectTableService: SelectTableService = inject(SelectTableService);
  readonly translateService: TranslateService = inject(TranslateService);
  readonly snackbarService: SnackbarService = inject(SnackbarService);
  readonly fileService: FileService = inject(FileService);
  readonly shareTagService: ShareTagService = inject(ShareTagService);

  readonly RANDOM_KEY = '__random';
  readonly DATASET_NAME_KEY = '__datasetName';
  readonly webApi = api;

  themeHeaderType = toSignal(
    this.route.data.pipe(map(x => x['type'] ?? ThemeHeaderType.imageList)),
    { initialValue: ThemeHeaderType.imageList }
  );
  listName = toSignal(this.route.params.pipe(map(x => x['name'])));
  listVersion = toSignal(this.route.params.pipe(map(x => x['version'])));
  headerId = computed(() => {
    const name = this.listName();
    const version = this.listVersion();
    if (isBlank(name) || isBlank(version)) {
      return '';
    }
    return getHeaderId(name, version, this.themeHeaderType());
  });
  themeHeader = rxResource({
    params: () => this.headerId(),
    stream: ({ params }) =>
      this.themeService.getByHeaderId(params).pipe(
        filter(res => !!res),
        tap(res => {
          console.log(res);
          document.title = res.title;
          this.store.dispatch(updateTitle({ title: res.title }));
        })
      ),
    defaultValue: {} as ThemeHeader,
  });

  hoveredIndex = signal<number>(-1);
  pages = computed(() => {
    const total = Math.ceil(this.filterData().length / this.pageSize());
    return Array.from({ length: total }, (_, i) => i + 1);
  });
  filterData = computed<any[]>(() => {
    const tag = this.useShareTag();
    const seqKey = this.seqKey();
    const defaultKey = this.defaultKey();
    const tagValueMap = this.shareTagValueMap();
    const sortValue = this.sortValue();
    const asc = this.queryParamsAsc();

    let data = this.filterBySearch();
    // avoid mutating original array when sorting
    data = data.slice();
    if (tag && tag.seq !== -1) {
      const valueSet = new Set(tagValueMap[tag.shareTagId] ?? []);
      data = data.filter(x => valueSet.has(x[defaultKey]));
    }
    if (sortValue) {
      if (sortValue.key === this.RANDOM_KEY) {
        data.sort((a: any, b: any) =>
          a[this.RANDOM_KEY] > b[this.RANDOM_KEY] ? 1 : -1
        );
      } else {
        data.sort(dynamicSort(sortValue.key, asc));
      }
    }
    if (isNotBlank(seqKey)) {
      data = data.map((x, i) => ({
        ...x,
        [seqKey]: i + 1,
      }));
    }

    return data;
  });
  totalLength = computed(() => this.filterData().length);
  viewData = computed(() => {
    const page = this.queryParamsPage();
    const pageSize = this.pageSize();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.filterData().slice(start, end);
  });
  fixedImagePath = signal<string>('');

  topCustomValueMap = rxResource({
    params: () => this.headerId(),
    stream: ({ params }) => this.themeService.findTopCustomValue(params),
    defaultValue: {},
  });
  fileExistReq = computed(() => {
    const checkFileExist = this.themeOtherSetting()?.checkFileExist;
    if (!checkFileExist) return [];
    const key = this.defaultKey();
    return this.viewData().map(x => ({
      path: replaceValue(checkFileExist, x),
      name: x[key],
    }));
  });
  fileExistResource = rxResource({
    params: () => this.fileExistReq(),
    stream: ({ params }) => {
      if (!params?.length) return of({});
      return this.fileService.fileExist(params);
    },
    defaultValue: {},
  });

  refreshDate = signal<Date>(new Date());
  queryParamsSearchValue = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.get('searchValue') ?? '')
    ),
    { initialValue: '' }
  );
  searchValue = linkedSignal(() => this.queryParamsSearchValue());
  searchValueDebounced = toSignal(
    toObservable(this.searchValue).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  themeImage = computed<ThemeImage | undefined>(() => {
    if (this.themeHeader.isLoading()) {
      return undefined;
    }
    return this.themeHeader.value()?.themeImage;
  });
  themeOtherSetting = computed<ThemeOtherSetting | undefined>(() => {
    if (this.themeHeader.status() !== 'resolved') {
      return undefined;
    }
    return this.themeHeader.value()?.themeOtherSetting;
  });
  visibleLabelList = computed<ThemeLabel[]>(() => {
    const labelList = this.themeHeader.value()?.themeLabelList;
    return Array.isArray(labelList)
      ? labelList
          .slice()
          .sort(sortSeq)
          .filter(x => x.isVisible)
      : [];
  });
  themeDatasetList = computed<ThemeDataset[]>(() => {
    this.themeHeader.status();
    if (this.themeHeader.status() !== 'resolved') {
      return [];
    }
    return this.themeHeader.value().themeDatasetList.slice().sort(sortSeq);
  });
  datasetDataListReq = computed(() => {
    const list = this.themeDatasetList().flatMap(x => x.datasetList);
    return Array.from(new Set(list));
  });
  datasetDataList = rxResource({
    params: () => this.datasetDataListReq(),
    stream: ({ params }) =>
      this.datasetService.findDatasetDataByNameList(params),
    defaultValue: [],
  });
  datasetDataRefreshData = signal<Record<string, any>>({});

  themeTagList = computed<ThemeTag[]>(() => {
    return (this.themeHeader.value()?.themeTagList ?? [])
      .map(x => ({ ...x, seq: parseInt(x.seq + '') }))
      .sort(sortSeq);
  });
  themeTagListForSelect = computed<ThemeTag[]>(() => [
    { seq: -1, shareTagId: '' },
    ...this.themeTagList(),
  ]);
  shareTagValueListReq = computed(() =>
    this.themeTagList().map(t => t.shareTagId)
  );
  shareTagValueList = rxResource({
    params: () => this.shareTagValueListReq(),
    stream: ({ params }) => this.shareTagService.getShareTagValues(params),
    defaultValue: [],
  });
  themeCustomList = computed<ThemeCustom[]>(
    () => this.themeHeader.value()?.themeCustomList?.slice().sort(sortSeq) ?? []
  );
  themeTopCustomList = computed<ThemeTopCustom[]>(
    () =>
      this.themeHeader
        .value()
        ?.themeOtherSetting?.themeTopCustomList?.slice()
        .sort(sortSeq) ?? []
  );
  displayedColumns = computed<string[]>(() => [
    ...this.visibleLabelList().map(x => x.byKey),
    'other',
  ]);
  datasetDataMap = computed<
    {
      themeDataset: ThemeDataset;
      datasetDataList: DatasetData[];
    }[]
  >(() => {
    const dataList = this.datasetDataList.value() ?? [];
    const datasetList = this.themeDatasetList();
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
  searchLabel = computed<ThemeLabel[]>(() =>
    this.visibleLabelList().filter(x => x.isSearchValue && x.type !== 'seq')
  );
  queryParamsDataset = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const dataset = params.get('dataset');
        if (dataset && isNumber(dataset)) {
          return parseInt(dataset);
        }
        return -1;
      })
    ),
    { initialValue: -1 }
  );
  datasetSeq = linkedSignal(() => this.queryParamsDataset());
  useDataset = computed<ThemeDataset>(() => {
    const list = this.themeDatasetList();
    const seq = this.datasetSeq();
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
  queryParamsShareTag = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const tag = params.get('tag');
        if (tag && isNumber(tag)) {
          return parseInt(tag);
        }
        return -1;
      })
    ),
    { initialValue: -1 }
  );
  shareTagSeq = linkedSignal(() => this.queryParamsShareTag());
  useShareTag = computed<ThemeTag>(() => {
    const seq = this.shareTagSeq();
    if (seq === -1) {
      return { seq: -1, shareTagId: '' };
    }
    return this.themeTagListForSelect()[seq];
  });
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
    const key = this.defaultKey();
    return new Set(this.useData().map(x => x[key]));
  });
  autoCompleteList = computed<string[]>(() => {
    const data = this.useData();
    const labels = this.visibleLabelList().filter(
      l => l.isSearchValue && l.autoComplete
    );

    if (labels.length === 0 || data.length === 0) return [];

    const autoCompleteSet = new Set<string>();

    for (const item of data) {
      for (const label of labels) {
        const value = item[label.byKey];
        if (value == null) continue; // 快速跳過 null/undefined

        switch (label.type) {
          case 'stringArray':
            if (Array.isArray(value)) {
              for (const v of value) autoCompleteSet.add(v);
            }
            break;

          case 'stringSplit':
            if (typeof value === 'string') {
              const splits = value.split(label.splitBy);
              for (const s of splits) {
                if (s.trim()) autoCompleteSet.add(s); // 順便過濾掉空白拆分
              }
            }
            break;

          default:
            if (isNotBlank(value)) {
              autoCompleteSet.add(String(value));
            }
            break;
        }
      }
    }
    return Array.from(autoCompleteSet).sort(); // 通常 AutoComplete 建議加個排序
  });
  quickRefreshResult = signal<Record<string, any>>({});
  autoCompleteLowerList = computed(() =>
    this.autoCompleteList().map(x => x.toLowerCase())
  );

  searchTokens = computed(() =>
    this.searchValueDebounced()
      .split(',')
      .map(x => x.trim().toLowerCase())
      .filter(Boolean)
  );
  filterAutoCompleteList = computed(() => {
    const tokens = this.searchTokens();
    if (!tokens.length) return [];

    const lowerList = this.autoCompleteLowerList();
    const rawList = this.autoCompleteList();

    const result: string[] = [];

    lowerList.forEach((lower, i) => {
      if (tokens.some(t => lower.includes(t))) {
        result.push(rawList[i]);
      }
    });

    return result;
  });
  allShareTag = rxResource({
    stream: () => this.shareTagService.getAllTag(),
    defaultValue: [],
  });
  shareTags = computed<ShareTag[]>(() => {
    const tagIdSet = new Set(this.themeTagList().map(t => t.shareTagId));
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

  shareTagValueMap = computed<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};
    // 先確保每個 tagId 都存在 key
    for (const t of this.themeTagList()) {
      result[t.shareTagId] = [];
    }
    // 單次迴圈分組
    for (const v of this.shareTagValueList.value() ?? []) {
      (result[v.shareTagId] ??= []).push(v.value);
    }
    return result;
  });

  // 是否有使用序列號有的話key值為何
  seqKey = computed(
    () => this.visibleLabelList().find(x => x.type === 'seq')?.byKey ?? ''
  );
  defaultKey = computed(
    () => this.visibleLabelList().find(x => x.isDefaultKey)?.byKey ?? ''
  );
  pageSize = computed(() => this.themeOtherSetting()?.listPageSize || 30);
  sortArray = computed<SortType[]>(() => {
    const arr = this.visibleLabelList()
      .sort(sortSeq)
      .filter(x => x.isSort)
      .map(x => ({ key: x.byKey, label: x.label }));
    if (arr.length === 0) return [];
    return [...arr, this.randomSortType];
  });
  queryParamsSort = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('sort') ?? '')),
    { initialValue: '' }
  );
  sortKey = linkedSignal(() => this.queryParamsSort());
  sortValue = computed<SortType | undefined>(() => {
    const sortArray = this.sortArray();
    if (sortArray.length === 0) return;
    const key = this.sortKey();
    return sortArray.find(x => x.key === key) ?? sortArray[0];
  });

  randomSortType = {
    key: this.RANDOM_KEY,
    label: this.translateService.instant('g.randomSort'),
  };
  queryParamMap = toSignal(this.route.queryParamMap);
  queryParamsPage = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const page = params.get('page');
        if (page && isNumber(page)) {
          return parseInt(page) > 0 ? parseInt(page) : 1;
        }
        return 1;
      })
    ),
    { initialValue: 1 }
  );
  currentPage = linkedSignal(() => this.queryParamsPage());
  queryParamsAsc = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('asc') === 'true')),
    { initialValue: true }
  );
  ascFlag = linkedSignal(() => this.queryParamsAsc());

  customValueRequest = computed(() => {
    const headerId = this.headerId();
    const key = this.defaultKey();
    const data = this.viewData();

    return {
      headerId,
      valueList: data.map(x => x[key]),
    };
  });

  // 從資料庫取得當前頁面的自定義資料
  customValueMap = rxResource({
    params: () => this.customValueRequest(),
    stream: ({ params }) =>
      this.themeService.findCustomValue(params).pipe(
        map(res => {
          const valueList = this.customValueRequest().valueList;

          const missing: ThemeCustomValueResponse = Object.fromEntries(
            valueList.filter(v => !res.hasOwnProperty(v)).map(v => [v, {}])
          );

          return {
            ...res,
            ...missing,
          };
        })
      ),
    defaultValue: {},
  });

  patchQuery(action: QueryAction) {
    const queryParams = { ...this.route.snapshot.queryParams };
    switch (action.type) {
      case QueryActionType.search:
        queryParams['searchValue'] = this.searchValue();
        break;
      case QueryActionType.sort:
        queryParams['sort'] = action.key;
        queryParams['asc'] = action.asc;
        break;
      case QueryActionType.page:
        queryParams['page'] = action.page;
        break;
      case QueryActionType.dataset:
        queryParams['dataset'] = action.seq;
        break;
      case QueryActionType.tag:
        queryParams['tag'] = action.seq;
        break;
    }
    this.router.navigate([], { queryParams });
  }

  filterBySearch(): any[] {
    const searchRaw = this.queryParamsSearchValue();
    const dataList = this.useData();
    const labels = this.searchLabel();

    if (!searchRaw) return dataList;

    const searchValues = searchRaw
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter(Boolean);

    if (searchValues.length === 0) return dataList;

    return dataList.filter(row =>
      searchValues.some(search =>
        labels.some(label => this.matchValue(row[label.byKey], search))
      )
    );
  }

  matchValue(value: unknown, search: string): boolean {
    if (!value) return false;

    if (Array.isArray(value)) {
      return value.some(
        v => isNotBlank(v) && String(v).trim().toLowerCase().includes(search)
      );
    }

    return (
      isNotBlank(value) && String(value).trim().toLowerCase().includes(search)
    );
  }

  //上一頁
  prePage() {
    this.setPage(this.currentPage() - 1);
  }
  //下一頁
  nextPage() {
    this.setPage(this.currentPage() + 1);
  }

  /**
   * Set page with clamping and update query params atomically
   */
  setPage(page: number) {
    const total = Math.max(1, this.pages().length);
    const target = Number.isFinite(page)
      ? Math.min(Math.max(1, page), total)
      : 1;
    this.currentPage.set(target);
    this.patchQuery({ type: QueryActionType.page, page: target });
  }

  /**
   * 隨機搜尋
   */
  randomSearch() {
    const tag = this.useShareTag();
    const data = this.useData();
    const defaultKey = this.defaultKey();
    const tagValueMap = this.shareTagValueMap();
    if (data.length === 0) return;

    let candidates: string[];
    if (tag.seq !== -1) {
      const nameSet = new Set(data.map(x => x[defaultKey]));
      candidates = tagValueMap[tag.shareTagId].filter(v => nameSet.has(v));
    } else {
      candidates = data.map(x => x[defaultKey]);
    }

    const randomNo = getRandomInt(1, candidates.length) - 1;
    this.searchValue.set(candidates[randomNo]);
    this.patchQuery({ type: QueryActionType.search });
  }

  openEditData(data: any) {
    const datasetName = data[this.DATASET_NAME_KEY];
    this.datasetService
      .findDataset(datasetName)
      .pipe(
        switchMap(x =>
          this.groupdatasetService.getGroupDataset(x.config.groupName)
        ),
        map(group => ({
          groupName: group.groupName,
          primeValue: data[group.config.byKey],
        })),
        take(1)
      )
      .subscribe(dialogData => {
        this.matDialog.open(EditGroupDatasetDataComponent, {
          data: dialogData,
          minWidth: '60vw',
          autoFocus: false,
        });
      });
  }

  onRefresh() {
    this.datasetService
      .refreshDataByNameList(this.useDataset().datasetList)
      .subscribe(x => {
        this.datasetDataList.reload();
        this.refreshDate.set(new Date());
        this.snackbarService.openI18N('msg.refreshSuccess');
      });
  }

  selectMultipleValue() {
    const searchArr = this.searchValue()
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
    this.selectTableService
      .selectMultipleValue(this.autoCompleteList(), searchArr)
      .subscribe(res => {
        this.searchValue.set(res.map(x => x.value).join(','));
        this.patchQuery({ type: QueryActionType.search });
      });
  }

  getTagValueLength(shareTagId: string) {
    const nameList = this.useDataNameSet();
    const map = this.shareTagValueMap();
    const valueList = map[shareTagId];
    return valueList.filter(x => nameList.has(x)).length;
  }
  changeDataset(event: ThemeDataset) {
    this.datasetSeq.set(event.seq);
    this.patchQuery({ type: QueryActionType.dataset, seq: event.seq });
  }
  changeShareTag(event: ThemeTag) {
    this.shareTagSeq.set(event.seq);
    this.patchQuery({ type: QueryActionType.tag, seq: event.seq });
  }
  onSearch(text?: string) {
    this.searchValue.set(text ?? '');
    this.patchQuery({ type: QueryActionType.search });
  }

  compareSort(a: SortType, b: SortType): boolean {
    return a && b ? a.key === b.key : a === b;
  }
  compareDataset(a: ThemeDataset, b: ThemeDataset): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
  compareShareTag(a: ThemeTag, b: ThemeTag): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
}
