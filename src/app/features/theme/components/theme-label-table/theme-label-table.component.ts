import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ThemeHeaderType, ThemeLabel, ThemeLabelType } from '../../models';
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
import { isNull } from '../../../../shared/util/helper';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

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
    CdkDropList,
    CdkDrag,
  ],
  selector: 'app-theme-label-table',
  templateUrl: 'theme-label-table.component.html',
})
export class ThemeLabelTableComponent extends GenericTableComponent<ThemeLabel> {
  @Input({ required: true }) type!: ThemeHeaderType;
  displayedColumns: string[] = ['seq', 'byKey', 'label', 'type', 'other'];
  eThemeLabelType = ThemeLabelType;
  override item: ThemeLabel = {
    seq: 0,
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
    dateFormat: '',
    maxWidth: '',
    minWidth: '',
    width: '',
    autoComplete: false,
    visibleDatasetNameList: [],
  };

  changeType(event: ThemeLabelType, index: number) {
    if (event === 'seq') {
      this.list[index].isSearchValue = false;
    }
    this.listChange.emit(this.list);
  }

  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.list.map((x, i) => {
        if (i !== index) {
          x.isDefaultKey = false;
        }
        return x;
      });
    }
    this.listChange.emit(this.list);
  }
}
