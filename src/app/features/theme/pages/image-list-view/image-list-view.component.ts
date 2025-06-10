import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import {
  debounceTime,
  fromEvent,
  Subject,
  switchMap,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import {
  dynamicSort,
  getRandomInt,
  isNotBlank,
  isNumber,
  replaceValue,
  sortSeq,
} from '../../../../shared/util/helper';
import {
  SortType,
  ThemeCustomValueResponse,
  ThemeHeaderType,
  ThemeImage,
  ThemeImageType,
  ThemeTag,
} from '../../models';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReplaceValuePipe } from '../../../../shared/util/util.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { CustomButtonsComponent } from '../../components/custom-buttons/custom-buttons.component';
import { ListBaseViewComponent } from '../../components/list-base-view.component';
import { TopCustomButtonsComponent } from '../../components/top-custom-buttons/top-custom-buttons.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FixedImageComponent } from '../../../../core/components/fixed-image/fixed-image.component';
import {
  ItemTagButtonsComponent,
  ThemeTagUpdate,
} from '../../components/item-tag-buttons/item-tag-buttons.component';

@Component({
  standalone: true,
  imports: [
    MatIconModule,
    ReplaceValuePipe,
    NgOptimizedImage,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollTopComponent,
    MatButtonModule,
    MatTooltipModule,
    ListItemValueComponent,
    CustomButtonsComponent,
    TopCustomButtonsComponent,
    MatAutocompleteModule,
    NgTemplateOutlet,
    FixedImageComponent,
    ItemTagButtonsComponent,
  ],
  selector: 'app-image-list-view',
  templateUrl: 'image-list-view.component.html',
  styleUrl: 'image-list-view.component.scss',
})
export class ImageListViewComponent
  extends ListBaseViewComponent
  implements OnDestroy
{
  override themeHeaderType: ThemeHeaderType = ThemeHeaderType.imageList;
  hoveredIndex: number | null = null;
  pages: number[] = [];
  currentPage = 1;
  sortArray: Array<SortType> = [];
  sortValue: SortType | undefined;
  sortAsc: boolean = true;
  filterData: any;
  viewData: any;
  fixedImagePath = '';

  customValueMap: ThemeCustomValueResponse = {};

  replaceImageUrl = replaceValue;

  @ViewChild('fixedImage') fixedImage!: FixedImageComponent;

  constructor(injector: Injector) {
    super(injector);
  }

  //資料初始化
  override initData() {
    this.changeDataset();
    this.initBaseConfig();
    this.onSearch();
    this.onSort();
    this.changeTag();
    this.updateViewData();
    this.changePage();
    this.getCustomValueMap();
    this.changeQueryParams(); //初始化query params
    this.getFileExist();
    // 監聽query params的變化
    if (!this.routeEventsSub) {
      this.routeEventsSub = this.router.events
        .pipe(debounceTime(100))
        .subscribe(event => {
          console.log('router change');

          this.changeUrl();
          this.changeDataset();
          this.onSearch();
          this.onSort();
          this.changeTag();
          this.updateViewData();
          this.changePage();
          this.getCustomValueMap();
          this.getFileExist();
        });
    }
  }

  //使用query param的資料來設定當前資料的來源,排序,頁數
  override changeUrl() {
    const values = this.route.snapshot.queryParams;
    let { page, searchValue, sort, asc, dataset, tag } = values;
    this.currentPage =
      isNumber(page) && parseInt(page) > 0 ? parseInt(page) : 1;
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

  override changeDatasetAfter() {
    //設定目前使用的資料
    this.autoCompleteList = this.getAutoComplete(this.useData);
  }

  override onSearch() {
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

  override changeTag() {
    if (this.useTag.seq !== -1) {
      const valueList = this.themeTagValueList.find(
        tag => tag.tag === this.useTag.tag
      )!.valueList;
      this.filterData = this.filterData.filter((x: any) =>
        valueList.includes(x[this.defaultKey])
      );
    }
  }

  onSetTag(data: any) {
    this.openSelectTag(data).subscribe(() => this.changeQueryParams());
  }

  initBaseConfig() {
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
    //設定排序資料
    this.sortArray = this.themeLabelList
      .sort(sortSeq)
      .filter(x => x.isSort)
      .map(x => ({ key: x.byKey, label: x.label }));
    if (this.sortArray.length > 0) {
      this.sortArray.push({
        key: this.randomStr,
        label: this.translateService.instant('g.randomSort'),
      });
      const { sort } = this.route.snapshot.queryParams;
      const sortValue = this.sortArray.find(x => x.key === sort);
      this.sortValue =
        isNotBlank(sort) && sortValue ? sortValue : this.sortArray[0];
    }
  }

  changePage() {
    this.pages = [];

    // 設定過濾後的總頁數
    for (let i = 0; i < this.filterData.length / this.pageSize; i++) {
      this.pages.push(i + 1);
    }
    // 如果選擇頁數超過當前的頁數長度則設頁數為1
    if (this.pages.length < this.currentPage && this.currentPage !== 1) {
      this.currentPage = 1;
      this.changeQueryParams();
    }
  }

  /**
   * 改變url的QueryPamas以此來改變資料
   */
  changeQueryParams() {
    if (typeof this.searchValue === 'string') {
      this.searchValue = (this.searchValue + '')
        .split(',')
        .map(x => x.trim())
        .filter(x => isNotBlank(x));
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

  /**
   * 搜尋,頁數或排序改變
   */
  updateViewData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = this.currentPage * this.pageSize;
    // 設定序號
    this.viewData = this.filterData
      .map((x: any, i: number) => {
        if (isNotBlank(this.seqKey)) {
          x[this.seqKey] = i + 1;
        }
        return x;
      })
      .filter((x: any, i: number) => i >= start && i < end);
  }

  //上一頁
  prePage() {
    this.currentPage = parseInt(this.currentPage + '', 10);
    if (this.currentPage - 1 !== 0) {
      this.currentPage -= 1;
      setTimeout(() => this.toTop());
      this.changeQueryParams();
    }
  }
  //下一頁
  nextPage() {
    this.currentPage = parseInt(this.currentPage + '', 10);
    if (this.currentPage + 1 <= this.pages.length) {
      this.currentPage += 1;
      setTimeout(() => this.toTop());
      this.updateViewData();
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

  /**
   * 隨機搜尋
   */
  randomSearch() {
    if (this.useTag.seq !== -1) {
      const nameList = this.useData.map((x: any) => x[this.defaultKey]);
      const valueList = this.themeTagValueList
        .find(tag => tag.tag === this.useTag.tag)!
        .valueList.filter(x => nameList.includes(x));
      const randomNo = getRandomInt(1, valueList.length) - 1;
      this.searchValue = [valueList[randomNo]];
    } else {
      const randomNo = getRandomInt(1, this.useData.length) - 1;
      this.searchValue = [this.useData[randomNo][this.defaultKey]];
    }

    this.changeQueryParams();
  }

  /**
   * 從資料庫取得當前頁面的自定義資料
   */
  getCustomValueMap() {
    if (isNotBlank(this.defaultKey)) {
      const req = {
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
  }

  override searchChange(text?: string) {
    if (typeof this.searchValue === 'string') {
      this.searchValue = (this.searchValue + '')
        .split(',')
        .map(x => x.trim())
        .filter(x => isNotBlank(x));
    }
    if (isNotBlank(text) && !this.searchValue.includes(text!)) {
      this.searchValue = [text!];
    }
    this.changeQueryParams();
  }

  //scroll到最上面
  toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delayViewImg(event: MouseEvent, path: string) {
    const img = event.target as HTMLImageElement;
    this.fixedImagePath = path;
    // 當滑鼠移出圖片時取消顯示計時
    const mouseOut$ = fromEvent(img, 'mouseout');
    timer(1000)
      .pipe(takeUntil(mouseOut$))
      .subscribe(() => {
        this.fixedImage.visible();
      });
  }

  getImageUrl(data: any, themeImage: ThemeImage) {
    let url = '';
    switch (themeImage.type) {
      case 'key':
        url = this.webApi + '/proxy-image?url=' + data[themeImage.imageKey];
        break;
      case 'url':
        url =
          this.webApi +
          '/proxy-image?url=' +
          this.replaceImageUrl(themeImage.imageUrl, data, true);
        break;
    }
    return url;
  }

  checkValueVisible(value: any) {
    if (value === null || value === undefined) {
      return false;
    }
    if (value instanceof Array) {
      return value.length > 0;
    }
    if (typeof value === 'number') {
      return true;
    }
    if (typeof value === 'string') {
      return isNotBlank(value);
    }
    return true;
  }

  tagValueUpdate(event: ThemeTagUpdate) {
    const themeTagValue = this.themeTagValueList.find(x => x.tag === event.tag);
    if (themeTagValue) {
      const index = themeTagValue.valueList.indexOf(event.value);
      if (index > -1) {
        themeTagValue.valueList.splice(index, 1);
        themeTagValue.valueList = [...themeTagValue.valueList];
      } else {
        themeTagValue.valueList = [...themeTagValue.valueList, event.value];
      }
      this.themeTagValueList = [...this.themeTagValueList];
      this.themeService.updateSingleTagValue(themeTagValue).subscribe(() => {
        this.changeQueryParams();
      });
    }
  }
}
