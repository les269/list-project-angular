import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  effect,
} from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationBehaviorOptions,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HeaderStore } from './header.store';
import { QueryAction, QueryActionType } from '../../theme/models';
import { SearchMode } from '../models/search.model';

@Injectable()
export class RouteStore {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly headerStore = inject(HeaderStore);

  // ensure base query params are present when user clears URL query params
  // (e.g., user manually removes them) — merge defaults with current params
  // and navigate only when different to avoid loops.
  constructor() {
    effect(() => {
      // read the signal so effect re-runs on changes
      this.queryParamMap();
      if (
        this.headerStore.themeHeader.isLoading() ||
        this.headerStore.themeItems.isLoading()
      )
        return;
      const current = { ...this.route.snapshot.queryParams };
      const defaults = this.baseQueryParams();
      // if defaults is not ready, skip
      if (!defaults) return;
      // validate each param according to rules
      const visibleLabels = this.headerStore.visibleLabelList?.() ?? [];
      const sortKeys = visibleLabels.map(x => x.byKey);

      const datasetList = this.headerStore.themeDatasetList?.() ?? [];
      const datasetSeqs = datasetList.map(x => x.seq);

      const tagList = this.headerStore.themeTagList?.() ?? [];
      const tagSeqs = tagList.map(x => x.seq);

      const validated: Record<string, any> = {};

      validated['searchValue'] =
        current['searchValue'] ?? defaults['searchValue']; // searchValue: default if missing, no validation needed

      // sort: must be a label that exists
      const curSort = current['sort'] ?? '';
      validated['sort'] = [...sortKeys, this.headerStore.RANDOM_KEY].includes(
        curSort
      )
        ? curSort
        : defaults['sort'];

      // asc: must be 'true' or 'false' string; otherwise default
      const curAsc = current['asc'];
      if (curAsc === 'true' || curAsc === 'false') {
        validated['asc'] = curAsc;
      } else {
        validated['asc'] = defaults['asc'];
      }

      // page: numeric >=1 else default
      const p = Number(current['page']);
      validated['page'] =
        Number.isFinite(p) && p >= 1 ? Math.floor(p) : defaults['page'];

      // dataset: must be numeric and present in datasetSeqs
      const d = Number(current['dataset']);
      validated['dataset'] =
        Number.isFinite(d) && datasetSeqs.includes(d) ? d : defaults['dataset'];

      // tag: must be numeric and present in tagSeqs
      const t = Number(current['tag']);
      validated['tag'] =
        Number.isFinite(t) && tagSeqs.includes(t) ? t : defaults['tag'];

      // URL 參數皆為字串，校正時不因型別或 key 順序不同而重複導覽。
      const keys = Object.keys(validated);
      if (
        Object.keys(current).length !== keys.length ||
        keys.some(key => String(current[key]) !== String(validated[key]))
      ) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: validated,
          replaceUrl: true,
        });
      }
    });
  }

  // 提供目前 URL 參數給衍生狀態與校正流程。
  readonly queryParamMap = toSignal(this.route.queryParamMap);

  // 搜尋保留可編輯的草稿；返回歷史時再由 URL 還原草稿內容。
  private readonly encodedSearchValue = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.get('searchValue') ?? '')
    ),
    { initialValue: '' }
  );
  // 僅解析第一層前綴，讓 or:and:test 可表示 OR 搜尋原文 and:test。
  private readonly appliedSearch = computed<{
    value: string;
    mode: SearchMode;
  }>(() => {
    const encoded = this.encodedSearchValue();
    if (encoded.startsWith('and:')) {
      return { value: encoded.slice(4), mode: 'and' };
    }
    if (encoded.startsWith('or:')) {
      return { value: encoded.slice(3), mode: 'or' };
    }
    return { value: encoded, mode: 'or' };
  });
  readonly queryParamsSearchValue = computed(() => this.appliedSearch().value);
  readonly queryParamsSearchMode = computed(() => this.appliedSearch().mode);
  readonly searchValue = linkedSignal(() => this.appliedSearch().value);
  readonly searchMode = linkedSignal(() => this.appliedSearch().mode);

  // page
  readonly queryParamsPage = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const page = params.get('page');
        if (page && !Number.isNaN(Number(page))) {
          return parseInt(page) > 0 ? parseInt(page) : 1;
        }
        return 1;
      })
    ),
    { initialValue: 1 }
  );
  // 頁碼僅由 URL 決定，透過 setPage 導覽後再同步。
  readonly page = this.queryParamsPage;

  // sort
  readonly queryParamsSort = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('sort') ?? '')),
    { initialValue: '' }
  );
  readonly sortKey = this.queryParamsSort;

  // asc flag
  readonly queryParamsAsc = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('asc') === 'true')),
    { initialValue: true }
  );
  readonly ascFlag = this.queryParamsAsc;

  // dataset
  readonly queryParamsDataset = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const dataset = params.get('dataset');
        if (dataset && !Number.isNaN(Number(dataset))) {
          return parseInt(dataset);
        }
        return -1;
      })
    ),
    { initialValue: -1 }
  );
  readonly datasetSeq = this.queryParamsDataset;

  // share tag
  readonly queryParamsShareTag = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const tag = params.get('tag');
        if (tag && !Number.isNaN(Number(tag))) {
          return parseInt(tag);
        }
        return -1;
      })
    ),
    { initialValue: -1 }
  );
  readonly shareTagSeq = this.queryParamsShareTag;

  baseQueryParams = computed<Record<string, any>>(() => {
    // guard against header not loaded yet
    if (this.headerStore.themeHeader.isLoading()) return {};
    const sort = this.headerStore.defaultSortLabel?.() ?? '';
    const datasetList = this.headerStore.themeDatasetList?.() ?? [];
    const dataset =
      datasetList.length > 0
        ? (this.headerStore.defaultDataset?.() ?? datasetList[0].seq)
        : -1;
    return {
      searchValue: '',
      sort,
      asc: true,
      page: 1,
      dataset,
      tag: -1,
    };
  });

  patchQuery(
    action: QueryAction,
    options: Pick<NavigationBehaviorOptions, 'replaceUrl'> = {}
  ) {
    const queryParams = { ...this.route.snapshot.queryParams };
    switch (action.type) {
      case QueryActionType.search:
        // 一般 OR 保留舊格式；遇到保留前綴時加上 or:，避免被誤解為模式。
        queryParams['searchValue'] =
          this.searchMode() === 'and'
            ? `and:${this.searchValue()}`
            : /^(and|or):/.test(this.searchValue())
              ? `or:${this.searchValue()}`
              : this.searchValue();
        queryParams['page'] = 1;
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

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...queryParams },
      ...options,
    });
  }

  // convenience setter for page that delegates to patchQuery
  setPage(
    page: number,
    options: Pick<NavigationBehaviorOptions, 'replaceUrl'> = {}
  ) {
    const target = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    this.patchQuery({ type: QueryActionType.page, page: target }, options);
  }
}
