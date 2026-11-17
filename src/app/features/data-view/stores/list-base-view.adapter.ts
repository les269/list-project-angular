import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take, switchMap, map } from 'rxjs';
import { RouteStore } from './route.store';
import { HeaderStore } from './header.store';
import { DataStore } from './data.store';
import { FilterStore } from './filter.store';
import { ResourceStore } from './resource.store';
import { UIStateStore } from './ui.state.store';
import { DatasetService } from '../../dataset/service/dataset.service';
import { GroupDatasetService } from '../../dataset/service/group-dataset.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { getRandomInt } from '../../../shared/util/helper';
import { EditGroupDatasetDataComponent } from '../../dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import {
  ThemeDataset,
  ThemeTag,
  ThemeLabel,
  QueryActionType,
  ShareTagValue,
  SortType,
} from '../../theme/models';
import { ShareTagService } from '../../theme/services/share-tag.service';

/**
 * Adapter store that composes all sub-stores and provides
 * a compatible API for existing components to migrate gradually.
 *
 * Eventually, components should inject specific stores directly instead of this adapter.
 */
@Injectable()
export class ListBaseViewStoreAdapter {
  readonly routeStore = inject(RouteStore);
  readonly headerStore = inject(HeaderStore);
  readonly dataStore = inject(DataStore);
  readonly filterStore = inject(FilterStore);
  readonly resourceStore = inject(ResourceStore);
  readonly uiStateStore = inject(UIStateStore);

  // additional services needed by adapter methods
  readonly datasetService = inject(DatasetService);
  readonly groupdatasetService = inject(GroupDatasetService);
  readonly selectTableService = inject(SelectTableService);
  readonly snackbarService = inject(SnackbarService);
  readonly shareTagService = inject(ShareTagService);
  readonly matDialog = inject(MatDialog);

  // expose route store properties
  get router() {
    return this.routeStore.router;
  }
  get queryParamMap() {
    return this.routeStore.queryParamMap;
  }
  get searchValue() {
    return this.routeStore.searchValue;
  }
  get searchMode() {
    return this.routeStore.searchMode;
  }
  get currentPage() {
    return this.routeStore.page;
  }
  get sortKey() {
    return this.routeStore.sortKey;
  }
  get queryParamsAsc() {
    return this.routeStore.ascFlag;
  }
  get queryParamsSort() {
    return this.routeStore.sortKey;
  }
  get ascFlag() {
    return this.routeStore.ascFlag;
  }
  patchQuery = (action: any) => this.routeStore.patchQuery(action);
  setPage = (page: number) => this.filterStore.setPage(page);
  prePage = () => this.filterStore.prePage();
  nextPage = () => this.filterStore.nextPage();

  // expose header store properties
  get headerId() {
    return this.headerStore.headerId;
  }
  get themeHeader() {
    return this.headerStore.themeHeader;
  }
  get themeImage() {
    return this.headerStore.themeImage;
  }
  get themeOtherSetting() {
    return this.headerStore.themeOtherSetting;
  }
  get visibleLabelList() {
    return this.headerStore.visibleLabelList;
  }
  get themeDatasetList() {
    return this.headerStore.themeDatasetList;
  }
  get themeTagList() {
    return this.headerStore.themeTagList;
  }

  themeTagListForSelect = computed(() => [
    { seq: -1, shareTagId: '' },
    ...this.headerStore.themeTagList(),
  ]);

  get topCustomValueMap() {
    return this.headerStore.topCustomValueMap;
  }
  get themeTopCustomList() {
    return this.headerStore.themeTopCustomList;
  }
  get seqKey() {
    return this.headerStore.seqKey;
  }
  get defaultKey() {
    return this.headerStore.defaultKey;
  }

  get themeHeaderType() {
    return this.headerStore.themeHeaderType;
  }

  get themeCustomList() {
    return this.headerStore.themeCustomList;
  }

  get displayedColumns() {
    return this.headerStore.displayedColumns;
  }

  get rowColor() {
    return this.headerStore.rowColor;
  }

  // expose data store properties
  get useDataset() {
    return this.dataStore.useDataset;
  }
  get useShareTag() {
    return this.dataStore.useShareTag;
  }
  get useData() {
    return this.dataStore.useData;
  }
  get useDataNameSet() {
    return this.dataStore.useDataNameSet;
  }
  get shareTagValueMap() {
    return this.dataStore.shareTagValueMap;
  }
  get shareTagNameMap() {
    return this.dataStore.shareTagNameMap;
  }
  get shareTagValueList() {
    return this.dataStore.shareTagValueList;
  }
  changeDataset = (event: ThemeDataset) =>
    this.dataStore.changeDataset(event.seq);
  changeShareTag = (event: ThemeTag) =>
    this.dataStore.changeShareTag(event.seq);
  checkVisibleByDataset = (themeLabel: ThemeLabel): boolean =>
    this.dataStore.checkVisibleByDataset(themeLabel);

