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
  ThemeHeaderType,
  ThemeLabel,
  ThemeLabelType,
  ThemeItemType,
  ThemeLabelItem,
  ThemeItem,
} from '../../models';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  isDuplicate,
  isNotBlank,
  isValidWidth,
  toKeyValueArray,
} from '../../../../shared/util/helper';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { LayoutStore } from '../../../../core/stores/layout.store';

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
    GenericTableComponent,
    ChipInputComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  selector: 'app-theme-label-table',
  templateUrl: 'theme-label-table.component.html',
})
export class ThemeLabelTableComponent implements OnInit {
  // inject
  readonly fb = inject(FormBuilder);
  readonly translateService = inject(TranslateService);
  readonly layoutStore = inject(LayoutStore);

  // input
  readonly headerId = input<string>();
  readonly labelItem = input<ThemeLabelItem>();
  readonly themeHeaderType = input<ThemeHeaderType>();
  readonly oldData = input<ThemeLabel[]>();
  //enum
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly eThemeLabelType = ThemeLabelType;
  readonly eThemeItemType = ThemeItemType;

  // form
  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.array([]),
  });
  readonly formArray = this.form.get('json') as ToFormArray<ThemeLabel>;
  // signals
  readonly initData = computed(() => {
    const resetData = this.resetData();
    if (resetData) {
      return resetData;
    }
    return this.labelItem()?.json || this.oldData() || [];
  });
  readonly resetData = signal<ThemeLabel[] | null>(null);
  readonly defaultBinding = computed(() => (this.labelItem() ? true : false));

  //constant
  readonly displayedColumns: string[] = ['byKey', 'label', 'type'];
  readonly cols: GenericTableColumn[] = [
    {
      key: 'byKey',
      label: 'themeLabel.byKey',
      columnType: GenericColumnType.input,
      require: true,
    },
    {
      key: 'label',
      label: 'themeLabel.label',
      columnType: GenericColumnType.input,
      require: true,
    },
    {
      key: 'type',
      label: 'themeLabel.type',
      columnType: GenericColumnType.select,
      data: toKeyValueArray(ThemeLabelType),
      dataValue: 'key',
      dataLabel: item => `themeLabel.${item.key}`,
    } satisfies SelectColumn<{ key: string; value: string }>,
  ];
  // util
  readonly isValidWidth = isValidWidth;

  readonly formAlerts = computed(
    () =>
      [
        {
          errorId: 'duplicateByKey',
          msg: this.translateService.instant('msg.duplicateColumn', {
            text: this.translateService.instant('themeLabel.byKey'),
          }),
        },
      ] satisfies FormAlert[]
  );

  constructor() {
    effect(() => {
      const data = this.labelItem();
      if (!data) return;
      this.form.patchValue(data);
    });
  }

  ngOnInit() {
    const arr = this.formArray;
    arr.setValidators(this.duplicateByKeyValidator());
    arr.updateValueAndValidity({ emitEvent: false });
  }

  readonly createGroup = () => {
    // add a group-level validator so a single theme label can enforce width rules
    return this.fb.group(
      {
        seq: [0],
        byKey: ['', [Validators.required]],
        label: ['', [Validators.required]],
        type: [ThemeLabelType.string],
        splitBy: [''],
        useSpace: [''],
        isSearchButton: [false],
        isSearchValue: [false],
        isCopy: [false],
        isVisible: [false],
        isSort: [false],
        isDefaultKey: [false],
        dateFormat: [''],
        width: [''],
        maxWidth: [''],
        minWidth: [''],
        autoComplete: [false],
        useVisibleDataset: [false],
        visibleDatasetNameList: [[] as string[]],
      },
      {
        validators: [
          this.widthValidator(),
          this.maxWidthValidator(),
          this.minWidthValidator(),
        ],
      }
    );
  };
  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(index: number) {
    const ctrls = this.formArray.controls;
    for (let i = 0; i < ctrls.length; i++) {
      if (i === index) continue;
      const ctrl = ctrls[i];
      ctrl.patchValue(
        { ...ctrl.value, isDefaultKey: false },
        {
          emitEvent: false,
        }
      );
    }
  }

  jsonReset(data: ThemeItem) {
    if (data.type !== ThemeItemType.LABEL) return;
    this.resetData.set(data.json);
  }

  /**
   * group-level validator to enforce width rules when the header type is table.
   * returns error object with keys `invalidWidth`, `invalidMinWidth`, `invalidMaxWidth`
   * or null when valid.
   */
  private widthValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      if (this.themeHeaderType() !== this.eThemeHeaderType.table) {
        return null;
      }

      const w = ctrl.get('width')?.value;
      if (isNotBlank(w) && !isValidWidth(w)) {
        return { invalidWidth: true };
      }
      return null;
    };
  }
  private minWidthValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      if (this.themeHeaderType() !== this.eThemeHeaderType.table) {
        return null;
      }

      const min = ctrl.get('minWidth')?.value;
      if (isNotBlank(min) && !isValidWidth(min)) {
        return { invalidMinWidth: true };
      }
      return null;
    };
  }

  private maxWidthValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      if (this.themeHeaderType() !== this.eThemeHeaderType.table) {
        return null;
      }

      const max = ctrl.get('maxWidth')?.value;
      if (isNotBlank(max) && !isValidWidth(max)) {
        return { invalidMaxWidth: true };
      }
      return null;
    };
  }

  /**
   * array-level validator to detect duplicate byKey values.
   * applied on the FormArray itself in ngOnInit.
   */
  private duplicateByKeyValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      const keys: string[] = arr.controls
        .map(c => c.get('byKey')?.value)
        .filter(k => k);
      if (isDuplicate(keys)) {
        return { duplicateByKey: true };
      }
      return null;
    };
  }
}
