import { createGroupDatasetField } from '../../util/group-dataset-rows';
import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { GroupDatasetField, GroupDatasetFieldType } from '../../model';

@Component({
  selector: 'app-group-dataset-field-table',

  imports: [GenericTableComponent],
  templateUrl: './group-dataset-field-table.component.html',
})
export class GroupDatasetFieldTableComponent {
  readonly fields = input.required<FieldTree<GroupDatasetField[]>>();
  readonly eGroupDatasetFieldType = GroupDatasetFieldType;
  readonly displayedColumns = ['key', 'label', 'type', 'required'];
  readonly cols: GenericTableColumn[] = [
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
    {
      key: 'type',
      label: 'dataset.type',
      columnType: GenericColumnType.select,
      data: toKeyValueArray(this.eGroupDatasetFieldType),
      dataValue: 'key',
      dataLabel: item => `dataset.${item.key}`,
    } satisfies SelectColumn<{ key: string; value: string }>,
    {
      key: 'required',
      label: 'dataset.required',
      columnType: GenericColumnType.checkbox,
    },
  ];

  readonly createRow = createGroupDatasetField;
}
