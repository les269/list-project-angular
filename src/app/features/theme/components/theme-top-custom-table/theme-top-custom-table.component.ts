import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  OpenWindowTargetType,
  ThemeItem,
  ThemeItemType,
  ThemeTopCustom,
  ThemeTopCustomItem,
  ThemeTopCustomType,
} from '../../models';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { ChipSelectButtonComponent } from '../../../../core/components/chip-select-button/chip-select-button.component';
import { ApiConfig } from '../../../api-config/model';

@Component({
  selector: 'app-theme-top-custom-table',
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
    ThemeItemManageComponent,
    FormInvalidsComponent,
    ChipSelectButtonComponent,
  ],
  templateUrl: './theme-top-custom-table.component.html',
})
export class ThemeTopCustomTableComponent {
  //inject
  readonly fb = inject(FormBuilder);
  readonly apiConfigService = inject(ApiConfigService);
  readonly selectTableService = inject(SelectTableService);
  readonly translateService = inject(TranslateService);
  //inputs
  readonly headerId = input<string>();
  readonly topCustomItem = input<ThemeTopCustomItem>();
  readonly oldData = input<ThemeTopCustom[]>();
  //form
  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.array([]),
  });
  readonly formArray = this.form.get('json') as ToFormArray<ThemeTopCustom>;
  //signals
  readonly initData = computed(() => {
    const resetData = this.resetData();
    if (resetData) {
      return resetData;
    }
    return this.topCustomItem()?.json || this.oldData() || [];
  });
  readonly resetData = signal<ThemeTopCustom[] | null>(null);
  readonly defaultBinding = computed(() =>
    this.topCustomItem() ? true : false
  );
  readonly apis = rxResource({
    stream: () => this.apiConfigService.getAll(),
    defaultValue: [],
  });
  readonly formAlertsObj = computed(() => {
    const required = this.translateService.instant('msg.required');
    return {
      openUrl: [
        {
          errorId: 'required',
          msg: this.translateService.instant('themeCustom.openUrl') + required,
        },
      ],
    };
  });
  //enums and constants
  readonly displayedColumns = ['type', 'byKey', 'label'];
  readonly eThemeTopCustomType = ThemeTopCustomType;
  readonly eThemeItemType = ThemeItemType;
  readonly eOpenWindowTargetType = OpenWindowTargetType;
  readonly typeColumn = {
    key: 'type',
    label: 'themeTopCustom.type',
    columnType: GenericColumnType.select,
    data: toKeyValueArray(ThemeTopCustomType),
    dataValue: 'key',
    dataLabel: item => `themeTopCustom.${item.key}`,
  } satisfies SelectColumn<{ key: string; value: string }>;
  readonly cols: GenericTableColumn[] = [
    this.typeColumn,
    {
      key: 'byKey',
      label: 'themeTopCustom.byKey',
      columnType: GenericColumnType.input,
    },
    {
      key: 'label',
      label: 'themeTopCustom.label',
      columnType: GenericColumnType.input,
    },
  ];

  constructor() {
    effect(() => {
      const data = this.topCustomItem();
      if (!data) return;
      this.form.patchValue(data);
    });
  }

  createGroup() {
    const group = this.fb.group({
      seq: [0],
      type: [ThemeTopCustomType.openUrl],
      label: ['', [Validators.required]],
      byKey: ['', [Validators.required]],
      openUrl: [''],
      openWindowsTarget: [OpenWindowTargetType._blank],
      apiName: [''],
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
  updateValidatorsByType(group: FormGroup, type: ThemeTopCustomType) {
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
    const allFields = ['openUrl', 'apiName'];
    allFields.forEach(f => setRequired(f, false));

    // 根據 type 開啟需要的
    switch (type) {
      case ThemeTopCustomType.openUrl:
        setRequired('openUrl', true);
        break;
      case ThemeTopCustomType.apiConfig:
        setRequired('apiName', true);
        break;
    }
    group.updateValueAndValidity();
  }
  selectApi() {
    return this.selectTableService.selectSingleApi(this.apis.value());
  }

  removeApi(element: ThemeTopCustom) {
    element.apiConfig = undefined;
  }

  jsonReset(data: ThemeItem) {
    if (data.type !== ThemeItemType.TOPCUSTOM) return;
    this.resetData.set(data.json);
  }
  getApiLabelName(itme: ApiConfig) {
    return itme.apiName;
  }
}
