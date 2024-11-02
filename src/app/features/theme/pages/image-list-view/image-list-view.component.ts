import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  concatMap,
  debounceTime,
  from,
  map,
  Subscription,
  toArray,
} from 'rxjs';
import {
  dynamicSort,
  getRandomInt,
  isBlank,
  isNotBlank,
  isNotNull,
  isNull,
  replaceValue,
} from '../../../../shared/util/helper';
import { ThemeService } from '../../services/theme.service';
import {
  SortType,
  ThemeCustom,
  ThemeCustomValue,
  ThemeCustomValueResponse,
  ThemeDB,
  ThemeHeader,
  ThemeImage,
  ThemeLabel,
} from '../../models';
import { HttpClient } from '@angular/common/http';
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
import { ScrollTopComponent } from '../../../../core/components/scroll-top.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ButtonInputUrlDialog } from '../../components/button-input-url.dialog';
import { WriteNoteDialog } from '../../components/write-note.dialog';
import { ApiConfigService } from '../../../api-config/service/api-config.service';

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
  ],
  selector: 'app-image-list-view',
  templateUrl: 'image-list-view.component.html',
  styleUrl: 'image-list-view.component.scss',
})
export class ImageListViewComponent implements OnInit {
  headerId: string = '';
  themeHeader!: ThemeHeader;
  themeImage!: ThemeImage;
  themeLabelList!: ThemeLabel[];
  themeDBList!: ThemeDB[];
  themeCustomList!: ThemeCustom[];
  dataSoure: { db: ThemeDB; data: any }[] = [];
  useDB!: ThemeDB;
  dbSeq: number = -1;
  useData: any;
  filterData: any;
  viewData: any;
  hoveredIndex: number | null = null;
  seqKey = '';
  pages: number[] = [];
  currentPage = 1;
  searchValue = '';
  sortArray: Array<SortType> = [];
  sortValue: SortType | undefined;
  sortAsc: boolean = true;
  searchKey: string[] = [];
  defaultKey = '';
  customValueMap: ThemeCustomValueResponse = {};
  randomStr = 'random';
  routeParamSub: Subscription | undefined;
  routeEventsSub: Subscription | undefined;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private readonly http: HttpClient,
    private snackbarService: SnackbarService,
    private store: Store,
    private matDialog: MatDialog,
    private translateService: TranslateService,
    private apiConfigService: ApiConfigService
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
          this.themeLabelList = res.themeLabelList.sort((a, b) =>
            a.seq > b.seq ? 1 : -1
          );
          this.themeDBList = res.themeDBList.sort((a, b) =>
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
    let jsonList = this.themeDBList.filter(x => x.type === 'json');
    from(jsonList)
      .pipe(
        //concatMap按照順序訂閱並發出,避免一次性發出而失敗
        concatMap((x, i) =>
          this.http.get(x.source).pipe(
            map((res: any) => {
              res = res.map((x: any) => {
                x[this.randomStr] = crypto.getRandomValues(
                  new Uint32Array(1)
                )[0];
                return x;
              });
              return { db: x, data: res };
            })
          )
        ),
        toArray()
      )
      .subscribe(res => {
        //全部資料
        this.dataSoure = res;
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
      { length: Math.ceil(this.filterData.length / 30) },
      (_, index) => index + 1
    );
    //設定排序資料
    this.sortArray = this.themeLabelList
      .sort((a, b) => (a.seq > b.seq ? 1 : -1))
      .filter(x => x.isSort)
      .map(x => ({ key: x.byKey, label: x.label }));
    if (this.sortArray.length > 0) {
      this.sortArray.push({
        key: 'random',
        label: this.translateService.instant('g.randomSort'),
      });
      let sortValue = this.sortArray.find(x => x.key === sort);
      this.sortValue =
        isNotBlank(sort) && sortValue ? sortValue : this.sortArray[0];
    }
    //設定過濾資料欄位
    this.searchKey = this.themeLabelList
      .filter(x => x.isSearchValue && x.type !== 'seq')
      .map(x => x.byKey);

    this.onSearch();
    this.changeData();
    await this.changeQueryParams();
    // 監聽url params的變化
    this.routeEventsSub = this.router.events
      .pipe(debounceTime(100))
      .subscribe(event => {
        this.changeUrl();
        this.changeDataSource();
        this.onSearch();
        this.changeData();
      });
  }

  //使用query param的資料來設定當前資料的來源,排序,頁數
  changeUrl() {
    const values = this.route.snapshot.queryParams;
    let { page, searchValue, sort, asc, db } = values;
    this.currentPage = page ? parseInt(page) : 1;
    this.searchValue = searchValue ? searchValue : '';
    if (this.sortArray.length > 0 && this.sortArray.find(x => x.key === sort)) {
      this.sortValue = sort
        ? { key: sort, label: this.sortArray.find(x => x.key === sort)!.label }
        : this.sortArray[0];
    }

    this.sortAsc = asc === undefined || asc === 'true';
    this.dbSeq = db ? parseInt(db) : -1;
  }
  //更改的資料來源
  changeDataSource() {
    //1.當query param的db數值不為-1且數值不可超過themeDBList的長度,這時使用query param的db來指定資料
    //2.當沒有db數值或為錯誤檢查是否有預設使用的,有則使用
    let defaultDB = this.themeDBList.find(x => x.isDefault);
    if (this.dbSeq !== -1 && this.dbSeq <= this.themeDBList.length) {
      this.useDB = this.themeDBList[this.dbSeq - 1];
    } else if (defaultDB) {
      this.useDB = defaultDB;
    } else {
      this.useDB = this.themeDBList[0];
    }
    //設定目前使用的資料
    if (this.useDB.type === 'group') {
      this.useData = this.useDB.source
        .split(',')
        .map(
          group =>
            this.dataSoure.find(
              x => x.db.type !== 'group' && x.db.groups === group
            )?.data
        )
        .filter(x => x)
        .flat();
    } else {
      this.useData = this.dataSoure.find(x => x.db === this.useDB)!.data;
    }
  }

  /**
   * 使用searchValue過濾資料
   */
  onSearch() {
    this.searchValue = this.searchValue.trim();
    if (isBlank(this.searchValue)) {
      this.searchValue = '';
      this.filterData = this.useData;
    } else if (this.searchKey.length > 0) {
      // 搜尋值轉小寫搜尋, 先把搜尋資料取出並轉小寫並不能為空值
      const searchValue = this.searchValue.toLocaleLowerCase();
      this.filterData = this.useData.filter((data: any) => {
        return this.searchKey
          .map(key => data[key]?.trim()?.toLowerCase())
          .filter(x => isNotBlank(x))
          .find(x => x.indexOf(searchValue) !== -1);
      });
    }
    this.pages = [];

    // 設定過濾後的總頁數
    for (let i = 0; i < this.filterData.length / 30; i++) {
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
    let queryParams: { [key: string]: any } = {
      page: this.currentPage,
      searchValue: this.searchValue,
      db: this.useDB.seq,
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
    const start = (this.currentPage - 1) * 30;
    const end = this.currentPage * 30;

    // 資料排序
    this.onSort();
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

  getStringSplit(label: ThemeLabel, view: any): string[] {
    if (isBlank(view[label.byKey])) {
      return [];
    }
    return view[label.byKey]
      .split(label.splitBy)
      .filter((x: string) => isNotBlank(x))
      .map((x: string) => x.trim());
  }

  // 當滑鼠進入時更新 hover 狀態
  onMouseEnter(index: number) {
    this.hoveredIndex = index;
  }

  // 當滑鼠離開時清除 hover 狀態
  onMouseLeave(index: number) {
    this.hoveredIndex = null;
  }

  /**
   * 複製到剪貼簿
   * @param text
   */
  copyText(text: string) {
    navigator.clipboard.writeText(text);
    this.snackbarService.openByI18N('msg.copyText', { text });
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
  compareDB(a: ThemeDB, b: ThemeDB): boolean {
    return a && b ? a.seq === b.seq : a === b;
  }
  /**
   * 隨機搜尋
   */
  randomSearch() {
    const randomNo = getRandomInt(1, this.useData.length) - 1;
    this.searchValue = this.useData[randomNo][this.defaultKey];
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

  getCustomValue(data: any, custom: ThemeCustom) {
    if (this.checkCustomValueExist(data, custom)) {
      return this.customValueMap[data[this.defaultKey]][custom.byKey];
    }
    return '';
  }

  /**
   * 取得UI要使用的自定義資料的字串
   * @param data
   * @param custom
   * @returns
   */
  getCustomValueForUI(data: any, custom: ThemeCustom) {
    let result: any = '';
    let value = '';
    if (this.checkCustomValueExist(data, custom)) {
      value = this.customValueMap[data[this.defaultKey]][custom.byKey];
    }

    switch (custom.type) {
      case 'buttonIconBoolean':
        if (isBlank(value) || value === 'true') {
          result = custom.buttonIconTrue;
        } else {
          result = custom.buttonIconFalse;
        }
        break;
      case 'buttonIconFill':
        result = value === 'true';
        break;
    }
    return result;
  }

  /**
   * 檢查是否有存在自訂字串
   * @param data
   * @param custom
   * @returns
   */
  checkCustomValueExist(data: any, custom: ThemeCustom): boolean {
    if (
      isBlank(this.defaultKey) ||
      isBlank(data[this.defaultKey]) ||
      isNull(this.customValueMap[data[this.defaultKey]]) ||
      isNull(this.customValueMap[data[this.defaultKey]][custom.byKey])
    ) {
      return false;
    }
    return true;
  }

  /**
   * 執行更新自定義字串
   * @param custom
   * @param data
   * @param value
   */
  changeCustomValue(data: any, custom: ThemeCustom, value?: any) {
    let req: ThemeCustomValue = {
      headerId: this.headerId,
      byKey: custom.byKey,
      correspondDataValue: data[this.defaultKey],
      customValue: value,
    };
    let x = this.getCustomValue(data, custom);
    //定義每種資料改變方式
    switch (custom.type) {
      case 'buttonIconBoolean':
        req.customValue = isBlank(x) || x === 'true' ? 'false' : 'true';
        break;
      case 'buttonIconFill':
        req.customValue = !(x === 'true') + '';
        break;
      case 'buttonInputUrl':
        req.customValue = value;
        break;
    }

    this.themeService.updateCustomValue(req).subscribe(() => {
      this.customValueMap[req.correspondDataValue][req.byKey] = req.customValue;
    });
  }

  openButtonInputUrlDialog(data: any, custom: ThemeCustom) {
    const dialogRef = this.matDialog.open(ButtonInputUrlDialog, {
      width: '600px',
      data: this.getCustomValue(data, custom),
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isNotNull(result)) {
        this.changeCustomValue(data, custom, result);
      }
    });
  }

  openNewPage(text: string) {
    window.open(text, '_blank');
  }

  onCopyValue(data: any, custom: ThemeCustom) {
    this.copyText(replaceValue(custom.copyValue, data));
  }

  onOpenUrl(data: any, custom: ThemeCustom) {
    this.openNewPage(replaceValue(custom.openUrl, data));
  }

  openWriteNoteDialog(data: any, custom: ThemeCustom, disabled: boolean) {
    const dialogRef = this.matDialog.open(WriteNoteDialog, {
      data: { value: this.getCustomValue(data, custom) ?? '', disabled },
      width: '60vw',
      height: '80vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isNotNull(result)) {
        this.changeCustomValue(data, custom, result);
      }
    });
  }

  callApi(data: any, custom: ThemeCustom) {
    if (custom.apiConfig) {
      this.apiConfigService.callSingleApi(custom.apiConfig, data);
    }
  }
}
