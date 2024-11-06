import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { CustomTableComponent } from '../custom-table/custom-table.component';
import { ThemeTag } from '../../models';
import { isNull } from '../../../../shared/util/helper';

@Component({
  selector: 'app-theme-tag-table',
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
  templateUrl: './theme-tag-table.component.html',
  styleUrl: './theme-tag-table.component.scss',
})
export class ThemeTagTableComponent {
  @Input({ required: true }) themeTagList!: ThemeTag[];
  @Output() themeTagListChange = new EventEmitter<ThemeTag[]>();
  displayedColumns: string[] = ['seq', 'tag', 'other'];

  onAdd() {
    if (isNull(this.themeTagList)) {
      this.themeTagList = [];
    }
    let element: ThemeTag = {
      seq: this.themeTagList.length + 1,
      tag: '',
    };
    this.themeTagList = [...this.themeTagList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeTagListChange.emit(this.themeTagList);
  }
  //資料欄位的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeTag[] = JSON.parse(JSON.stringify(this.themeTagList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.themeTagList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeTagListChange.emit(this.themeTagList);
  }
  //刪除資料欄位
  onDelete(index: number) {
    this.themeTagList = this.themeTagList
      .filter((x, i) => i !== index)
      .map((x, i) => {
        x.seq = i + 1;
        return x;
      });
    this.themeTagListChange.emit(this.themeTagList);
  }
}
