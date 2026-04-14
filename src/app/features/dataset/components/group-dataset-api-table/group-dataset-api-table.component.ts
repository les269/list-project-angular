import {
  Component,
  computed,
  EventEmitter,
  inject,
  Injector,
  input,
  Input,
  OnInit,
  Output,
} from '@angular/core';

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
import { DatasetField, GroupDatasetApi } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ApiConfig } from '../../../api-config/model';
import { filter, Observable, switchMap } from 'rxjs';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ChipSelectColumn,
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';

@Component({
  selector: 'app-group-dataset-api-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
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
  readonly formArray = input.required<ToFormArray<GroupDatasetApi>>();
  readonly initData = input<GroupDatasetApi[]>();
  readonly fb = inject(FormBuilder);
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
  createGroup() {
    return this.fb.group({
      seq: [0],
      apiName: ['', [Validators.required]],
      label: ['', [Validators.required]],
    });
  }

  selectApi(e: GroupDatasetApi) {
    this.selectTableService.selectSingleApi(this.apis.value()).subscribe(x => {
      e.apiName = x.apiName;
    });
  }
}
