import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { getWidth, isBlank, isNotBlank } from '../../../../shared/util/helper';
import { FileSizePipe } from '../../../../shared/util/util.pipe';
import { CustomButtonsComponent } from '../../components/custom-buttons/custom-buttons.component';
import { ItemTagButtonsComponent } from '../../components/item-tag-buttons/item-tag-buttons.component';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { TopCustomButtonsComponent } from '../../components/top-custom-buttons/top-custom-buttons.component';
import {
  DataStore,
  FilterStore,
  HeaderStore,
  ListBaseViewStoreAdapter,
  ResourceStore,
  RouteStore,
  UIStateStore,
} from '../../stores/index.store';

@Component({
  selector: 'app-table-view',

  imports: [
    CommonModule,
    MatTableModule,
    ScrollTopComponent,
    FileSizePipe,
    TranslatePipe,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    ListItemValueComponent,
    MatTooltipModule,
    MatButtonModule,
    CustomButtonsComponent,
    TopCustomButtonsComponent,
    MatAutocompleteModule,
    ItemTagButtonsComponent,
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
export class TableViewComponent {
  readonly store = inject(ListBaseViewStoreAdapter);

  readonly COLOR_KEY = '__color';
  readonly isExpand = signal(false);

  readonly dataSource = computed(() => {
    const defaultKey = this.store.defaultKey();
    const rowColor = this.store.rowColor();
    const data = this.store.viewData().slice();
    if (isNotBlank(defaultKey) && rowColor.length > 0) {
      // 以新物件加入顏色，避免修改 FilterStore 快取的列資料。
      return data.map((row, index) => ({
        ...row,
        [this.COLOR_KEY]: rowColor[index % rowColor.length],
      }));
    }
    return data;
  });

  getWidth = getWidth;

  constructor() {
    effect(() => {
      if (isBlank(this.store.headerId())) {
        this.store.router.navigate(['']);
      }
    });
  }

  displayedColumns = computed(() => [
    ...this.store
      .visibleLabelList()
      .filter(this.store.checkVisibleByDataset)
      .map(x => x.byKey),
    'other',
  ]);

  fileSizeTotal(byKey: string): number {
    return this.dataSource()
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

  onSortChange(sort: Sort) {
    this.store.patchQuery({
      type: 'sort',
      key: sort.active,
      asc: sort.direction === 'asc' || sort.direction === '',
    });
  }

  onPageChange(event: PageEvent) {
    this.store.setPage(event.pageIndex + 1);
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
