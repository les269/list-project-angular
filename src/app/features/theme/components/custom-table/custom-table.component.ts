import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeCustom, ThemeCustomType } from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ApiConfig } from '../../../api-config/model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  BaseSelectTableData,
  SelectTableDialog,
} from '../../../../core/components/select-table/select-table.dialog';
import { isBlank, isNull } from '../../../../shared/util/helper';
import { SelectTableService } from '../../../../core/services/select-table.service';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
  ],
  selector: 'app-custom-table',
  templateUrl: 'custom-table.component.html',
  styleUrl: 'custom-table.component.scss',
})
export class CustomTableComponent implements OnInit {
  @Input({ required: true }) themeCustomList!: ThemeCustom[];
  @Output() themeCustomListChange = new EventEmitter<ThemeCustom[]>();
  displayedColumns = ['order', 'type', 'byKey', 'label', 'other'];
  eThemeCustomType = ThemeCustomType;
  apiConfigList: ApiConfig[] = [];
  constructor(
    private apiConfigService: ApiConfigService,
    private selectTableService: SelectTableService
  ) {}

  ngOnInit() {
    this.apiConfigService.getAll().subscribe(res => {
      this.apiConfigList = res;
    });
  }

  onAdd() {
    if (isNull(this.themeCustomList)) {
      this.themeCustomList = [];
    }
    let element: ThemeCustom = {
      seq: this.themeCustomList.length + 1,
      byKey: '',
      label: '',
      type: ThemeCustomType.buttonIconBoolean,
      openUrl: '',
      openUrlByKey: '',
      copyValue: '',
      copyValueByKey: '',
      buttonIconFill: '',
      buttonIconFillColor: '#000',
      buttonIconTrue: '',
      buttonIconFalse: '',
      apiName: '',
      apiConfig: undefined,
    };
    this.themeCustomList = [...this.themeCustomList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeCustomListChange.emit(this.themeCustomList);
  }

  onDelete(index: number) {
    this.themeCustomList = this.themeCustomList
      .filter((x, i) => i !== index)
      .map((x, i) => {
        x.seq = i + 1;
        return x;
      });
    this.themeCustomListChange.emit(this.themeCustomList);
  }

  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeCustom[] = JSON.parse(JSON.stringify(this.themeCustomList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeCustomList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeCustomListChange.emit(this.themeCustomList);
  }

  selectApi(element: ThemeCustom) {
    this.selectTableService
      .selectSingleApi(this.apiConfigList)
      .subscribe(res => {
        if (res) {
          element.apiConfig = res;
        }
      });
  }

  toJsonParse(s: string): string[] {
    if (isBlank(s)) {
      return [];
    }
    return JSON.parse(s);
  }

  removeApi(element: ThemeCustom) {
    element.apiConfig = undefined;
  }
}
