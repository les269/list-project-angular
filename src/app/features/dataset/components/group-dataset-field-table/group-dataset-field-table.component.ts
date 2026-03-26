import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDatasetField, GroupDatasetFieldType } from '../../model';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { toKeyValueArray } from '../../../../shared/util/helper';

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
    MatChipsModule,
    GenericTableComponent,
  ],
  templateUrl: './group-dataset-field-table.component.html',
})
export class GroupDatasetFieldTableComponent {
  readonly formArray = input.required<ToFormArray<GroupDatasetField>>();
  readonly fb = inject(FormBuilder);
  eGroupDatasetFieldType = GroupDatasetFieldType;
  displayedColumns = ['key', 'label', 'type'];
  replaceValueMapService = inject(ReplaceValueMapService);
  nameList = rxResource({
    stream: () => this.replaceValueMapService.getNameList(),
    defaultValue: [],
  });
  selectTableService = inject(SelectTableService);
  typeColumn = {
    key: 'type',
    label: 'dataset.type',
    columnType: GenericColumnType.select,
    data: toKeyValueArray(this.eGroupDatasetFieldType),
    dataValue: 'key',
    dataLabel: item => `dataset.${item.key}`,
  } satisfies SelectColumn<{ key: string; value: string }>;
  cols: GenericTableColumn[] = [
    {
      key: 'key',
      label: 'dataset.fieldKey',
      columnType: GenericColumnType.input,
    },
    {
      key: 'label',
      label: 'dataset.fieldLabel',
      columnType: GenericColumnType.input,
    },
    this.typeColumn,
  ];

  createGroup() {
    return this.fb.group({
      seq: [0],
      type: [GroupDatasetFieldType.string],
      key: ['', [Validators.required]],
      label: ['', [Validators.required]],
      replaceValueMapName: [''],
    });
  }

  selectReplaceValueMap(element: GroupDatasetField) {
    this.selectTableService
      .selectSingleReplaceValueMap(this.nameList.value())
      .subscribe(res => {
        element.replaceValueMapName = res.name;
      });
  }
}
