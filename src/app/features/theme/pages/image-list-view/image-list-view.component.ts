import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, filter, Subscription, switchMap, tap } from 'rxjs';
import {
  dynamicSort,
  getRandomInt,
  isBlank,
  isNotBlank,
} from '../../../../shared/util/helper';
import { ThemeService } from '../../services/theme.service';
import {
  SortType,
  ThemeCustom,
  ThemeCustomValueResponse,
  ThemeDataset,
  ThemeHeader,
  ThemeImage,
  ThemeLabel,
  ThemeOtherSetting,
  ThemeTag,
  ThemeTagValue,
} from '../../models';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { LabelValueDirective } from '../../components/label-value.directive';
import { UtilDirective } from '../../../../shared/util/util.directive';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  FileSizePipe,
  ReplaceValuePipe,
} from '../../../../shared/util/util.pipe';
import { Store } from '@ngrx/store';
import { updateTitle } from '../../../../shared/state/layout.actions';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { MatButtonModule } from '@angular/material/button';
import { EditGroupDatasetDataComponent } from '../../../dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import { GroupDatasetService } from '../../../dataset/service/group-dataset.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatasetData } from '../../../dataset/model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ArrayTextComponent } from '../../components/array-text/array-text.component';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { CustomButtonsComponent } from '../../components/custom-buttons/custom-buttons.component';

