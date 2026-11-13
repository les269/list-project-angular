import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FieldTree } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  ChipSelectColumn,
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  ApiRequestConfig,
  getApiRequestLabel,
} from '../../../api-request-config/model';
import { ApiRequestConfigService } from '../../../api-request-config/service/api-request-config.service';
import { GroupDatasetApi } from '../../model';
import { createGroupDatasetApi } from '../../util/group-dataset-rows';

@Component({
  selector: 'app-group-dataset-api-table',
  imports: [TranslateModule, GenericTableComponent],
  templateUrl: './group-dataset-api-table.component.html',
})
export class GroupDatasetApiTableComponent {
  readonly fields = input.required<FieldTree<GroupDatasetApi[]>>();
  readonly displayedColumns = ['apiId', 'label'];
  private readonly service = inject(ApiRequestConfigService);
  private readonly selectTable = inject(SelectTableService);
  readonly apis = rxResource({
    stream: () => this.service.getAll(),
    defaultValue: [],
  });
  readonly cols = computed(
    () =>
      [
        {
          key: 'apiId',
          label: 'dataset.apiId',
          columnType: GenericColumnType.chipSelect,
          data: this.apis.value(),
          dataValue: 'apiId',
          dataLabel: getApiRequestLabel,
          openDialog: () => this.selectTable.selectSingleApi(this.apis.value()),
        } satisfies ChipSelectColumn<ApiRequestConfig>,
        {
          key: 'label',
          label: 'dataset.apiLabel',
          columnType: GenericColumnType.input,
        },
      ] satisfies GenericTableColumn[]
  );
  readonly createRow = createGroupDatasetApi;
}
