import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { CustomTableComponent } from '../custom-table/custom-table.component';
import { isNull } from '../../../../shared/util/helper';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { Dataset } from '../../../dataset/model';
import { ThemeDataset } from '../../models';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslateModule,
    CustomTableComponent,
    MatChipsModule,
  ],
  selector: 'app-theme-dataset-table',
  templateUrl: 'theme-dataset-table.component.html',
})
export class ThemeDatasetTableComponent implements OnInit {
  @Input({ required: true }) themeDatasetList!: ThemeDataset[];
  @Output() themeDatasetListChange = new EventEmitter<ThemeDataset[]>();
  displayedColumns: string[] = ['order', 'dataset', 'label', 'other'];
  datasetList: Dataset[] = [];

  constructor(
    private selectTableService: SelectTableService,
    private datasetService: DatasetService
  ) {}

  ngOnInit(): void {
    this.datasetService
      .getAllDataset()
      .subscribe(res => (this.datasetList = res));
  }

  //新增資料來源
  onAdd() {
    if (isNull(this.themeDatasetList)) {
      this.themeDatasetList = [];
    }
    let element: ThemeDataset = {
      seq: this.themeDatasetList.length + 1,
      label: '',
      isDefault: false,
      datasetList: [],
    };
    this.themeDatasetList = [...this.themeDatasetList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeDatasetListChange.emit(this.themeDatasetList);
  }

  //刪除資料來源
  onDelete(index: number) {
    this.themeDatasetList = this.themeDatasetList.filter((x, i) => i !== index);
    this.themeDatasetListChange.emit(this.themeDatasetList);
  }

  //資料來源的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeDataset[] = JSON.parse(
      JSON.stringify(this.themeDatasetList)
    );
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeDatasetList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeDatasetListChange.emit(this.themeDatasetList);
  }
  //改變清單預設使用的資料來源
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.themeDatasetList.map((x, i) => {
        if (i !== index) {
          x.isDefault = false;
        }
        return x;
      });
    }
    this.themeDatasetListChange.emit(this.themeDatasetList);
  }
  selectDataset(element: ThemeDataset) {
    const selected = this.datasetList.filter(x =>
      element.datasetList.includes(x.name)
    );
    this.selectTableService
      .selectMultipleDataset(this.datasetList, selected)
      .subscribe(x => {
        if (x) {
          element.datasetList = x.map(x => x.name);
        }
      });
  }

  removeChip(element: ThemeDataset, dataset: string) {
    element.datasetList = element.datasetList.filter(x => x !== dataset);
  }
}
