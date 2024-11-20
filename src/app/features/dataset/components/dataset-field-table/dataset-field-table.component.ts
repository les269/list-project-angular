import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DatasetField,
  DatasetFieldType,
  GroupDatasetField,
  GroupDatasetFieldType,
} from '../../model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-dataset-field-table',
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
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './dataset-field-table.component.html',
})
export class DatasetFieldTableComponent extends GenericTableComponent<DatasetField> {
  eDatasetFieldType = DatasetFieldType;
  displayedColumns = ['seq', 'key', 'label', 'type', 'other'];
  override item: DatasetField = {
    seq: 0,
    type: DatasetFieldType.path,
    key: '',
    label: '',
    fixedString: '',
  };
}
