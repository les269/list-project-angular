import {
  createThemeDatasetRow,
  normalizeThemeItem,
} from '../../util/theme-item-form';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  applyEach,
  disabled,
  form,
  FormField,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { FormAlert } from '../../../../core/model';
import {
  ChipSelectMultipleColumn,
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { isDuplicate } from '../../../../shared/util/helper';
import { Dataset } from '../../../dataset/model';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { ThemeDatasetItem, ThemeItem, ThemeItemType } from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  imports: [
    FormField,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslatePipe,
    MatChipsModule,
    GenericTableComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  selector: 'app-theme-dataset-table',
  templateUrl: 'theme-dataset-table.component.html',
})
export class ThemeDatasetTableComponent {
  // inject
  readonly selectTableService = inject(SelectTableService);
  readonly datasetService = inject(DatasetService);
  readonly translateService = inject(TranslateService);
  readonly layoutStore = inject(LayoutStore);
  // constant
  readonly displayedColumns: string[] = ['datasetList', 'label'];
  // input
  readonly headerId = input<string>();
  readonly datasetItem = input<ThemeDatasetItem>();
  // resource
  readonly datasets = rxResource({
    stream: () => this.datasetService.getAllDataset(),
    defaultValue: [],
  });
  // enum
  readonly eThemeItemType = ThemeItemType;
  // form
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeDatasetItem>({
    type: ThemeItemType.DATASET,
    itemId: '',
    description: '',
    json: [],
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    validate(p.json, ({ value }) =>
      value().length === 0 ? { kind: 'tableEmpty' } : undefined
    );
    validate(p.json, ({ value }) =>
      value().some(row => row.datasetList.length === 0)
        ? { kind: 'datasetEmpty' }
        : undefined
    );
    validate(p.json, ({ value }) =>
      isDuplicate(
        value()
          .map(row => row.label)
          .filter(Boolean)
      )
        ? { kind: 'duplicateByLabel' }
        : undefined
    );

    applyEach(p.json, p => {
      required(p.datasetList);
      minLength(p.datasetList, 1);
      required(p.label);
    });
    required(p.itemId);
  });
  readonly fields = this.form.json;
  // signals
  readonly defaultBinding = computed(() => (this.datasetItem() ? true : false));

  private readonly validationMessages = toSignal(
    this.translateService.stream([
      'themeDataset.tableEmpty',
      'themeDataset.datasetEmpty',
      'themeDataset.duplicateByLabel',
    ]),
    {
      initialValue: this.translateService.instant([
        'themeDataset.tableEmpty',
        'themeDataset.datasetEmpty',
        'themeDataset.duplicateByLabel',
      ]),
    }
  );
  readonly formAlerts = computed(() => {
    const messages = this.validationMessages();
    return [
      {
        errorId: 'tableEmpty',
        msg: messages['themeDataset.tableEmpty'],
      },
      {
        errorId: 'datasetEmpty',
        msg: messages['themeDataset.datasetEmpty'],
      },
      {
        errorId: 'duplicateByLabel',
        msg: messages['themeDataset.duplicateByLabel'],
      },
    ] satisfies FormAlert[];
  });
  readonly datasetColumn = computed(
    () =>
      ({
        key: 'datasetList',
        label: 'themeDataset.dataset',
        columnType: GenericColumnType.chipSelectMultiple,
        data: this.datasets.value(),
        dataValue: 'name',
        dataLabel: item => item['name'],
        openDialog: (selectedValue: Dataset[]) =>
          this.selectTableService.selectMultipleDataset(
            this.datasets.value(),
            selectedValue
          ),
        required: true,
      }) satisfies ChipSelectMultipleColumn<Dataset>
  );
  readonly cols = computed(
    () =>
      [
        this.datasetColumn(),
        {
          key: 'label',
          label: 'themeDataset.label',
          columnType: GenericColumnType.input,
          minWidth: '200px',
        },
      ] satisfies GenericTableColumn[]
  );

  constructor() {
    effect(() => {
      const data = this.datasetItem();
      if (!data) return;
      untracked(() => this.loadItem(data));
    });
  }

  readonly createRow = createThemeDatasetRow;
  //改變清單預設使用的資料來源
  changeDefaultKey(index: number) {
    const ctrls = this.fields;
    for (let i = 0; i < ctrls.length; i++) {
      if (i === index) continue;
      const state = ctrls[i].isDefault();
      if (!state.value()) continue;
      state.value.set(false);
      state.markAsDirty();
    }
  }

  loadItem(data: ThemeItem) {
    if (data.type !== ThemeItemType.DATASET) return;
    this.form().reset(normalizeThemeItem(data, this.initialFormValue));
  }
}