  // expose filter store properties
  get filterData() {
    return this.filterStore.filterData;
  }
  get viewData() {
    return this.filterStore.viewData;
  }
  get pages() {
    return this.filterStore.pages;
  }
  get pageSize() {
    return this.filterStore.pageSize;
  }
  get sortArray() {
    return this.filterStore.sortArray;
  }
  get sortValue() {
    return this.filterStore.sortValue;
  }
  get totalLength() {
    return this.filterStore.totalLength;
  }
  filterBySearch = () => this.filterStore.filterBySearch();
  onSearch = (text?: string) => {
    this.routeStore.searchValue.set(text ?? '');
    this.routeStore.patchQuery({ type: QueryActionType.search });
  };
  tagValueUpdate = (event: ShareTagValue) => {
    this.dataStore.tagValueUpdate(event);
  };

  // expose resource store properties
  get fileExistResource() {
    return this.resourceStore.fileExistResource;
  }
  get customValueMap() {
    return this.resourceStore.customValueMap;
  }

  // expose UI state store properties
  get hoveredIndex() {
    return this.uiStateStore.hoveredIndex;
  }
  get fixedImagePath() {
    return this.uiStateStore.fixedImagePath;
  }
  get refreshDate() {
    return this.uiStateStore.refreshDate;
  }
  setQuickRefreshResult = (
    datasetName: string,
    byKey: string,
    primeKey: unknown,
    result: Record<string, unknown>
  ) =>
    this.uiStateStore.setQuickRefreshResult(
      datasetName,
      byKey,
      primeKey,
      result
    );
  getQuickRefreshResult = (
    datasetName: string,
    byKey: string,
    primeKey: unknown
  ) => this.uiStateStore.getQuickRefreshResult(datasetName, byKey, primeKey);

  // constants
  readonly RANDOM_KEY = '__random';
  readonly DATASET_NAME_KEY = '__datasetName';

  getTagValueLength(shareTagId: string) {
    const nameList = this.dataStore.useDataNameSet();
    const map = this.dataStore.shareTagValueMap();
    const valueList = map[shareTagId];
    return valueList.filter(x => nameList.has(x)).length;
  }

  compareSort = (a: SortType, b: SortType): boolean =>
    a && b ? a.key === b.key : a === b;
  compareDataset = (a: ThemeDataset, b: ThemeDataset): boolean =>
    a && b ? a.seq === b.seq : a === b;
  compareShareTag = (a: ThemeTag, b: ThemeTag): boolean =>
    a && b ? a.seq === b.seq : a === b;

  // additional methods from original store
  randomSearch() {
    const tag = this.dataStore.useShareTag();
    const data = this.dataStore.useData();
    const defaultKey = this.headerStore.defaultKey();
    const tagValueMap = this.dataStore.shareTagValueMap();
    if (data.length === 0 || !defaultKey) return;

    let candidates: string[];
    if (tag.seq !== -1) {
      const nameSet = new Set(data.map(x => x[defaultKey]));
      candidates = (tagValueMap[tag.shareTagId] ?? []).filter(v =>
        nameSet.has(v)
      );
    } else {
      candidates = data.map(x => x[defaultKey]);
    }

    candidates = candidates
      .filter(value => typeof value === 'string' || typeof value === 'number')
      .map(value => String(value).trim())
      .filter(Boolean);
    if (candidates.length === 0) return;
    const randomNo = getRandomInt(1, candidates.length) - 1;
    this.routeStore.searchValue.set(candidates[randomNo]);
    this.routeStore.patchQuery({ type: QueryActionType.search });
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
    const datasetNames = [...this.dataStore.useDataset().datasetList];
    this.datasetService.refreshDataByNameList(datasetNames).subscribe(x => {
      this.uiStateStore.clearQuickRefreshResults(datasetNames);
      this.dataStore.datasetDataList.reload?.();
      this.uiStateStore.refreshDate.set(new Date());
      this.snackbarService.openI18N('msg.refreshSuccess');
    });
  }

  selectMultipleValue() {
    const searchArr = this.routeStore
      .searchValue()
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
    this.selectTableService
      .selectMultipleValue(
        this.filterStore.autoCompleteList?.() ?? [],
        searchArr
      )
      .subscribe(res => {
        this.routeStore.searchValue.set(res.map((x: any) => x.value).join(','));
        this.routeStore.patchQuery({ type: QueryActionType.search });
      });
  }

  get autoCompleteList() {
    return this.filterStore.autoCompleteList;
  }

  get filterAutoCompleteList() {
    return this.filterStore.filterAutoCompleteList;
  }
}
