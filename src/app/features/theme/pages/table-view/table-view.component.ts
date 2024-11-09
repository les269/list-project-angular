import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, Subscription, switchMap, tap } from 'rxjs';
import { updateTitle } from '../../../../shared/state/layout.actions';
import {
  isBlank,
  isNotBlank,
  isValidWidth,
} from '../../../../shared/util/helper';
import { ThemeService } from '../../services/theme.service';
import {
  DEFAULT_ROW_COLOR,
  ThemeCustom,
  ThemeDataset,
  ThemeHeader,
  ThemeHeaderType,
  ThemeImage,
  ThemeLabel,
  ThemeOtherSetting,
  ThemeTag,
  ThemeTagValue,
} from '../../models';
import { Store } from '@ngrx/store';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { DatasetData } from '../../../dataset/model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { FileSizePipe } from '../../../../shared/util/util.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { MatIconModule } from '@angular/material/icon';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { ListBaseViewComponent } from '../../components/list-base-view.component';
import { MatDialog } from '@angular/material/dialog';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { GroupDatasetService } from '../../../dataset/service/group-dataset.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

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
    ChipInputComponent,
    ListItemValueComponent,
    MatTooltipModule,
    MatButtonModule,
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

  rowColor: string[] = DEFAULT_ROW_COLOR;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(
    public override themeService: ThemeService,
    public override router: Router,
    public override route: ActivatedRoute,
    public override store: Store,
    public override datasetService: DatasetService,
    public override matDialog: MatDialog,
    public override groupdatasetService: GroupDatasetService,
    public override selectTableService: SelectTableService,
    public override translateService: TranslateService
  ) {
    super(
      themeService,
      router,
      route,
      store,
      datasetService,
      matDialog,
      groupdatasetService,
      selectTableService,
      translateService
    );
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
    this.useData = this.datasetDataMap
      .find(x => x.themeDataset.label === this.useDataset.label)!
      .datasetDataList.map(x => {
        x.data = x.data.map(data => {
          data[this.datasetNameStr] = x.datasetName;
          return data;
        });
        return x.data;
      })
      .flat();
    this.list.data = this.useData;
    this.doTableColor();
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
  }

  override changeTag() {
    this.searchChange();
    if (this.useTag.seq !== -1) {
      const valueList = this.themeTagValueList.find(
        tag => tag.tag === this.useTag.tag
      )!.valueList;
      this.list.data = this.list.data.filter((x: any) =>
        valueList.includes(x[this.defaultKey])
      );
    }
  }

  searchChange(text?: string) {
    if (typeof this.searchValue === 'string') {
      this.searchValue = (this.searchValue + '')
        .split(',')
        .map(x => x.trim())
        .filter(x => isNotBlank(x));
    }
    if (isNotBlank(text) && !this.searchValue.includes(text!)) {
      this.searchValue = [...this.searchValue, text!];
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
      const arr = this.list.data
        .map(a => a[this.defaultKey].toUpperCase())
        .filter((element, index, array) => array.indexOf(element) === index)
        .map((value, index) => {
          return {
            key: value,
            color: index % this.rowColor.length,
          };
        });
      arr.forEach(value => {
        this.list.data.forEach(data => {
          if (value.key === data[this.defaultKey]) {
            data[this.colorStr] = this.rowColor[value.color];
          }
        });
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
}
