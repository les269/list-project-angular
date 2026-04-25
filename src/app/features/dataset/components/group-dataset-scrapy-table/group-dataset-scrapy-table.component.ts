import { Component, computed, inject, input } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { GroupDatasetScrapy } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  ChipSelectColumn,
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { ScrapyConfig } from '../../../spider/model';

@Component({
  selector: 'app-group-dataset-scrapy-table',
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
  templateUrl: './group-dataset-scrapy-table.component.html',
})
export class GroupDatasetScrapyTableComponent {
  formArray = input.required<ToFormArray<GroupDatasetScrapy>>();
  initData = input<GroupDatasetScrapy[]>();
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

  readonly fb = inject(FormBuilder);
  selectTableService = inject(SelectTableService);
  scrapyService = inject(ScrapyService);

  configs = rxResource({
    stream: () => this.scrapyService.getAllConfig(),
    defaultValue: [],
  });
  readonly createGroup = () => {
    return this.fb.group({
      seq: [0],
      name: ['', [Validators.required]],
      label: ['', [Validators.required]],
      isDefault: [false],
      visibleJson: [false],
      visibleUrl: [false],
    });
  };
}
