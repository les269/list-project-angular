import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  effect,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { QueryAction, QueryActionType } from '../models';
import { HeaderStore } from './header.store';

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
      if (this.headerStore.themeHeader.isLoading()) return; // wait for header to load before validating
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

      const currentStr = JSON.stringify(current || {});
      const validatedStr = JSON.stringify(validated || {});
      if (currentStr !== validatedStr) {
        this.router.navigate([], { queryParams: validated });
      }
    });
  }

  // raw queryParamMap accessor (signal) for effects
  queryParamMap = toSignal(this.route.queryParamMap);

  // search value
  queryParamsSearchValue = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.get('searchValue') ?? '')
    ),
    { initialValue: '' }
  );
  searchValue = linkedSignal(() => this.queryParamsSearchValue());

  // page
  queryParamsPage = toSignal(
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
  page = linkedSignal(() => this.queryParamsPage());

  // sort
  queryParamsSort = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('sort') ?? '')),
    { initialValue: '' }
  );
  sortKey = linkedSignal(() => this.queryParamsSort());

  // asc flag
  queryParamsAsc = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('asc') === 'true')),
    { initialValue: true }
  );
  ascFlag = linkedSignal(() => this.queryParamsAsc());

  // dataset
  queryParamsDataset = toSignal(
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
  datasetSeq = linkedSignal(() => this.queryParamsDataset());

  // share tag
  queryParamsShareTag = toSignal(
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
  shareTagSeq = linkedSignal(() => this.queryParamsShareTag());

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

    this.router.navigate([], {
      queryParams: { ...queryParams },
    });
  }

  // convenience setter for page that delegates to patchQuery
  setPage(page: number) {
    const target = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    this.patchQuery({ type: QueryActionType.page, page: target });
  }
}
