import {
  createThemeTopCustomRow,
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
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChipSelectButtonComponent } from '../../../../core/components/chip-select-button/chip-select-button.component';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { ApiConfig } from '../../../api-config/model';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import {
  OpenWindowTargetType,
  ThemeItem,
  ThemeItemType,
  ThemeTopCustom,
  ThemeTopCustomItem,
  ThemeTopCustomType,
} from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  selector: 'app-theme-top-custom-table',

  imports: [
    TranslateModule,
    FormField,
    MatIconModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    GenericTableComponent,
    ThemeItemManageComponent,
    FormInvalidsComponent,
    ChipSelectButtonComponent,
    TrimOnBlurDirective,
  ],
  templateUrl: './theme-top-custom-table.component.html',
})
export class ThemeTopCustomTableComponent {
  //inject
  readonly apiConfigService = inject(ApiConfigService);
  readonly selectTableService = inject(SelectTableService);
  readonly translateService = inject(TranslateService);
  //inputs
  readonly headerId = input<string>();
  readonly topCustomItem = input<ThemeTopCustomItem>();
  //form
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeTopCustomItem>({
    itemId: '',
    description: '',
    json: [],
    type: ThemeItemType.TOPCUSTOM,
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    applyEach(p.json, row => {
      required(row.openUrl, {
        when: ({ valueOf }) => valueOf(row.type) === ThemeTopCustomType.openUrl,
      });
      required(row.apiName, {
        when: ({ valueOf }) =>
          valueOf(row.type) === ThemeTopCustomType.apiConfig,
      });
      required(row.label);
      required(row.byKey);
    });
    required(p.itemId);
  });
  readonly fields = this.form.json;
  //signals
  readonly defaultBinding = computed(() =>
    this.topCustomItem() ? true : false
  );
  readonly apis = rxResource({
    stream: () => this.apiConfigService.getAll(),
    defaultValue: [],
  });
  private readonly validationMessages = toSignal(
    this.translateService.stream(['msg.required', 'themeCustom.openUrl']),
    {
      initialValue: this.translateService.instant([
        'msg.required',
        'themeCustom.openUrl',
      ]),
    }
  );
  readonly formAlertsObj = computed(() => {
    const messages = this.validationMessages();
    const required = messages['msg.required'];
    return {
      openUrl: [
        {
          errorId: 'required',
          msg: messages['themeCustom.openUrl'] + required,
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
      untracked(() => this.loadItem(data));
    });
  }

  readonly createRow = createThemeTopCustomRow;

  readonly selectApi = () =>
    this.selectTableService.selectSingleApi(this.apis.value());

  readonly getApiLabelName = (item: ApiConfig) => item.apiName;

  removeApi(element: ThemeTopCustom) {
    element.apiConfig = undefined;
  }

  loadItem(data: ThemeItem) {
    if (data.type !== ThemeItemType.TOPCUSTOM) return;
    this.form().reset(normalizeThemeItem(data, this.initialFormValue));
  }
}
