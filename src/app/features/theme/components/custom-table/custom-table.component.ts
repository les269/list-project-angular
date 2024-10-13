import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeCustom, ThemeCustomType } from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

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
  constructor() {}

  ngOnInit() {}

  onAdd() {
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
    };
    this.themeCustomList = [...this.themeCustomList, element].map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.themeCustomListChange.emit(this.themeCustomList);
  }

  onDelet(index: number) {
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
}
