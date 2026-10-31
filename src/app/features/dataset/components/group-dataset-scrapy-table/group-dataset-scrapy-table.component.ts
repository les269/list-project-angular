import { createGroupDatasetScrapy } from '../../util/group-dataset-rows';
import { Component, computed, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  ChipSelectColumn,
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ScrapyConfig } from '../../../spider/model';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import { GroupDatasetScrapy } from '../../model';

@Component({
  selector: 'app-group-dataset-scrapy-table',

  imports: [
    MatTableModule,
    MatButtonModule,
    TranslateModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    GenericTableComponent,
  ],
  templateUrl: './group-dataset-scrapy-table.component.html',
})
export class GroupDatasetScrapyTableComponent {
  fields = input.required<FieldTree<GroupDatasetScrapy[]>>();
  displayedColumns = [
    'name',
    'label',
    'isDefault',
    'visibleJson',
    'visibleUrl',
  ];

  nameColumn = computed(
    () =>
      ({
        key: 'name',
        label: 'dataset.scrapyName',
        columnType: GenericColumnType.chipSelect,
        data: this.configs.value(),
        dataValue: 'name',
        dataLabel: item => item.name,
        openDialog: () =>
          this.selectTableService.selectSingleScrapy(this.configs.value()),
      }) satisfies ChipSelectColumn<ScrapyConfig>
  );
  cols = computed(
    () =>
      [
        this.nameColumn(),
        {
          key: 'label',
          label: 'dataset.scrapyLabel',
          columnType: GenericColumnType.input,
        },
        {
          key: 'isDefault',
          label: 'dataset.scrapyDefault',
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

  selectTableService = inject(SelectTableService);
  scrapyService = inject(ScrapyService);

  configs = rxResource({
    stream: () => this.scrapyService.getAllConfig(),
    defaultValue: [],
  });
  readonly createRow = createGroupDatasetScrapy;
}
