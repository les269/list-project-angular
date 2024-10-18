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
import { ThemeDB, ThemeDBType } from '../../models';
import { isNull } from '../../../../shared/util/helper';

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
  ],
  selector: 'app-theme-db-table',
  templateUrl: 'theme-db-table.component.html',
})
export class ThemeDBTableComponent {
  @Input({ required: true }) themeDBList!: ThemeDB[];
  @Output() themeDBListChange = new EventEmitter<ThemeDB[]>();
  displayedColumns: string[] = [
    'order',
    'type',
    'source',
    'label',
    'group',
    'other',
  ];
  eThemeDBType = ThemeDBType;

  //新增資料來源
  onAdd() {
    if (isNull(this.themeDBList)) {
      this.themeDBList = [];
    }
    let element: ThemeDB = {
      seq: this.themeDBList.length + 1,
      type: ThemeDBType.json,
      source: '',
      label: '',
      groups: '',
      isDefault: false,
    };
    this.themeDBList = [...this.themeDBList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeDBListChange.emit(this.themeDBList);
  }
  //刪除資料來源
  onDelete(index: number) {
    this.themeDBList = this.themeDBList.filter((x, i) => i !== index);
    this.themeDBListChange.emit(this.themeDBList);
  }
  //資料來源的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeDB[] = JSON.parse(JSON.stringify(this.themeDBList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeDBList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeDBListChange.emit(this.themeDBList);
  }
  //改變清單預設使用的資料來源
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.themeDBList.map((x, i) => {
        if (i !== index) {
          x.isDefault = false;
        }
        return x;
      });
    }
    this.themeDBListChange.emit(this.themeDBList);
  }
}