@Component({
  standalone: true,
  imports: [
    NgTemplateOutlet,
    LabelValueDirective,
    UtilDirective,
    MatIconModule,
    FileSizePipe,
    ReplaceValuePipe,
    NgOptimizedImage,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollTopComponent,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    ArrayTextComponent,
    ListItemValueComponent,
    CustomButtonsComponent,
  ],
  selector: 'app-image-list-view',
  templateUrl: 'image-list-view.component.html',
  styleUrl: 'image-list-view.component.scss',
})
export class ImageListViewComponent implements OnInit, OnDestroy {
  headerId: string = '';
  themeHeader!: ThemeHeader;
  themeImage!: ThemeImage;
  themeOtherSetting!: ThemeOtherSetting;
  themeLabelList!: ThemeLabel[];
  themeDatasetList!: ThemeDataset[];
  themeTagList!: ThemeTag[];
  themeTagListForSelect!: ThemeTag[];
  themeCustomList!: ThemeCustom[];
  themeTagValueList: ThemeTagValue[] = [];
  dataSoure: { themeDataset: ThemeDataset; datasetDataList: DatasetData[] }[] =
    [];
  useDataset!: ThemeDataset;
  datasetSeq: number = -1;
  useTag!: ThemeTag;
  tagSeq: number = -1;
  useData: any;
  filterData: any;
  viewData: any;
  hoveredIndex: number | null = null;
  seqKey = '';
  pages: number[] = [];
  currentPage = 1;
  searchValue: string[] = [];
  sortArray: Array<SortType> = [];
  sortValue: SortType | undefined;
  sortAsc: boolean = true;
  searchLabel: ThemeLabel[] = [];
  defaultKey = '';
  customValueMap: ThemeCustomValueResponse = {};
  randomStr = '__random';
  datasetNameStr = '__datasetName';
  routeParamSub: Subscription | undefined;
  routeEventsSub: Subscription | undefined;
  pageSize = 30;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private store: Store,
    private matDialog: MatDialog,
    private translateService: TranslateService,
    private datasetService: DatasetService,
    private groupdatasetService: GroupDatasetService,
    private selectTableService: SelectTableService
  ) {}

  ngOnInit() {
    this.routeParamSub = this.route.paramMap
      .pipe(debounceTime(100))
      .subscribe(params => {
        this.changeUrl();
        this.headerId = `ThemeHeader:${params.get('name')},${params.get('version')},imageList`;
        if (isBlank(this.headerId)) {
          this.router.navigate(['']);
          return;
        }
        this.themeService.getByHeaderId(this.headerId).subscribe(res => {
          this.themeHeader = res;

          this.themeImage = res.themeImage;
          this.themeOtherSetting = res.themeOtherSetting;
          this.pageSize = this.themeOtherSetting.listPageSize;
          this.themeLabelList = res.themeLabelList.sort((a, b) =>
            a.seq > b.seq ? 1 : -1
          );
          this.themeTagList = res.themeTagList.sort((a, b) =>
            a.seq > b.seq ? 1 : -1
          );
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
          this.defaultKey =
            this.themeLabelList.find(x => x.isDefaultKey)?.byKey ?? '';
          //設定標題
          document.title = this.themeHeader.title;
          this.store.dispatch(updateTitle({ title: this.themeHeader.title }));
          //呼叫取得清單資料
          this.getData();
        });
      });
  }

  // 記得在組件銷毀時取消訂閱
  ngOnDestroy() {
    if (this.routeParamSub) {
      this.routeParamSub.unsubscribe();
    }
    if (this.routeEventsSub) {
      this.routeEventsSub.unsubscribe();
    }
  }

  /**
   * 呼叫取得清單資料
   */
  getData() {
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
        this.dataSoure = this.themeDatasetList.map(themeDataset => {
          var datasetDataList = res.filter(datasetData =>
            themeDataset.datasetList.includes(datasetData.datasetName)
          );
          return { themeDataset, datasetDataList };
        });
        this.initData();
      });
  }
  //資料初始化
  async initData() {
    const values = this.route.snapshot.queryParams;
    let { sort, asc } = values;
    this.changeDataSource();
    //取得序列號的key值
    this.seqKey = this.themeLabelList.find(x => x.type === 'seq')?.byKey ?? '';
    //過濾後的資料
    this.filterData = JSON.parse(JSON.stringify(this.useData));
    //設定序列號
    if (isNotBlank(this.seqKey)) {
      this.filterData = this.filterData.map((x: any, i: number) => {
        x[this.seqKey] = i + 1;
        return x;
      });
    }
    //設定過濾後的頁數
    this.pages = Array.from(
      { length: Math.ceil(this.filterData.length / this.pageSize) },
      (_, index) => index + 1
    );
    //設定排序資料
    this.sortArray = this.themeLabelList
      .sort((a, b) => (a.seq > b.seq ? 1 : -1))
      .filter(x => x.isSort)
      .map(x => ({ key: x.byKey, label: x.label }));
    if (this.sortArray.length > 0) {
      this.sortArray.push({
        key: this.randomStr,
        label: this.translateService.instant('g.randomSort'),
      });
      let sortValue = this.sortArray.find(x => x.key === sort);
      this.sortValue =
        isNotBlank(sort) && sortValue ? sortValue : this.sortArray[0];
    }
    //設定過濾資料欄位
    this.searchLabel = this.themeLabelList.filter(
      x => x.isSearchValue && x.type !== 'seq'
    );

    this.onSearch();
    this.changePage();
    this.changeData();
    await this.changeQueryParams();
    // 監聽url params的變化
    this.routeEventsSub = this.router.events
      .pipe(debounceTime(100))
      .subscribe(event => {
        this.changeUrl();
        this.changeDataSource();
        this.onSearch();
        this.changePage();
        this.changeData();
      });
  }

  //使用query param的資料來設定當前資料的來源,排序,頁數
  changeUrl() {
    const values = this.route.snapshot.queryParams;
    let { page, searchValue, sort, asc, dataset, tag } = values;
    this.currentPage = page ? parseInt(page) : 1;
    this.searchValue = isNotBlank(searchValue) ? searchValue.split(',') : [];
    if (this.sortArray.length > 0 && this.sortArray.find(x => x.key === sort)) {
      this.sortValue = sort
        ? { key: sort, label: this.sortArray.find(x => x.key === sort)!.label }
        : this.sortArray[0];
    }

    this.sortAsc = asc === undefined || asc === 'true';
    this.datasetSeq = dataset ? parseInt(dataset) : -1;
    this.tagSeq = tag ? parseInt(tag) : -1;
  }
  //更改的資料來源
  changeDataSource() {
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
    //設定目前使用的資料
    this.useData = this.dataSoure
      .find(x => x.themeDataset.label === this.useDataset.label)!
      .datasetDataList.map(x => {
        x.data = x.data.map(data => {
          data[this.randomStr] = crypto.getRandomValues(new Uint32Array(1))[0];
          data[this.datasetNameStr] = x.datasetName;
          return data;
        });
        return x.data;
      })
      .flat();
  }

  /**
   * 使用searchValue過濾資料
   */
  onSearch() {
    if (this.searchValue.length === 0) {
      this.searchValue = [];
      this.filterData = this.useData;
    } else if (this.searchLabel.length > 0) {
      // 搜尋值轉小寫搜尋, 先把搜尋資料取出並轉小寫並不能為空值
      const searchValue = this.searchValue.map(x => x.toLocaleLowerCase());
      this.filterData = this.useData.filter((data: any) => {
        return searchValue.every(x => {
          for (const label of this.searchLabel) {
            if (
              label.type === 'stringArray' &&
              Array.isArray(data[label.byKey])
            ) {
              for (const element of data[label.byKey]) {
                const value = element.toLocaleLowerCase();
                if (isNotBlank(element) && value.includes(x)) {
                  return true;
                }
              }
            } else {
              const value = data[label.byKey]?.trim()?.toLowerCase();
              if (isNotBlank(value) && value.includes(x)) {
                return true;
              }
            }
          }
          return false;
        });
      });
    }
  }

  changeTag() {
    if (this.useTag.seq !== -1) {
      const valueList = this.themeTagValueList.find(
        tag => tag.tag === this.useTag.tag
      )!.valueList;
      this.filterData = this.filterData.filter((x: any) =>
        valueList.includes(x[this.defaultKey])
      );
    }
  }

  changePage() {
    this.pages = [];

    // 設定過濾後的總頁數
    for (let i = 0; i < this.filterData.length / this.pageSize; i++) {
      this.pages.push(i + 1);
    }
    // 如果選擇頁數超過當前的頁數長度則設頁數為1
    if (this.pages.length < this.currentPage) {
      this.currentPage = 1;
    }
  }

  /**
   * 改變url的QueryPamas以此來改變資料
   */
  changeQueryParams() {
    if (typeof this.searchValue === 'string') {
      this.searchValue = (this.searchValue + '').split(',').map(x => x.trim());
    }
    let queryParams: { [key: string]: any } = {
      page: this.currentPage,
      searchValue: this.searchValue.join(','),
      dataset: this.useDataset.seq,
      tag: this.useTag.seq,
    };
    if (this.sortArray.length > 0) {
      queryParams['sort'] = this.sortValue?.key?.trim();
      queryParams['asc'] = this.sortAsc;
    }
    return this.router.navigate([], {
      queryParams,
    });
  }
  //scroll到最上面
  toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 搜尋,頁數或排序改變
   */
  changeData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = this.currentPage * this.pageSize;

    // 資料排序
    this.onSort();
    this.changeTag();
    // 設定序號
    this.viewData = this.filterData
      .map((x: any, i: number) => {
        if (isNotBlank(this.seqKey)) {
          x[this.seqKey] = i + 1;
        }
        return x;
      })
      .filter((x: any, i: number) => i >= start && i < end);
    //處理自定義
    if (isNotBlank(this.defaultKey)) {
      this.getCustomValueMap();
    }
  }

  // 當滑鼠進入時更新 hover 狀態
  onMouseEnter(index: number) {
    this.hoveredIndex = index;
  }

  // 當滑鼠離開時清除 hover 狀態
  onMouseLeave(index: number) {
    this.hoveredIndex = null;
  }

  //上一頁
  prePage() {
    this.currentPage = parseInt(this.currentPage + '', 10);
    if (this.currentPage - 1 !== 0) {
      this.currentPage -= 1;
      this.toTop();
      this.changeData();
      this.changeQueryParams();
    }
  }
  //下一頁
  nextPage() {
    this.currentPage = parseInt(this.currentPage + '', 10);
    if (this.currentPage + 1 <= this.pages.length) {
      this.currentPage += 1;
      this.toTop();
      this.changeData();
      this.changeQueryParams();
    }
  }
  //執行排序
  onSort() {
    if (this.sortValue) {
      if (this.sortValue.key === this.randomStr) {
        this.filterData.sort((a: any, b: any) =>
          a[this.randomStr] > b[this.randomStr] ? 1 : -1
        );
      } else {
        this.filterData = this.filterData.sort(
          dynamicSort(this.sortValue.key, this.sortAsc)
        );
      }
    }
  }
  //排序需要正確顯示的資料
  compareSort(a: SortType, b: SortType): boolean {
    return a && b ? a.key === b.key : a === b;
  }
  //資料來源需要正確顯示的資料
  compareDataset(a: ThemeDataset, b: ThemeDataset): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
  compareTag(a: ThemeTag, b: ThemeTag): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
  /**
   * 隨機搜尋
   */
  randomSearch() {
    const randomNo = getRandomInt(1, this.useData.length) - 1;
    this.searchValue = [this.useData[randomNo][this.defaultKey]];
    this.changeQueryParams();
  }

  /**
   * 從資料庫取得自定義資料
   */
  getCustomValueMap() {
    let req = {
      headerId: this.headerId,
      valueList: this.viewData.map((x: any) => x[this.defaultKey]),
    };
    this.themeService.findCustomValue(req).subscribe(res => {
      this.customValueMap = res;
      this.customValueMap = this.viewData
        .map((x: any) => x[this.defaultKey])
        .reduce((a: ThemeCustomValueResponse, b: string) => {
          if (!a.hasOwnProperty(b)) {
            a[b] = {};
          }
          return a;
        }, this.customValueMap);
    });
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

  onSetTag(data: any) {
    const value = data[this.defaultKey];
    const tagList = this.themeTagValueList
      .filter(x => x.valueList.includes(value))
      .map(x => x.tag);
    const selected = this.themeTagList.filter(x => tagList.includes(x.tag));
    this.selectTableService
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
      )
      .subscribe(() => {
        this.changeQueryParams();
      });
  }

  onRefresh() {
    this.datasetService
      .refreshDataByNameList(this.useDataset.datasetList)
      .subscribe(x => {
        this.getData();
      });
  }

  getTagValueLength(tag: string) {
    const tagValue = this.themeTagValueList.find(x => x.tag === tag);
    if (tagValue && this.useData) {
      const list = this.useData.map((x: any) => x[this.defaultKey]);
      return tagValue.valueList.filter(x => list.includes(x)).length;
    }
    return 0;
  }

  searchChange(text: string) {
    if (!this.searchValue.includes(text)) {
      this.searchValue = [...this.searchValue, text];
      this.changeQueryParams();
    }
  }
}
