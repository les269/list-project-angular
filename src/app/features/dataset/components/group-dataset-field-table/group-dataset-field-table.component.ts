import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDatasetField, GroupDatasetFieldType } from '../../model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-group-dataset-field-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './group-dataset-field-table.component.html',
})
export class GroupDatasetFieldTableComponent {
  eDatasetFieldType = GroupDatasetFieldType;
  displayedColumns = ['seq', 'key', 'label', 'type', 'other'];
  @Input({ required: true }) fieldList!: GroupDatasetField[];
  @Output() fieldListChange = new EventEmitter<GroupDatasetField[]>();
  onAdd() {
    this.fieldList = [
      ...this.fieldList,
      {
        seq: this.fieldList.length + 1,
        type: GroupDatasetFieldType.string,
        key: '',
        label: '',
      },
    ];
    this.fieldListChange.emit(this.fieldList);
  }

  onDelete(index: number) {
    this.fieldList = this.fieldList.filter((x, i) => i !== index);
    this.fieldListChange.emit(this.fieldList);
  }
  //資料來源的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: GroupDatasetField[] = JSON.parse(JSON.stringify(this.fieldList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.fieldList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.fieldListChange.emit(this.fieldList);
  }
}
