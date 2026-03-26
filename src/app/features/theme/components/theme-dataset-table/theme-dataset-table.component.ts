import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  FormArray,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { DatasetService } from '../../../dataset/service/dataset.service';
import {
  ThemeDataset,
  ThemeDatasetItem,
  ThemeItem,
  ThemeItemType,
} from '../../models';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ChipSelectMultipleColumn,
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { Dataset } from '../../../dataset/model';
import { isDuplicate } from '../../../../shared/util/helper';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslateModule,
    MatChipsModule,
    GenericTableComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  selector: 'app-theme-dataset-table',
  templateUrl: 'theme-dataset-table.component.html',
})
export class ThemeDatasetTableComponent implements OnInit {
  // inject
  readonly selectTableService = inject(SelectTableService);
  readonly datasetService = inject(DatasetService);
  readonly translateService = inject(TranslateService);
  readonly fb = inject(FormBuilder);
  // constant
  readonly displayedColumns: string[] = ['datasetList', 'label'];
  // input
  readonly headerId = input<string>();
  readonly datasetItem = input<ThemeDatasetItem>();
  readonly oldData = input<ThemeDataset[]>();
  // resource
  readonly datasets = rxResource({
    stream: () => this.datasetService.getAllDataset(),
    defaultValue: [],
  });
  // enum
  readonly eThemeItemType = ThemeItemType;
  // form
  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.array([]),
  });
  readonly formArray = this.form.get('json') as ToFormArray<ThemeDataset>;
  // signals
  readonly initData = computed(() => {
    const resetData = this.resetData();
    if (resetData) {
      return resetData;
    }
    return this.datasetItem()?.json || this.oldData() || [];
  });
  readonly resetData = signal<ThemeDataset[] | null>(null);
  readonly defaultBinding = computed(() => (this.datasetItem() ? true : false));

  readonly formAlerts = computed(
    () =>
      [
        {
          errorId: 'tableEmpty',
          msg: this.translateService.instant('themeDataset.tableEmpty'),
        },
        {
          errorId: 'datasetEmpty',
          msg: this.translateService.instant('themeDataset.datasetEmpty'),
        },
        {
          errorId: 'duplicateByLabel',
          msg: this.translateService.instant('themeDataset.duplicateByLabel'),
        },
      ] satisfies FormAlert[]
  );
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
      this.form.patchValue(data);
    });
  }

  ngOnInit() {
    // ensure the duplicated-key validator is attached to the form array
    const arr = this.formArray;
    arr.setValidators([
      this.tableEmptyValidator(),
      this.datasetEmptyValidator(),
      this.duplicateByLabelValidator(),
    ]);
    arr.updateValueAndValidity({ emitEvent: false });
  }
  createGroup() {
    return this.fb.group({
      seq: [0],
      datasetList: [[], [Validators.required, Validators.minLength(1)]],
      label: ['', [Validators.required]],
      isDefault: [false],
    });
  }
  //改變清單預設使用的資料來源
  changeDefaultKey(index: number) {
    const ctrls = this.formArray.controls;
    for (let i = 0; i < ctrls.length; i++) {
      if (i === index) continue;
      const control = ctrls[i];
      control.patchValue(
        { ...control.value, isDefault: false },
        {
          emitEvent: false,
        }
      );
    }
  }

  jsonReset(data: ThemeItem) {
    if (data.type !== ThemeItemType.DATASET) return;
    this.resetData.set(data.json);
  }

  tableEmptyValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      if (arr.controls.length === 0) {
        return { tableEmpty: true };
      }
      return null;
    };
  }

  datasetEmptyValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      if (arr.controls.length === 0) return null;
      const keys = arr.controls.find(
        c => c.get('datasetList')?.value.length === 0
      );
      if (!!keys) {
        return { datasetEmpty: true };
      }
      return null;
    };
  }
  duplicateByLabelValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      const keys: string[] = arr.controls
        .map(c => c.get('label')?.value)
        .filter(k => k);
      if (isDuplicate(keys)) {
        return { duplicateByLabel: true };
      }
      return null;
    };
  }
}
