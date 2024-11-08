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
import { TranslateModule } from '@ngx-translate/core';
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
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.scss',
})
export class TableViewComponent implements OnInit, AfterViewInit {
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
  searchLabel: ThemeLabel[] = [];
  defaultKey = '';
  dataSoure: { themeDataset: ThemeDataset; datasetDataList: DatasetData[] }[] =
    [];
  displayedColumns: string[] = [];
  searchValue: string[] = [];

  list = new MatTableDataSource<any>();
  seqKey: string = '';
  useDataset!: ThemeDataset;
  datasetSeq: number = -1;
  useTag!: ThemeTag;
  tagSeq: number = -1;
  datasetNameStr = '__datasetName';
  colorStr = '__color';
  rowColor: string[] = DEFAULT_ROW_COLOR;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private store: Store,
    private datasetService: DatasetService
  ) {}
  ngOnInit(): void {
    this.route.paramMap.pipe(debounceTime(100)).subscribe(params => {
      this.headerId = `ThemeHeader:${params.get('name')},${params.get('version')},table`;
      if (isBlank(this.headerId)) {
        this.router.navigate(['']);
        return;
      }
      this.themeService.getByHeaderId(this.headerId).subscribe(res => {
        this.themeHeader = res;
        this.themeOtherSetting = res.themeOtherSetting;
        this.rowColor = this.themeOtherSetting.rowColor;
        this.themeLabelList = res.themeLabelList
          .sort((a, b) => (a.seq > b.seq ? 1 : -1))
          .filter(x => x.isVisible);
        this.displayedColumns = [
          ...this.themeLabelList.map(x => x.byKey),
          'other',
        ];
        this.searchLabel = this.themeLabelList.filter(
          x => x.isSearchValue && x.type !== 'seq'
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

  ngAfterViewInit(): void {
    this.list.sort = this.sort;
    this.list.paginator = this.paginator;
  }

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
  initData() {
    this.changeDataSource();
    this.seqKey = this.themeLabelList.find(x => x.type === 'seq')?.byKey ?? '';
    //設定序列號
    if (isNotBlank(this.seqKey)) {
      this.list.data = this.list.data.map((x: any, i: number) => {
        x[this.seqKey] = i + 1;
        return x;
      });
    }
  }
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

    this.list.data = this.dataSoure
      .find(x => x.themeDataset.label === this.useDataset.label)!
      .datasetDataList.map(x => {
        x.data = x.data.map(data => {
          data[this.datasetNameStr] = x.datasetName;
          return data;
        });
        return x.data;
      })
      .flat();
    this.doTableColor();
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
}
