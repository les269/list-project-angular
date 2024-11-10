import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { ApiConfig } from '../../../api-config/model';
import {
  ThemeTopCustom,
  ThemeCustomType,
  ThemeTopCustomType,
} from '../../models';
import { MatDialog } from '@angular/material/dialog';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { isBlank, isNull } from '../../../../shared/util/helper';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';

@Component({
  selector: 'app-theme-top-custom-table',
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
    ChipInputComponent,
  ],
  templateUrl: './theme-top-custom-table.component.html',
  styleUrl: './theme-top-custom-table.component.scss',
})
export class ThemeTopCustomTableComponent {
  @Input({ required: true }) themeTopCustomList!: ThemeTopCustom[];
  @Output() themeTopCustomListChange = new EventEmitter<ThemeTopCustom[]>();
  displayedColumns = ['order', 'type', 'byKey', 'label', 'other'];
  eThemeTopCustomType = ThemeTopCustomType;
  apiConfigList: ApiConfig[] = [];

  constructor(
    private apiConfigService: ApiConfigService,
    private matDialog: MatDialog,
    private selectTableService: SelectTableService
  ) {}

  ngOnInit() {
    this.apiConfigService.getAll().subscribe(res => {
      this.apiConfigList = res;
    });
  }

  onAdd() {
    if (isNull(this.themeTopCustomList)) {
      this.themeTopCustomList = [];
    }
    let element: ThemeTopCustom = {
      seq: this.themeTopCustomList.length + 1,
      type: ThemeTopCustomType.openUrl,
      byKey: '',
      label: '',
      openUrl: '',
      apiName: '',
      apiConfig: undefined,
    };
    this.themeTopCustomList = [...this.themeTopCustomList, element].map(
      (x, i) => {
        x.seq = i + 1;
        return x;
      }
    );
    this.themeTopCustomListChange.emit(this.themeTopCustomList);
  }

  onDelete(index: number) {
    this.themeTopCustomList = this.themeTopCustomList
      .filter((x, i) => i !== index)
      .map((x, i) => {
        x.seq = i + 1;
        return x;
      });
    this.themeTopCustomListChange.emit(this.themeTopCustomList);
  }

  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeTopCustom[] = JSON.parse(
      JSON.stringify(this.themeTopCustomList)
    );
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeTopCustomList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeTopCustomListChange.emit(this.themeTopCustomList);
  }

  selectApi(element: ThemeTopCustom) {
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

  removeApi(element: ThemeTopCustom) {
    element.apiConfig = undefined;
  }
}
