import { computed, inject, Injectable, effect } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DataStore } from './data.store';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';
import { SortType } from '../models';
import { dynamicSort, isNotBlank, sortSeq } from '../../../shared/util/helper';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class FilterStore {
  readonly dataStore = inject(DataStore);
  readonly headerStore = inject(HeaderStore);
  readonly routeStore = inject(RouteStore);
  readonly translateService = inject(TranslateService);

  constructor() {
    effect(() => {
      if (this.dataStore.useData().length === 0) return; // wait for data to load before validating
      const page = this.currentPage();
      const total = Math.max(1, this.pages().length);
      if (page > total) {
        this.routeStore.setPage(1);
      }
    });
  }

  // search value with debounce
  searchValueDebounced = toSignal(
    toObservable(this.routeStore.searchValue).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  // sort key and asc flag from route
  sortKey = this.routeStore.sortKey;
  ascFlag = this.routeStore.ascFlag;

  // build sortArray from visible labels that support sorting
  sortArray = computed<SortType[]>(() => {
    const arr = this.headerStore
      .visibleLabelList()
      .sort(sortSeq)
      .filter(x => x.isSort)
      .map(x => ({ key: x.byKey, label: x.label }));
    if (arr.length === 0) return [];
    return [...arr, this.randomSortType];
  });

  randomSortType: SortType = {
    key: this.headerStore.RANDOM_KEY,
    label: this.translateService.instant('g.randomSort'),
  };

  sortValue = computed<SortType | undefined>(() => {
    const sortArray = this.sortArray();
    if (sortArray.length === 0) return;
    const key = this.sortKey();
    return sortArray.find(x => x.key === key) ?? sortArray[0];
  });

  // search tokens from debounced search value
  searchTokens = computed(() =>
    this.searchValueDebounced()
      .split(',')
      .map(x => x.trim().toLowerCase())
      .filter(Boolean)
  );

  // match value in row (array or scalar)
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

  // filter data by search criteria
  filterBySearch(): any[] {
    //只會在queryParamsSearchValue更新時觸發，避免每次input change都觸發
    const searchRaw = this.routeStore.queryParamsSearchValue();
    const dataList = this.dataStore.useData();
    const labels = this.headerStore
      .visibleLabelList()
      .filter(x => x.isSearchValue && x.type !== 'seq');

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

  // apply filters and sorting
  filterData = computed<any[]>(() => {
    const tag = this.dataStore.useShareTag();
    const seqKey = this.headerStore.seqKey();
    const defaultKey = this.headerStore.defaultKey();
    const tagValueMap = this.dataStore.shareTagValueMap();
    const sortValue = this.sortValue();
    const asc = this.ascFlag();

    let data = this.filterBySearch();
    // avoid mutating original array
    data = data.slice();

    if (tag && tag.seq !== -1) {
      const valueSet = new Set(tagValueMap[tag.shareTagId] ?? []);
      data = data.filter(x => valueSet.has(x[defaultKey]));
    }

    if (sortValue) {
      const ramdomKey = this.headerStore.RANDOM_KEY;
      if (sortValue.key === ramdomKey) {
        data.sort((a: any, b: any) => (a[ramdomKey] > b[ramdomKey] ? 1 : -1));
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

  // page size from header setting
  pageSize = computed(
    () => this.headerStore.themeOtherSetting()?.listPageSize || 30
  );

  // pages array
  pages = computed(() => {
    const total = Math.ceil(this.filterData().length / this.pageSize());
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // page from route
  currentPage = this.routeStore.page;

  // view data for current page
  viewData = computed(() => {
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.filterData().slice(start, end);
  });

  // helper: set page with clamping
  setPage(page: number) {
    const total = Math.max(1, this.pages().length);
    const target = Number.isFinite(page)
      ? Math.min(Math.max(1, page), total)
      : 1;
    this.routeStore.setPage(target);
  }

  prePage() {
    this.setPage(this.currentPage() - 1);
  }

  nextPage() {
    this.setPage(this.currentPage() + 1);
  }

  // autocomplete list from data based on searchValue and autoComplete labels
  autoCompleteList = computed<string[]>(() => {
    const data = this.dataStore.useData();
    const labels = this.headerStore
      .visibleLabelList()
      .filter(l => l.isSearchValue && l.autoComplete);

    if (labels.length === 0 || data.length === 0) return [];

    const autoCompleteSet = new Set<string>();

    for (const item of data) {
      for (const label of labels) {
        const value = item[label.byKey];
        if (value == null) continue;

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
                if (s.trim()) autoCompleteSet.add(s);
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
    return Array.from(autoCompleteSet).sort();
  });

  autoCompleteLowerList = computed(() =>
    this.autoCompleteList().map(x => x.toLowerCase())
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
}
