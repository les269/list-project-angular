import { Component, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import { debounceTime, filter, pipe, Subscription, switchMap, tap } from 'rxjs';
import { updateTitle } from '../../../shared/state/layout.actions';
import {
  groupBy,
  isBlank,
  isNotBlank,
  replaceValue,
  sortSeq,
} from '../../../shared/util/helper';
import {
  ThemeHeader,
  ThemeImage,
  ThemeOtherSetting,
  ThemeLabel,
  ThemeDataset,
  ThemeTag,
  ThemeCustom,
  ThemeHeaderType,
  SortType,
  ThemeTopCustomValueResponse,
  ThemeTopCustom,
  ShareTag,
  ShareTagValue,
} from '../models';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { Store } from '@ngrx/store';
import { DatasetService } from '../../dataset/service/dataset.service';
import { DatasetData } from '../../dataset/model';
import { EditGroupDatasetDataComponent } from '../../dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import { MatDialog } from '@angular/material/dialog';
import { GroupDatasetService } from '../../dataset/service/group-dataset.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { api } from '../../../../environments/environment';
import { FileService } from '../../../core/services/file.service';
import { ShareTagService } from '../services/share-tag.service';

@Component({
  standalone: true,
  imports: [],
  selector: 'app-list-base-view',
  template: ``,
})
export class ListBaseViewComponent implements OnInit, OnDestroy {
  themeHeaderType: ThemeHeaderType = ThemeHeaderType.imageList;
  headerId: string = '';
  themeHeader!: ThemeHeader;
  themeImage!: ThemeImage;
  themeOtherSetting!: ThemeOtherSetting;
  themeLabelList!: ThemeLabel[];
  themeDatasetList!: ThemeDataset[];
  themeTagList!: ThemeTag[];
  themeTagListForSelect!: ThemeTag[];
  themeCustomList!: ThemeCustom[];
  themeTopCustomList!: ThemeTopCustom[];
  displayedColumns: string[] = [];
  datasetDataMap: {
    themeDataset: ThemeDataset;
    datasetDataList: DatasetData[];
  }[] = [];
  searchLabel: ThemeLabel[] = [];
  useDataset!: ThemeDataset;
  datasetSeq: number = -1;
  searchValue: string[] = [];
  tagSeq: number = -1;
  useTag!: ThemeTag;
  useData: any;
  topCustomValueMap: ThemeTopCustomValueResponse = {};
  autoCompleteList: string[] = [];
  fileExist: { [key in string]: boolean } = {};
  shareTags: ShareTag[] = [];
  shareTagNameMap: { [key in string]: string } = {};
  shareTagValueMap: { [key in string]: string[] } = {};

  seqKey = '';
  defaultKey: string = '';
  pageSize: number = 30;

  randomStr = '__random';
  datasetNameStr = '__datasetName';
  colorStr = '__color';
  refreshDate = signal<Date>(new Date());

  webApi = api;

  routeParamSub: Subscription | undefined;
  routeEventsSub: Subscription | undefined;

  themeService: ThemeService;
  router: Router;
  route: ActivatedRoute;
  store: Store;
  datasetService: DatasetService;
  matDialog: MatDialog;
  groupdatasetService: GroupDatasetService;
  selectTableService: SelectTableService;
  translateService: TranslateService;
  snackbarService: SnackbarService;
  fileService: FileService;
  shareTagService: ShareTagService;
  constructor(protected injector: Injector) {
    this.themeService = this.injector.get(ThemeService);
    this.router = this.injector.get(Router);
    this.route = this.injector.get(ActivatedRoute);
    this.store = this.injector.get(Store);
    this.datasetService = this.injector.get(DatasetService);
    this.matDialog = this.injector.get(MatDialog);
    this.groupdatasetService = this.injector.get(GroupDatasetService);
    this.selectTableService = this.injector.get(SelectTableService);
    this.translateService = this.injector.get(TranslateService);
    this.snackbarService = this.injector.get(SnackbarService);
    this.fileService = this.injector.get(FileService);
    this.shareTagService = this.injector.get(ShareTagService);
  }

  ngOnInit() {
    this.routeParamSub = this.route.paramMap
      .pipe(debounceTime(100))
      .subscribe(params => {
        this.changeUrl();
        this.headerId = `ThemeHeader:${params.get('name')},${params.get('version')},${this.themeHeaderType}`;
        if (isBlank(this.headerId)) {
          this.router.navigate(['']);
          return;
        }
        this.themeService.getByHeaderId(this.headerId).subscribe(res => {
          this.themeHeader = res;

          this.themeImage = res.themeImage;
          this.themeOtherSetting = res.themeOtherSetting;
          this.pageSize = this.themeOtherSetting.listPageSize;
          this.themeLabelList = res.themeLabelList
            .sort(sortSeq)
            .filter(x => x.isVisible);
          this.displayedColumns = [
            ...this.themeLabelList.map(x => x.byKey),
            'other',
          ];
          this.themeTagList = res.themeTagList
            .map(x => {
              x.seq = parseInt(x.seq + '');
              return x;
            })
            .sort(sortSeq);

          this.themeTagListForSelect = [
            { seq: -1, shareTagId: '' },
            ...this.themeTagList,
          ];
          this.themeDatasetList = res.themeDatasetList.sort(sortSeq);
          this.themeCustomList = res.themeCustomList.sort(sortSeq);
          this.themeTopCustomList =
            res.themeOtherSetting.themeTopCustomList.sort(sortSeq);
          this.defaultKey =
            this.themeLabelList.find(x => x.isDefaultKey)?.byKey ?? '';
          //設定標題
          document.title = this.themeHeader.title;
          this.store.dispatch(updateTitle({ title: this.themeHeader.title }));
          //呼叫取得清單資料
          this.getDataSoure();
          this.getTopCustomValueMap();
          this.getShareTagList();
        });
      });
  }

  ngOnDestroy() {
    if (this.routeParamSub) {
      this.routeParamSub.unsubscribe();
    }
    if (this.routeEventsSub) {
      this.routeEventsSub.unsubscribe();
    }
  }

  getDataSoure() {
    //取得dataset的name並去除重複
    const uniqueDatasetList = Array.from(
      new Set(this.themeDatasetList.flatMap(x => x.datasetList))
    );
    const tagIds = this.themeTagList.map(t => t.shareTagId);
    this.shareTagService
      .getShareTagValues(tagIds)
      .pipe(
        tap(x => {
          const grouped = groupBy(x, v => v.shareTagId);
          this.shareTagValueMap = Object.fromEntries(
            Object.entries(grouped).map(([k, arr]) => [
              k,
              arr.map(a => a.value),
            ])
          );
          for (const tagId of tagIds) {
            if (!this.shareTagValueMap[tagId]) {
              this.shareTagValueMap[tagId] = [];
            }
          }
        }),
        switchMap(x =>
          this.datasetService.findDatasetDataByNameList(uniqueDatasetList)
        ),
        tap(res => {
          this.datasetDataMap = this.themeDatasetList.map(themeDataset => {
            var datasetDataList = res.filter(datasetData =>
              themeDataset.datasetList.includes(datasetData.datasetName)
            );
            return { themeDataset, datasetDataList };
          });
          //設定過濾資料欄位
          this.searchLabel = this.themeLabelList.filter(
            x => x.isSearchValue && x.type !== 'seq'
          );
        })
      )
      .subscribe(values => {
        this.initData();
      });
  }

  getTopCustomValueMap() {
    this.themeService.findTopCustomValue(this.headerId).subscribe(x => {
      this.topCustomValueMap = x;
    });
  }

  changeDataset() {
    this.changeDatasetBefore();
    const defaultDataset = this.themeDatasetList.find(x => x.isDefault);
    if (
      this.datasetSeq !== -1 &&
      this.datasetSeq <= this.themeDatasetList.length
    ) {
      this.useDataset = this.themeDatasetList[this.datasetSeq - 1];
    } else if (defaultDataset) {
      this.useDataset = defaultDataset;
    } else if (this.themeDatasetList.length > 0) {
      this.useDataset = this.themeDatasetList[0];
    }
    if (this.tagSeq === -1) {
      this.useTag = { seq: -1, shareTagId: '' };
    } else {
      this.useTag = this.themeTagListForSelect[this.tagSeq];
    }
    this.useData = this.datasetDataMap
      .find(x => x.themeDataset.label === this.useDataset.label)!
      .datasetDataList.map(x => {
        x.data = x.data.map(data => {
          if (!data[this.randomStr]) {
            data[this.randomStr] = crypto.getRandomValues(
              new Uint32Array(1)
            )[0];
          }

          data[this.datasetNameStr] = x.datasetName;
          return data;
        });
        return x.data;
      })
      .flat();
    this.changeDatasetAfter();
  }

  openEditData(data: any) {
    this.datasetService
      .findDataset(data[this.datasetNameStr])
      .pipe(
        switchMap(x =>
          this.groupdatasetService.getGroupDataset(x.config.groupName)
        )
      )
      .subscribe(x => {
        this.matDialog.open(EditGroupDatasetDataComponent, {
          data: {
            groupName: x.groupName,
            primeValue: data[x.config.byKey],
          },
          minWidth: '60vw',
          autoFocus: false,
        });
      });
  }

  openSelectTag(data: any) {
    const value = data[this.defaultKey];
    const selected = Object.entries(this.shareTagValueMap)
      .filter(([shareTagId, valueList]) => valueList.includes(value))
      .map(
        ([shareTagId, valueList]) =>
          this.shareTags.find(x => x.shareTagId === shareTagId)!
      );
    return this.selectTableService.selectMutipleTag(this.shareTags, selected);
  }

  onRefresh() {
    this.datasetService
      .refreshDataByNameList(this.useDataset.datasetList)
      .subscribe(x => {
        this.getDataSoure();
        this.refreshDate.set(new Date());
        this.snackbarService.openByI18N('msg.refreshSuccess');
      });
  }

  compareSort(a: SortType, b: SortType): boolean {
    return a && b ? a.key === b.key : a === b;
  }
  compareDataset(a: ThemeDataset, b: ThemeDataset): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
  compareTag(a: ThemeTag, b: ThemeTag): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }

  getTagValueLength(shareTagId: string) {
    const valueList = this.shareTagValueMap[shareTagId];
    if (valueList && this.useData) {
      const nameList = this.useData.map((x: any) => x[this.defaultKey]);
      return valueList.filter(x => nameList.includes(x)).length;
    }
    return 0;
  }

  getAutoComplete(data: any[]): string[] {
    const autoCompleteSet = new Set<string>();
    for (const label of this.themeLabelList) {
      if (label.isSearchValue && label.autoComplete) {
        switch (label.type) {
          case 'stringArray':
            data.forEach(item => {
              const values = item[label.byKey];
              if (Array.isArray(values)) {
                values.forEach(value => autoCompleteSet.add(value));
              }
            });
            break;

          case 'stringSplit':
            data.forEach(item => {
              const value = item[label.byKey];
              if (typeof value === 'string') {
                value
                  .split(label.splitBy)
                  .forEach(splitValue => autoCompleteSet.add(splitValue));
              }
            });
            break;

          default:
            data.forEach(item => {
              const value = item[label.byKey];
              if (isNotBlank(value)) {
                autoCompleteSet.add(value);
              }
            });
            break;
        }
      }
    }
    return Array.from(autoCompleteSet);
  }

  filterAutoCompleteList(): string[] {
    let lastElement = '';
    if (typeof this.searchValue === 'string') {
      lastElement = (this.searchValue + '').split(',').slice(-1)[0]!;
    } else if (this.searchValue.length > 0) {
      lastElement = this.searchValue.slice(-1)[0];
    }
    lastElement = lastElement.toLocaleLowerCase();
    return this.autoCompleteList.filter(x =>
      x.toLowerCase().includes(lastElement)
    );
  }

  selectMultipleValue() {
    this.selectTableService
      .selectMultipleValue(this.autoCompleteList, this.searchValue)
      .subscribe(res => {
        this.searchValue = res.map(x => x.value);
        this.searchChange();
      });
  }

  getFileExist() {
    const { checkFileExist } = this.themeOtherSetting;
    if (isNotBlank(checkFileExist) && isNotBlank(this.defaultKey)) {
      const req = this.useData.map((x: any) => ({
        path: replaceValue(checkFileExist, x),
        name: x[this.defaultKey],
      }));
      this.fileService.fileExist(req).subscribe(x => {
        this.fileExist = x;
      });
    }
  }

  initData() {
    // This method is intentionally left blank for child classes to override.
  }
  changeDatasetBefore() {
    // This method is intentionally left blank for child classes to override.
  }
  changeDatasetAfter() {
    // This method is intentionally left blank for child classes to override.
  }
  onSearch() {
    // This method is intentionally left blank for child classes to override.
  }
  changeTag() {
    // This method is intentionally left blank for child classes to override.
  }
  changeUrl() {
    // This method is intentionally left blank for child classes to override.
  }

  searchChange(text?: string) {}

  getShareTagList() {
    this.shareTagService.getAllTag().subscribe(tags => {
      this.shareTags = tags.filter(t =>
        this.themeTagList.some(tt => tt.shareTagId === t.shareTagId)
      );
      this.shareTagNameMap = {};
      for (const element of tags) {
        this.shareTagNameMap[element.shareTagId] = element.shareTagName;
      }
    });
  }
}
