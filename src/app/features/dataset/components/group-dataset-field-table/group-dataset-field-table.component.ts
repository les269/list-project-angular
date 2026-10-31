import { createGroupDatasetField } from '../../util/group-dataset-rows';
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { GroupDatasetField, GroupDatasetFieldType } from '../../model';

@Component({
  selector: 'app-group-dataset-field-table',

  imports: [
    MatTableModule,
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
  readonly fields = input.required<FieldTree<GroupDatasetField[]>>();
  readonly eGroupDatasetFieldType = GroupDatasetFieldType;
  readonly displayedColumns = ['key', 'label', 'type'];
  readonly replaceValueMapService = inject(ReplaceValueMapService);
  readonly nameList = rxResource({
    stream: () => this.replaceValueMapService.getNameList(),
    defaultValue: [],
  });
  readonly selectTableService = inject(SelectTableService);
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
  ];

  readonly createRow = createGroupDatasetField;

  selectReplaceValueMap(element: GroupDatasetField) {
    this.selectTableService
      .selectSingleReplaceValueMap(this.nameList.value())
      .subscribe(res => {
        element.replaceValueMapName = res.name;
      });
  }
}
