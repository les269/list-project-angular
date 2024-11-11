import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, filter, Subscription, switchMap, tap } from 'rxjs';
import { updateTitle } from '../../../shared/state/layout.actions';
import { isBlank, isNotBlank } from '../../../shared/util/helper';
import {
  ThemeHeader,
  ThemeImage,
  ThemeOtherSetting,
  ThemeLabel,
  ThemeDataset,
  ThemeTag,
  ThemeCustom,
  ThemeTagValue,
  ThemeHeaderType,
  SortType,
  ThemeTopCustomValueResponse,
  ThemeTopCustom,
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
import { api } from '../../../../environments/environments';

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
  themeTagValueList: ThemeTagValue[] = [];
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

  seqKey = '';
  defaultKey: string = '';
  pageSize: number = 30;

  randomStr = '__random';
  datasetNameStr = '__datasetName';
  colorStr = '__color';

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
            .sort((a, b) => (a.seq > b.seq ? 1 : -1))
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
            .sort((a, b) => (a.seq > b.seq ? 1 : -1));

          this.themeTagListForSelect = [
            { seq: -1, tag: '' },
            ...this.themeTagList,
          ];
          this.themeDatasetList = res.themeDatasetList.sort((a, b) =>
            a.seq > b.seq ? 1 : -1
          );
          this.themeCustomList = res.themeCustomList.sort((a, b) =>
            a.seq > b.seq ? 1 : -1
          );
          this.themeTopCustomList =
            res.themeOtherSetting.themeTopCustomList.sort((a, b) =>
              a.seq > b.seq ? 1 : -1
            );
          this.defaultKey =
            this.themeLabelList.find(x => x.isDefaultKey)?.byKey ?? '';
          //設定標題
          document.title = this.themeHeader.title;
          this.store.dispatch(updateTitle({ title: this.themeHeader.title }));
          //呼叫取得清單資料
          this.getDataSoure();
          this.getTopCustomValueMap();
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
    this.themeService
      .getTagValueList(this.headerId)
      .pipe(
        tap(res => {
          this.themeTagValueList = res;
        }),
        switchMap(x =>
          this.datasetService.findDatasetDataByNameList(uniqueDatasetList)
        )
      )
      .subscribe(res => {
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
      this.useTag = { seq: -1, tag: '' };
    } else {
      this.useTag = this.themeTagListForSelect[this.tagSeq];
    }

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
    const tagList = this.themeTagValueList
      .filter(x => x.valueList.includes(value))
      .map(x => x.tag);
    const selected = this.themeTagList.filter(x => tagList.includes(x.tag));
    return this.selectTableService
      .selectMutipleTag(this.themeTagList, selected)
      .pipe(
        filter(res => res !== undefined),
        switchMap(res => {
          this.themeTagValueList = this.themeTagValueList.map(x => {
            x.valueList = x.valueList.filter(x => x !== value);
            if (res.find(y => x.tag === y.tag)) {
              x.valueList.push(value);
            }
            return x;
          });
          return this.themeService.updateTagValueList(this.themeTagValueList);
        })
      );
  }

  onRefresh() {
    this.datasetService
      .refreshDataByNameList(this.useDataset.datasetList)
      .subscribe(x => {
        this.getDataSoure();
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

  getTagValueLength(tag: string) {
    const tagValue = this.themeTagValueList.find(x => x.tag === tag);
    if (tagValue && this.useData) {
      const list = this.useData.map((x: any) => x[this.defaultKey]);
      return tagValue.valueList.filter(x => list.includes(x)).length;
    }
    return 0;
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
}
