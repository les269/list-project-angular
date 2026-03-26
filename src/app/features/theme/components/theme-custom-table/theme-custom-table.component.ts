import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  OpenWindowTargetType,
  ThemeCustom,
  ThemeCustomItem,
  ThemeCustomType,
  ThemeItem,
  ThemeItemType,
} from '../../models';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import {
  isDuplicate,
  isBlank,
  toKeyValueArray,
} from '../../../../shared/util/helper';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { ChipSelectButtonComponent } from '../../../../core/components/chip-select-button/chip-select-button.component';
import { ApiConfig } from '../../../api-config/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    GenericTableComponent,
    ChipSelectButtonComponent,
    ThemeItemManageComponent,
    FormAlertsComponent,
    ChipInputComponent,
    FormInvalidsComponent,
  ],
  selector: 'app-theme-custom-table',
  templateUrl: 'theme-custom-table.component.html',
})
export class ThemeCustomTableComponent implements OnInit {
  // injects
  readonly fb = inject(FormBuilder);
  readonly translateService = inject(TranslateService);
  readonly apiConfigService = inject(ApiConfigService);
  readonly selectTableService = inject(SelectTableService);
  // inputs
  readonly headerId = input<string>();
  readonly customItem = input<ThemeCustomItem>();
  readonly oldData = input<ThemeCustom[]>();

  //form
  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.array([]),
  });
  readonly formArray = this.form.get('json') as ToFormArray<ThemeCustom>;

  //signals
  readonly initData = computed(() => {
    const resetData = this.resetData();
    if (resetData) {
      return resetData;
    }
    return this.customItem()?.json || this.oldData() || [];
  });
  readonly resetData = signal<ThemeCustom[] | null>(null);
  readonly defaultBinding = computed(() => (this.customItem() ? true : false));
  readonly apis = rxResource({
    stream: () => this.apiConfigService.getAll(),
    defaultValue: [],
  });
  readonly formAlerts = computed(
    () =>
      [
        {
          errorId: 'duplicateByKey',
          msg: this.translateService.instant('msg.duplicateColumn', {
            text: this.translateService.instant('themeCustom.byKey'),
          }),
        },
      ] satisfies FormAlert[]
  );
  // enums and constants
  readonly eThemeItemType = ThemeItemType;
  readonly displayedColumns = ['type', 'byKey', 'label'];
  readonly cols: GenericTableColumn[] = [
    {
      key: 'type',
      label: 'themeCustom.type',
      columnType: GenericColumnType.select,
      data: toKeyValueArray(ThemeCustomType),
      dataValue: 'key',
      dataLabel: item => `themeCustom.${item.key}`,
    } satisfies SelectColumn<{ key: string; value: string }>,
    {
      key: 'byKey',
      label: 'themeCustom.byKey',
      columnType: GenericColumnType.input,
    },
    {
      key: 'label',
      label: 'themeCustom.label',
      columnType: GenericColumnType.input,
    },
  ];
  readonly eThemeCustomType = ThemeCustomType;
  readonly eOpenWindowTargetType = OpenWindowTargetType;
  readonly formAlertsObj = computed(() => {
    const required = this.translateService.instant('msg.required');
    return {
      buttonIconFalse: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.buttonIconFalse') +
            required,
        },
      ],
      buttonIconTrue: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.buttonIconTrue') +
            required,
        },
      ],
      buttonIconFill: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.buttonIconFill') +
            required,
        },
      ],
      openUrl: [
        {
          errorId: 'required',
          msg: this.translateService.instant('themeCustom.openUrl') + required,
        },
      ],
      copyValue: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.copyValue') + required,
        },
      ],
      deleteFile: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.deleteFile') + required,
        },
      ],
      moveTo: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.moveToDir') + required,
        },
      ],
      filePathForMoveTo: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.filePathForMoveTo') +
            required,
        },
      ],
      openFolder: [
        {
          errorId: 'required',
          msg:
            this.translateService.instant('themeCustom.openFolder') + required,
        },
      ],
    } satisfies Record<string, FormAlert[]>;
  });

  constructor() {
    effect(() => {
      const data = this.customItem();
      if (!data) return;
      this.form.patchValue(data);
    });
  }

  ngOnInit() {
    const arr = this.formArray;
    arr.setValidators([this.duplicateByKeyValidator()]);
    arr.updateValueAndValidity({ emitEvent: false });
  }

  createGroup() {
    const group = this.fb.group({
      seq: [0],
      type: [ThemeCustomType.openUrl],
      byKey: ['', [Validators.required]],
      label: ['', [Validators.required]],
      apiName: [''],
      openUrl: [''],
      copyValue: [''],
      buttonIconFill: [''],
      buttonIconFillColor: [''],
      buttonIconTrue: [''],
      buttonIconFalse: [''],
      moveTo: [''],
      filePathForMoveTo: [''],
      deleteFile: [''],
      openWindowsTarget: [OpenWindowTargetType._self],
      openFolder: [''],
      apiConfig: [null],
      visibleDatasetNameList: [[]],
    });
    this.initTypeWatcher(group);
    return group;
  }
  initTypeWatcher(group: FormGroup) {
    group.get('type')!.valueChanges.subscribe(type => {
      this.updateValidatorsByType(group, type);
    });

    // 初始化也要跑一次
    this.updateValidatorsByType(group, group.get('type')!.value);
  }
  updateValidatorsByType(group: FormGroup, type: ThemeCustomType) {
    const setRequired = (name: string, required: boolean) => {
      const ctrl = group.get(name);
      if (!ctrl) return;

      if (required) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setErrors(null); // 清除舊錯誤
      }

      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    // 先全部清空
    const allFields = [
      'openUrl',
      'copyValue',
      'buttonIconFill',
      'buttonIconTrue',
      'buttonIconFalse',
      'moveTo',
      'filePathForMoveTo',
      'deleteFile',
      'openFolder',
      'apiName',
    ];
    allFields.forEach(f => setRequired(f, false));

    // 根據 type 開啟需要的
    switch (type) {
      case ThemeCustomType.openUrl:
        setRequired('openUrl', true);
        break;
      case ThemeCustomType.copyValue:
        setRequired('copyValue', true);
        break;
      case ThemeCustomType.moveTo:
        setRequired('moveTo', true);
        setRequired('filePathForMoveTo', true);
        break;
      case ThemeCustomType.openFolder:
        setRequired('openFolder', true);
        break;
      case ThemeCustomType.deleteFile:
        setRequired('deleteFile', true);
        break;
      case ThemeCustomType.buttonIconFill:
        setRequired('buttonIconTrue', true);
        setRequired('buttonIconFalse', true);
        break;
      case ThemeCustomType.apiConfig:
        setRequired('apiName', true);
        break;
    }
    group.updateValueAndValidity();
  }

  selectApi() {
    return this.selectTableService.selectSingleApi(this.apis.value());
  }

  getApiLabelName(itme: ApiConfig) {
    return itme.apiName;
  }

  jsonReset(data: ThemeItem) {
    if (data.type !== ThemeItemType.CUSTOM) return;
    this.resetData.set(data.json);
  }

  private duplicateByKeyValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      const keys = arr.controls
        .map(c => c.get('byKey')?.value)
        .filter(k => !isBlank(k));

      if (isDuplicate(keys)) {
        return { duplicateByKey: true };
      }
      return null;
    };
  }
}
