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
import { rxResource } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  min,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { ChipInputColorComponent } from '../../../../core/components/chip-input-color/chip-input-color.component';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { hasFieldError } from '../../../../shared/util/signal-form';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { QuickRefreshType } from '../../../dataset/model';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import {
  DEFAULT_ROW_COLOR,
  ThemeHeaderType,
  ThemeItemType,
  ThemeOtherSettingItem,
} from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { normalizeThemeItem } from '../../util/theme-item-form';

@Component({
  selector: 'app-theme-other-setting',

  imports: [
    FormField,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    TranslatePipe,
    MatFormFieldModule,
    MatChipsModule,
    ChipInputColorComponent,
    ThemeItemManageComponent,
    MatRadioModule,
    TrimOnBlurDirective,
  ],
  templateUrl: './theme-other-setting.component.html',
})
export class ThemeOtherSettingComponent {
  readonly hasError = hasFieldError;
  //enums and constants
  eThemeHeaderType = ThemeHeaderType;
  eQuickRefreshType = QuickRefreshType;
  eThemeItemType = ThemeItemType;
  //inputs
  headerId = input<string>();
  otherSettingItem = input<ThemeOtherSettingItem>();
  themeHeaderType = input<ThemeHeaderType>();
  //inject
  selectTableService = inject(SelectTableService);
  scrapyService = inject(ScrapyService);

  //form
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeOtherSettingItem>({
    type: ThemeItemType.OTHERSETTING,
    itemId: '',
    description: '',
    json: {
      rowColor: [],
      listPageSize: 30,
      themeTopCustomList: [],
      showDuplicate: false,
      checkFileExist: '',
      useQuickRefresh: false,
      quickRefresh: '',
      quickRefreshType: QuickRefreshType.url,
      useSpider: '',
    },
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    required(p.json.listPageSize);
    min(p.json.listPageSize, 1);
    for (const field of [
      p.json.quickRefresh,
      p.json.quickRefreshType,
      p.json.useSpider,
    ]) {
      required(field, {
        when: ({ valueOf }) => valueOf(p.json.useQuickRefresh),
      });
    }

    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    required(p.itemId);
  });
  group = computed(() => this.form.json);
  //signals
  defaultBinding = computed(() => !!this.otherSettingItem());
  scrapyConfigList = rxResource({
    stream: () => this.scrapyService.getAllConfig(),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const data = this.otherSettingItem();
      if (data) {
        untracked(() =>
          this.form().reset(normalizeThemeItem(data, this.initialFormValue))
        );
      }
    });
  }

  // handy getters for template access
  get rowColor() {
    return this.group().rowColor;
  }

  get showDuplicate() {
    return this.group().showDuplicate;
  }

  get listPageSize() {
    return this.group().listPageSize;
  }

  get useQuickRefresh() {
    return this.group().useQuickRefresh;
  }

  get quickRefresh() {
    return this.group().quickRefresh;
  }

  get quickRefreshType() {
    return this.group().quickRefreshType;
  }

  get useSpiderControl() {
    return this.group().useSpider;
  }

  setDefaultColor() {
    this.rowColor().value.set(DEFAULT_ROW_COLOR);
  }

  checkColor(value: string) {
    const hexColorPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexColorPattern.test(value);
  }

  selectUseSpider() {
    this.selectTableService
      .selectSingleScrapy(this.scrapyConfigList.value())
      .subscribe(res => {
        if (res) {
          this.useSpiderControl().value.set(res.name);
        }
      });
  }
}
