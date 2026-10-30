import { toSignal } from '@angular/core/rxjs-interop';
import {
  createThemeLabelRow,
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
import {
  applyEach,
  disabled,
  form,
  FormField,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { FormAlert } from '../../../../core/model';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { LayoutStore } from '../../../../core/stores/layout.store';
import {
  isDuplicate,
  isNotBlank,
  isValidWidth,
  toKeyValueArray,
} from '../../../../shared/util/helper';
import { hasFieldError } from '../../../../shared/util/signal-form';
import {
  ThemeHeaderType,
  ThemeItem,
  ThemeItemType,
  ThemeLabelItem,
  ThemeLabelType,
} from '../../models';
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
    TranslateModule,
    GenericTableComponent,
    ChipInputComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  selector: 'app-theme-label-table',
  templateUrl: 'theme-label-table.component.html',
})
export class ThemeLabelTableComponent {
  readonly hasError = hasFieldError;
  // inject
  readonly translateService = inject(TranslateService);
  readonly layoutStore = inject(LayoutStore);

  // input
  readonly headerId = input<string>();
  readonly labelItem = input<ThemeLabelItem>();
  readonly themeHeaderType = input<ThemeHeaderType>();
  //enum
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly eThemeLabelType = ThemeLabelType;
  readonly eThemeItemType = ThemeItemType;

  // form
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeLabelItem>({
    type: ThemeItemType.LABEL,
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
      validate(row.maxWidth, ({ value }) =>
        this.themeHeaderType() === this.eThemeHeaderType.table &&
        isNotBlank(value()) &&
        !isValidWidth(value())
          ? { kind: 'invalidMaxWidth' }
          : undefined
      );
      validate(row.minWidth, ({ value }) =>
        this.themeHeaderType() === this.eThemeHeaderType.table &&
        isNotBlank(value()) &&
        !isValidWidth(value())
          ? { kind: 'invalidMinWidth' }
          : undefined
      );
      validate(row.width, ({ value }) =>
        this.themeHeaderType() === this.eThemeHeaderType.table &&
        isNotBlank(value()) &&
        !isValidWidth(value())
          ? { kind: 'invalidWidth' }
          : undefined
      );
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
  // signals
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

  private readonly validationMessages = toSignal(
    this.translateService.stream(['msg.duplicateColumn', 'themeLabel.byKey']),
    {
      initialValue: this.translateService.instant([
        'msg.duplicateColumn',
        'themeLabel.byKey',
      ]),
    }
  );
  readonly formAlerts = computed(() => {
    const messages = this.validationMessages();
    return [
      {
        errorId: 'duplicateByKey',
        msg: this.translateService.instant('msg.duplicateColumn', {
          text: messages['themeLabel.byKey'],
        }),
      },
    ] satisfies FormAlert[];
  });

  constructor() {
    effect(() => {
      const data = this.labelItem();
      if (!data) return;
      untracked(() => this.loadItem(data));
    });
  }

  readonly createRow = createThemeLabelRow;
  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(index: number) {
    const ctrls = this.fields;
    for (let i = 0; i < ctrls.length; i++) {
      if (i === index) continue;
      const state = ctrls[i].isDefaultKey();
      if (!state.value()) continue;
      state.value.set(false);
      state.markAsDirty();
    }
  }

  loadItem(data: ThemeItem) {
    if (data.type !== ThemeItemType.LABEL) return;
    this.form().reset(normalizeThemeItem(data, this.initialFormValue));
  }
}
