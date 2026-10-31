import { createGroupDatasetApi } from '../../util/group-dataset-rows';
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
import { ApiConfig } from '../../../api-config/model';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { GroupDatasetApi } from '../../model';

@Component({
  selector: 'app-group-dataset-api-table',

  imports: [
    MatTableModule,
    MatButtonModule,
    TranslateModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    GenericTableComponent,
  ],
  templateUrl: './group-dataset-api-table.component.html',
})
export class GroupDatasetApiTableComponent {
  readonly fields = input.required<FieldTree<GroupDatasetApi[]>>();
  readonly displayedColumns = ['apiName', 'label'];
  readonly item: GroupDatasetApi = {
    seq: 0,
    apiName: '',
    label: '',
  };
  readonly apiConfigService = inject(ApiConfigService);
  readonly apis = rxResource({
    stream: () => this.apiConfigService.getAll(),
    defaultValue: [],
  });
  readonly selectTableService = inject(SelectTableService);
  readonly apiNameColumn = computed(
    () =>
      ({
        key: 'apiName',
        label: 'dataset.apiName',
        columnType: GenericColumnType.chipSelect,
        data: this.apis.value(),
        dataValue: 'apiName',
        dataLabel: item => item.apiName,
        openDialog: () =>
          this.selectTableService.selectSingleApi(this.apis.value()),
      }) satisfies ChipSelectColumn<ApiConfig>
  );
  readonly cols: GenericTableColumn[] = [
    this.apiNameColumn(),
    {
      key: 'label',
      label: 'dataset.apiLabel',
      columnType: GenericColumnType.input,
    },
  ];
  readonly createRow = createGroupDatasetApi;

  selectApi(e: GroupDatasetApi) {
    this.selectTableService.selectSingleApi(this.apis.value()).subscribe(x => {
      e.apiName = x.apiName;
    });
  }
}
