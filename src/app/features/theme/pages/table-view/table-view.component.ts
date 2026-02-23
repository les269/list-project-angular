import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ListBaseViewStoreAdapter } from '../../stores/list-base-view.adapter';
import { DataStore } from '../../stores/data.store';
import { FilterStore } from '../../stores/filter.store';
import { HeaderStore } from '../../stores/header.store';
import { ResourceStore } from '../../stores/resource.store';
import { RouteStore } from '../../stores/route.store';
import { UIStateStore } from '../../stores/ui.state.store';

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
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl },
    ListBaseViewStoreAdapter,
    RouteStore,
    HeaderStore,
    DataStore,
    FilterStore,
    ResourceStore,
    UIStateStore,
  ],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.scss',
})
export class TableViewComponent implements AfterViewInit {
  readonly store = inject(ListBaseViewStoreAdapter);

  readonly list = new MatTableDataSource<any>();

  readonly COLOR_KEY = '__color';
  readonly rowColor: string[] = DEFAULT_ROW_COLOR;

  readonly isExpand = signal(false);
  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  readonly displayedColumns = this.store.displayedColumns();
  ngAfterViewInit(): void {
    this.list.sort = this.sort();
    this.list.paginator = this.paginator();
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
    const defaultKey = this.store.defaultKey();
    if (isNotBlank(defaultKey) && this.rowColor.length > 0) {
      const keyMap: { [key in string]: string } = {};

      this.list.data.forEach((data, index) => {
        const key = data[defaultKey].toUpperCase();
        if (isBlank(keyMap[key])) {
          keyMap[key] = this.rowColor[index % this.rowColor.length];
        }
        data[this.COLOR_KEY] = keyMap[key];
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
    // this.openSelectTag(data).subscribe(() => {
    // });
  }
  openSelectTag(data: any) {
    // const value = data[this.defaultKey()];
    // const selected = Object.entries(this.shareTagValueMap)
    //   .filter(([shareTagId, valueList]) => valueList.includes(value))
    //   .map(
    //     ([shareTagId, valueList]) =>
    //       this.shareTags().find(x => x.shareTagId === shareTagId)!
    //   );
    // return this.selectTableService.selectMutipleTag(this.shareTags(), selected);
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
    // const dataList = this.datasetDataMap()
    //   .flatMap(x => x.datasetDataList)
    //   .filter(
    //     (v, i, arr) => arr.findIndex(z => z.datasetName === v.datasetName) === i
    //   )
    //   .flatMap(x => x.data);
    // from(dataList)
    //   .pipe(
    //     // 排序-檔名
    //     groupBy(data => data[this.defaultKey]),
    //     // 每筆資料轉為陣列
    //     mergeMap(group => group.pipe(toArray())),
    //     // 資料大於為重複
    //     filter(data => data.length > 1),
    //     // 取出所有陣列資料
    //     concatMap(data => from(data)),
    //     // 將所有資料合併為同一陣列
    //     toArray()
    //   )
    //   .subscribe((data: any[]) => {
    //     this.list.data = data;
    //     this.doTableColor();
    //   });
  }
}
