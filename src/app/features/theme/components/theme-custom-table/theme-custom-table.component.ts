import {
  createThemeCustomRow,
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
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { ChipSelectButtonComponent } from '../../../../core/components/chip-select-button/chip-select-button.component';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { FormAlert } from '../../../../core/model';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { isDuplicate, toKeyValueArray } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { ApiConfig } from '../../../api-config/model';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import {
  OpenWindowTargetType,
  ThemeCustomItem,
  ThemeCustomType,
  ThemeItem,
  ThemeItemType,
} from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  imports: [
    TranslateModule,
    FormField,
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
    TrimOnBlurDirective,
  ],
  selector: 'app-theme-custom-table',
  templateUrl: 'theme-custom-table.component.html',
})
export class ThemeCustomTableComponent {
  // injects
  readonly translateService = inject(TranslateService);
  readonly apiConfigService = inject(ApiConfigService);
  readonly selectTableService = inject(SelectTableService);
  // inputs
  readonly headerId = input<string>();
  readonly customItem = input<ThemeCustomItem>();

  //form
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeCustomItem>({
    type: ThemeItemType.CUSTOM,
    itemId: '',
    description: '',
    json: [],
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    applyEach(p.json, row => {
      required(row.byKey);
      required(row.label);
      required(row.openUrl, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.openUrl,
      });
      required(row.apiName, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.apiConfig,
      });
      required(row.copyValue, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.copyValue,
      });
      required(row.moveTo, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.moveTo,
      });
      required(row.filePathForMoveTo, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.moveTo,
      });
      required(row.deleteFile, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.deleteFile,
      });
      required(row.openFolder, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeCustomType.openFolder,
      });
      required(row.buttonIconFill, {
        when: ({ valueOf }) =>
          valueOf(row.type) === ThemeCustomType.buttonIconFill,
      });
      required(row.buttonIconTrue, {
        when: ({ valueOf }) =>
          valueOf(row.type) === ThemeCustomType.buttonIconBoolean,
      });
      required(row.buttonIconFalse, {
        when: ({ valueOf }) =>
          valueOf(row.type) === ThemeCustomType.buttonIconBoolean,
      });
    });

    validate(p.json, ({ value }) =>
      isDuplicate(
        value()
          .map(row => row.byKey)
          .filter(Boolean)
      )
        ? { kind: 'duplicateByKey' }
        : undefined
    );

    required(p.itemId);
  });
  readonly fields = this.form.json;

  //signals
  readonly defaultBinding = computed(() => (this.customItem() ? true : false));
  readonly apis = rxResource({
    stream: () => this.apiConfigService.getAll(),
    defaultValue: [],
  });
  private readonly validationMessages = toSignal(
    this.translateService.stream([
      'msg.duplicateColumn',
      'themeCustom.byKey',
      'msg.required',
      'themeCustom.buttonIconFalse',
      'themeCustom.buttonIconTrue',
      'themeCustom.buttonIconFill',
      'themeCustom.openUrl',
      'themeCustom.copyValue',
      'themeCustom.deleteFile',
      'themeCustom.moveToDir',
      'themeCustom.filePathForMoveTo',
      'themeCustom.openFolder',
    ]),
    {
      initialValue: this.translateService.instant([
        'msg.duplicateColumn',
        'themeCustom.byKey',
        'msg.required',
        'themeCustom.buttonIconFalse',
        'themeCustom.buttonIconTrue',
        'themeCustom.buttonIconFill',
        'themeCustom.openUrl',
        'themeCustom.copyValue',
        'themeCustom.deleteFile',
        'themeCustom.moveToDir',
        'themeCustom.filePathForMoveTo',
        'themeCustom.openFolder',
      ]),
    }
  );
  readonly formAlerts = computed(() => {
    const messages = this.validationMessages();
    return [
      {
        errorId: 'duplicateByKey',
        msg: this.translateService.instant('msg.duplicateColumn', {
          text: messages['themeCustom.byKey'],
        }),
      },
    ] satisfies FormAlert[];
  });
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
    const messages = this.validationMessages();
    const required = messages['msg.required'];
    return {
      buttonIconFalse: [
        {
          errorId: 'required',
          msg: messages['themeCustom.buttonIconFalse'] + required,
        },
      ],
      buttonIconTrue: [
        {
          errorId: 'required',
          msg: messages['themeCustom.buttonIconTrue'] + required,
        },
      ],
      buttonIconFill: [
        {
          errorId: 'required',
          msg: messages['themeCustom.buttonIconFill'] + required,
        },
      ],
      openUrl: [
        {
          errorId: 'required',
          msg: messages['themeCustom.openUrl'] + required,
        },
      ],
      copyValue: [
        {
          errorId: 'required',
          msg: messages['themeCustom.copyValue'] + required,
        },
      ],
      deleteFile: [
        {
          errorId: 'required',
          msg: messages['themeCustom.deleteFile'] + required,
        },
      ],
      moveTo: [
        {
          errorId: 'required',
          msg: messages['themeCustom.moveToDir'] + required,
        },
      ],
      filePathForMoveTo: [
        {
          errorId: 'required',
          msg: messages['themeCustom.filePathForMoveTo'] + required,
        },
      ],
      openFolder: [
        {
          errorId: 'required',
          msg: messages['themeCustom.openFolder'] + required,
        },
      ],
    } satisfies Record<string, FormAlert[]>;
  });

  constructor() {
    effect(() => {
      const data = this.customItem();
      if (!data) return;
      untracked(() => this.loadItem(data));
    });
  }

  readonly createRow = createThemeCustomRow;

  readonly selectApi = () =>
    this.selectTableService.selectSingleApi(this.apis.value());

  readonly getApiLabelName = (item: ApiConfig) => item.apiName;

  loadItem(data: ThemeItem) {
    if (data.type !== ThemeItemType.CUSTOM) return;
    this.form().reset(normalizeThemeItem(data, this.initialFormValue));
  }
}
