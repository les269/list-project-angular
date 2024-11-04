import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CssSelect } from '../../model';

@Component({
  selector: 'app-css-select-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  templateUrl: './css-select-table.component.html',
  styleUrl: './css-select-table.component.scss',
})
export class CssSelectTableComponent {
  displayedColumns = ['key', 'value', 'other'];
  @Input({ required: true }) cssSelectList!: CssSelect[];
  @Output() cssSelectListChange = new EventEmitter<CssSelect[]>();

  //新增CssSelect
  onAddCssSelect() {
    this.cssSelectList = [
      ...this.cssSelectList,
      {
        key: '',
        value: '',
        replaceString: '',
        attr: '',
        convertToArray: false,
        onlyOwn: false,
        replaceRegular: '',
        replaceRegularTo: '',
      },
    ];
    this.cssSelectListChange.emit(this.cssSelectList);
  }
  //刪除CssSelect資料
  onDeleteCssSelect(i: number) {
    this.cssSelectList.splice(i, 1);
    this.cssSelectList = [...this.cssSelectList];
    this.cssSelectListChange.emit(this.cssSelectList);
  }
}
