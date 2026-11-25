import { createGroupDatasetSpider } from '../../util/group-dataset-rows';
import { Component, computed, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  ChipSelectColumn,
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SpiderConfig } from '../../../spider/model';
import { SpiderConfigService } from '../../../spider/services/spider-config.service';
import { GroupDatasetSpider } from '../../model';

@Component({
  selector: 'app-group-dataset-spider-table',

  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    GenericTableComponent,
  ],
  templateUrl: './group-dataset-spider-table.component.html',
})
export class GroupDatasetSpiderTableComponent {
  readonly selectTableService = inject(SelectTableService);
  readonly spiderConfigService = inject(SpiderConfigService);

  fields = input.required<FieldTree<GroupDatasetSpider[]>>();
  displayedColumns = [
    'spiderId',
    'label',
    'isDefault',
    'visibleJson',
    'visibleUrl',
  ];

  spiderColumn = computed(
    () =>
      ({
        key: 'spiderId',
        label: 'spider.spiderId',
        columnType: GenericColumnType.chipSelect,
        data: this.configs.value(),
        dataValue: 'spiderId',
        dataLabel: item => item.spiderId,
        openDialog: () =>
          this.selectTableService.selectSingleSpider(this.configs.value()),
      }) satisfies ChipSelectColumn<SpiderConfig>
  );
  cols = computed(
    () =>
      [
        this.spiderColumn(),
        {
          key: 'label',
          label: 'dataset.spiderLabel',
          columnType: GenericColumnType.input,
        },
        {
          key: 'isDefault',
          label: 'dataset.spiderDefault',
          columnType: GenericColumnType.radio,
        },
        {
          key: 'visibleJson',
          label: 'dataset.visibleJson',
          columnType: GenericColumnType.checkbox,
        },
        {
          key: 'visibleUrl',
          label: 'dataset.visibleUrl',
          columnType: GenericColumnType.checkbox,
        },
      ] satisfies GenericTableColumn[]
  );

  configs = rxResource({
    stream: () => this.spiderConfigService.getAll(),
    defaultValue: [],
  });
  readonly createRow = createGroupDatasetSpider;
}
