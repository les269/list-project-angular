import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ThemeLabel, ThemeLabelType } from '../../models';
import { CommonModule } from '@angular/common';
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
  selector: 'app-theme-label-table',
  templateUrl: 'theme-label-table.component.html',
  styleUrl: 'theme-label-table.component.scss',
})
export class ThemeLabelTableComponent {
  @Input({ required: true }) themeLabelList!: ThemeLabel[];
  @Output() themeLabelListChange = new EventEmitter<ThemeLabel[]>();
  displayedColumns: string[] = ['seq', 'byKey', 'label', 'type', 'other'];
  eThemeLabelType = ThemeLabelType;

  //新增資料欄位
  onAdd() {
    if (isNull(this.themeLabelList)) {
      this.themeLabelList = [];
    }
    let element: ThemeLabel = {
      seq: this.themeLabelList.length + 1,
      byKey: '',
      label: '',
      type: ThemeLabelType.string,
      splitBy: '',
      useSpace: '、',
      isSearchButton: false,
      isCopy: false,
      isVisible: false,
      isSort: false,
      isSearchValue: false,
      isDefaultKey: false,
    };
    this.themeLabelList = [...this.themeLabelList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeLabelListChange.emit(this.themeLabelList);
  }
  //資料欄位的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeLabel[] = JSON.parse(JSON.stringify(this.themeLabelList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeLabelList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeLabelListChange.emit(this.themeLabelList);
  }
  //刪除資料欄位
  onDelete(index: number) {
    this.themeLabelList = this.themeLabelList
      .filter((x, i) => i !== index)
      .map((x, i) => {
        x.seq = i + 1;
        return x;
      });
    this.themeLabelListChange.emit(this.themeLabelList);
  }
  changeType(event: ThemeLabelType, index: number) {
    if (event === 'seq') {
      this.themeLabelList[index].isSearchValue = false;
    }
    this.themeLabelListChange.emit(this.themeLabelList);
  }
  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.themeLabelList.map((x, i) => {
        if (i !== index) {
          x.isDefaultKey = false;
        }
        return x;
      });
    }
    this.themeLabelListChange.emit(this.themeLabelList);
  }
}
