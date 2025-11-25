import {
  AfterViewInit,
  Component,
  Injector,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  isBlank,
  isNotBlank,
  isNotNull,
  isValidWidth,
} from '../../../../shared/util/helper';
import {
  DEFAULT_ROW_COLOR,
  ThemeCustomValueResponse,
  ThemeHeaderType,
  ThemeLabel,
} from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { FileSizePipe } from '../../../../shared/util/util.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { MatIconModule } from '@angular/material/icon';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { ListBaseViewComponent } from '../../components/list-base-view.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { CustomButtonsComponent } from '../../components/custom-buttons/custom-buttons.component';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { TopCustomButtonsComponent } from '../../components/top-custom-buttons/top-custom-buttons.component';
import {
  concatMap,
  filter,
  from,
  groupBy,
  mergeMap,
  pipe,
  toArray,
} from 'rxjs';
import {
  MatAutocompleteActivatedEvent,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    ScrollTopComponent,
    FileSizePipe,
    TranslateModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    ListItemValueComponent,
    MatTooltipModule,
    MatButtonModule,
    CustomButtonsComponent,
    TopCustomButtonsComponent,
    MatAutocompleteModule,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.scss',
})
export class TableViewComponent
  extends ListBaseViewComponent
  implements OnInit, AfterViewInit
{
  override themeHeaderType: ThemeHeaderType = ThemeHeaderType.table;
  list = new MatTableDataSource<any>();
  isExpand = false;

  rowColor: string[] = DEFAULT_ROW_COLOR;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  customValueMap: ThemeCustomValueResponse = {};

  constructor(injector: Injector) {
    super(injector);
  }

  ngAfterViewInit(): void {
    this.list.sort = this.sort;
    this.list.paginator = this.paginator;
  }

  override initData() {
    this.changeDataset();
    this.seqKey = this.themeLabelList.find(x => x.type === 'seq')?.byKey ?? '';
    //設定序列號
    if (isNotBlank(this.seqKey)) {
      this.list.data = this.list.data.map((x: any, i: number) => {
        x[this.seqKey] = i + 1;
        return x;
      });
    }
  }
  override changeDatasetBefore() {
    this.searchValue = [];
    this.datasetSeq = this.useDataset?.seq
      ? parseInt(this.useDataset.seq + '')
      : -1;
  }
  override changeDatasetAfter() {
    this.list.data = this.useData;
    this.autoCompleteList = this.getAutoComplete(this.list.data);
    this.doTableColor();
    this.getCustomValueMap();
  }

  override onSearch() {
    if (this.searchValue.length === 0) {
      this.searchValue = [];
      this.list.data = this.useData;
    } else if (this.searchLabel.length > 0) {
      // 搜尋值轉小寫搜尋, 先把搜尋資料取出並轉小寫並不能為空值
      const searchValue = this.searchValue.map(x => x.toLocaleLowerCase());
      this.list.data = this.useData.filter((data: any) => {
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
    this.doTableColor();
    this.getCustomValueMap();
  }

  // 改變當前選擇的標籤 url上的
  override changeTag() {
    this.searchChange();
    if (this.useTag.seq !== -1) {
      const valueList = this.shareTagValueMap[this.useTag.shareTagId];
      this.list.data = this.list.data.filter((x: any) =>
        valueList.includes(x[this.defaultKey])
      );
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
    this.onSearch();
  }

  fileSizeTotal(byKey: string): number {
    return this.list.data
      .map(x => {
        let value = x[byKey];
        if (typeof value === 'number') {
          return value;
        } else if (
          typeof value === 'string' &&
          !Number.isNaN(parseInt(value))
        ) {
          return parseInt(value);
        }
        return 0;
      })
      .reduce((a, b) => a + b, 0);
  }

  doTableColor() {
    if (isNotBlank(this.defaultKey) && this.rowColor.length > 0) {
      const keyMap: { [key in string]: string } = {};

      this.list.data.forEach((data, index) => {
        const key = data[this.defaultKey].toUpperCase();
        if (isBlank(keyMap[key])) {
          keyMap[key] = this.rowColor[index % this.rowColor.length];
        }
        data[this.colorStr] = keyMap[key];
      });
    }
  }

  getWidth(element: ThemeLabel, type: 'width' | 'maxWidth' | 'minWidth') {
    if (isNotBlank(element[type]) && isValidWidth(element[type])) {
      return element[type];
    }
    return 'auto';
  }
  onSetTag(data: any) {
    this.openSelectTag(data).subscribe(() => {
      this.changeTag();
    });
  }
  /**
   * 從資料庫取得當前頁面的自定義資料
   */
  getCustomValueMap() {
    // if (isNotBlank(this.defaultKey)) {
    //   const req = {
    //     headerId: this.headerId,
    //     valueList: this.list.data.map((x: any) => x[this.defaultKey]),
    //   };
    //   this.themeService.findCustomValue(req).subscribe(res => {
    //     this.customValueMap = res;
    //     this.customValueMap = this.list.data
    //       .map((x: any) => x[this.defaultKey])
    //       .reduce((a: ThemeCustomValueResponse, b: string) => {
    //         if (!a.hasOwnProperty(b)) {
    //           a[b] = {};
    //         }
    //         return a;
    //       }, this.customValueMap);
    //   });
    // }
  }

  showDuplicate() {
    const dataList = this.datasetDataMap
      .flatMap(x => x.datasetDataList)
      .filter(
        (v, i, arr) => arr.findIndex(z => z.datasetName === v.datasetName) === i
      )
      .flatMap(x => x.data);
    from(dataList)
      .pipe(
        // 排序-檔名
        groupBy(data => data[this.defaultKey]),
        // 每筆資料轉為陣列
        mergeMap(group => group.pipe(toArray())),
        // 資料大於為重複
        filter(data => data.length > 1),
        // 取出所有陣列資料
        concatMap(data => from(data)),
        // 將所有資料合併為同一陣列
        toArray()
      )
      .subscribe((data: any[]) => {
        this.list.data = data;
        this.doTableColor();
      });
  }
}
