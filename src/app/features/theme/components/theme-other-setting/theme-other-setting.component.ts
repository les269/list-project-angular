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
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { SelectTableService } from '../../../../core/services/select-table.service';
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
import { SearchBookmarkService } from '../../services/search-bookmark.service';

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
    SignalFieldComponent,
    FormInvalidsComponent,
  ],
  templateUrl: './theme-other-setting.component.html',
  styleUrl: './theme-other-setting.component.scss',
})
export class ThemeOtherSettingComponent {
  private readonly searchBookmarkService = inject(SearchBookmarkService);
  readonly fieldType = SignalFieldType;
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
      searchBookmarkId: '',
    },
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    required(p.json.listPageSize, {
      message: 'otherSetting.listPageSizeRequired',
    });
    min(p.json.listPageSize, 1, { message: 'otherSetting.listPageSizeMin' });
    for (const [field, message] of [
      [p.json.quickRefresh, 'otherSetting.quickRefreshRequired'],
      [p.json.quickRefreshType, 'otherSetting.refreshTypeRequired'],
      [p.json.useSpider, 'otherSetting.useSpiderRequired'],
    ] as const) {
      required(field, {
        when: ({ valueOf }) => valueOf(p.json.useQuickRefresh),
        message,
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
  readonly searchBookmarks = rxResource({
    stream: () => this.searchBookmarkService.getAll(),
    defaultValue: [],
  });
  readonly searchBookmarkOptions = computed(() => {
    const selectedId = this.formModel().json.searchBookmarkId;
    const bookmarks = this.searchBookmarks.hasValue()
      ? this.searchBookmarks.value()
      : [];
    const options = bookmarks.map(bookmark => ({
      value: bookmark.id,
      label: bookmark.name || bookmark.id,
    }));
    if (selectedId && !bookmarks.some(bookmark => bookmark.id === selectedId)) {
      options.push({ value: selectedId, label: selectedId });
    }
    return [{ value: '', label: 'otherSetting.noSearchBookmark' }, ...options];
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
