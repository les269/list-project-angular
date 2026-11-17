import { computed, inject, Injectable, effect } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DataStore } from './data.store';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';
import { dynamicSort, isNotBlank, sortSeq } from '../../../shared/util/helper';
import { TranslateService } from '@ngx-translate/core';
import { SortType } from '../../theme/models';

/**
 * 管理清單的衍生資料：搜尋 → 標籤篩選 → 排序 → 序號 → 分頁。
 * 各階段透過 computed 保留結果，切換排序或頁碼時可沿用上游篩選結果。
 * 總筆數與總頁數取自標籤篩選後的完整結果，不受排序與目前頁碼影響。
 */
@Injectable()
export class FilterStore {
  readonly dataStore = inject(DataStore);
  readonly headerStore = inject(HeaderStore);
  readonly routeStore = inject(RouteStore);
  readonly translateService = inject(TranslateService);

  constructor() {
    effect(() => {
      // 等待資料與欄位載入完成，避免以暫時的空結果校正頁碼。
      if (
        this.headerStore.themeHeader.isLoading() ||
        this.headerStore.themeItems.isLoading() ||
        this.dataStore.datasetDataList.isLoading() ||
        this.dataStore.shareTagValueList.isLoading()
      )
        return;
      const page = this.currentPage();
      // 空結果的總頁數為 0，但 URL 頁碼仍以 1 作為有效起點。
      const total = Math.max(1, this.totalPages());
      if (page > total) {
        // 自動校正不新增歷史紀錄，否則上一頁會再次回到無效頁碼。
        this.routeStore.setPage(1, { replaceUrl: true });
      }
    });
  }

  // 輸入草稿延遲 300ms 後僅用於自動完成建議，不直接改變正式查詢結果。
  searchValueDebounced = toSignal(
    toObservable(this.routeStore.searchValue).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  // 排序欄位與方向沿用 RouteStore，讓歷史導覽能還原排序。
  sortKey = this.routeStore.sortKey;
  ascFlag = this.routeStore.ascFlag;

  // 從可見欄位建立排序選項；先複製陣列，避免修改 HeaderStore 的資料。
  sortArray = computed<SortType[]>(() => {
    const arr = this.headerStore
      .visibleLabelList()
      .slice()
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

  // 自動完成使用草稿關鍵字，與 appliedSearchTokens 的正式查詢條件分開。
  searchTokens = computed(() =>
    this.searchValueDebounced()
      .split(',')
      .map(x => x.trim().toLowerCase())
      .filter(Boolean)
  );

  // 純量與陣列皆轉為字串比對，保留 0 等有效數值；陣列任一元素符合即可。
  matchValue(value: unknown, search: string): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) {
      return value.some(
        v =>
          v !== null &&
          v !== undefined &&
          String(v).trim().toLowerCase().includes(search)
      );
    }
    return String(value).trim().toLowerCase().includes(search);
  }

  // 正式查詢只使用 URL 中已送出的條件，不隨輸入草稿變動。
  readonly appliedSearchTokens = computed(() =>
    this.routeStore
      .queryParamsSearchValue()
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
  );

  // 序號是在篩選與排序後產生，不作為搜尋來源。
  readonly searchLabels = computed(() =>
    this.headerStore
      .visibleLabelList()
      .filter(label => label.isSearchValue && label.type !== 'seq')
  );

  // 關鍵字依已送出的模式採 AND 或 OR；每個關鍵字可命中不同欄位。
  readonly searchedData = computed<any[]>(() => {
    const dataList = this.dataStore.useData();
    const searchValues = this.appliedSearchTokens();
    if (searchValues.length === 0) return dataList;
    const labels = this.searchLabels();
    const mode = this.routeStore.queryParamsSearchMode();

    return dataList.filter(row => {
      const matchesKeyword = (search: string) =>
        labels.some(label => this.matchValue(row[label.byKey], search));
      return mode === 'and'
        ? searchValues.every(matchesKeyword)
        : searchValues.some(matchesKeyword);
    });
  });

  // 在搜尋結果中依主鍵套用標籤；未選標籤時直接沿用搜尋結果。
  readonly tagFilteredData = computed<any[]>(() => {
    const data = this.searchedData();
    const tag = this.dataStore.useShareTag();
    if (!tag || tag.seq === -1) return data;
    const defaultKey = this.headerStore.defaultKey();
    const values = this.dataStore.shareTagValueMap()[tag.shareTagId] ?? [];
    const valueSet = new Set(values);
    return data.filter(row => valueSet.has(row[defaultKey]));
  });

  // 排序獨立於搜尋與標籤篩選，調整方向不需重新比對所有資料。
  readonly sortedData = computed<any[]>(() => {
    // 排序僅修改副本，保留搜尋與標籤篩選結果的快取。
    const data = this.tagFilteredData().slice();
    const sortValue = this.sortValue();
    const asc = this.ascFlag();

    if (sortValue) {
      const ramdomKey = this.headerStore.RANDOM_KEY;
      if (sortValue.key === ramdomKey) {
        // 沿用資料既有的 random key，維持目前隨機排序不受升降冪切換影響的行為。
        data.sort((a: any, b: any) => (a[ramdomKey] > b[ramdomKey] ? 1 : -1));
      } else {
        data.sort(dynamicSort(sortValue.key, asc));
      }
    }

    return data;
  });

  // 保留既有完整結果介面；先編號再分頁，讓第二頁的序號接續第一頁。
  readonly filterData = computed<any[]>(() => {
    const data = this.sortedData();
    const seqKey = this.headerStore.seqKey();
    return isNotBlank(seqKey)
      ? data.map((row, index) => ({ ...row, [seqKey]: index + 1 }))
      : data;
  });

  // 保留 Adapter 的既有呼叫介面，直接回傳已快取的搜尋結果。
  filterBySearch(): any[] {
    return this.searchedData();
  }

  // 筆數不依賴排序與序號，避免只讀取總數時也執行排序或逐筆複製。
  readonly totalLength = computed(() => this.tagFilteredData().length);

  // 沿用主題的每頁筆數設定，未設定時使用 30 筆。
  pageSize = computed(
    () => this.headerStore.themeOtherSetting()?.listPageSize || 30
  );

  // 空結果維持 0 頁；需要操作頁碼時再將有效起點限制為第 1 頁。
  readonly totalPages = computed(() =>
    Math.ceil(this.totalLength() / this.pageSize())
  );

  // 頁碼選單使用一基底頁碼，空結果時不產生選項。
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  // URL 為目前頁碼的來源，不另外維護本地頁碼狀態。
  currentPage = this.routeStore.page;

  // 將一基底頁碼轉為陣列索引，僅切取當頁資料，不改變完整結果與總筆數。
  viewData = computed(() => {
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.filterData().slice(start, end);
  });

  // 使用者換頁時限制在有效範圍，再交由 RouteStore 更新 URL 與歷史紀錄。
  setPage(page: number) {
    const total = Math.max(1, this.totalPages());
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

  // 從完整 Dataset 與啟用自動完成的欄位建立去重候選值，不限於目前頁面。
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

  // 預先快取小寫版本，避免每次輸入都重複轉換全部候選值。
  autoCompleteLowerList = computed(() =>
    this.autoCompleteList().map(x => x.toLowerCase())
  );

  // 使用小寫內容比對，但回傳保留原始大小寫的候選值供畫面顯示。
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
