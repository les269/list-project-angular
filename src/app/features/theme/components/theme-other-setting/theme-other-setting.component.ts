import { Component, computed, effect, inject, input } from '@angular/core';
import { FormArray, Validators } from '@angular/forms';

import {
  DEFAULT_ROW_COLOR,
  ThemeHeaderType,
  ThemeItem,
  ThemeItemType,
  ThemeOtherSetting,
  ThemeOtherSettingItem,
} from '../../models';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
  FormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ScrapyService } from '../../../scrapy/services/scrapy.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatRadioModule } from '@angular/material/radio';
import { QuickRefreshType } from '../../../dataset/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  selector: 'app-theme-other-setting',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    TranslateModule,
    MatFormFieldModule,
    MatChipsModule,
    ChipInputComponent,
    ThemeItemManageComponent,
    MatRadioModule,
  ],
  templateUrl: './theme-other-setting.component.html',
})
export class ThemeOtherSettingComponent {
  //enums and constants
  eThemeHeaderType = ThemeHeaderType;
  eQuickRefreshType = QuickRefreshType;
  eThemeItemType = ThemeItemType;
  //inputs
  headerId = input<string>();
  otherSettingItem = input<ThemeOtherSettingItem>();
  themeHeaderType = input<ThemeHeaderType>();
  oldData = input.required<ThemeOtherSetting>();
  //inject
  fb = inject(FormBuilder);
  selectTableService = inject(SelectTableService);
  scrapyService = inject(ScrapyService);

  //form
  form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.group({
      rowColor: [[] as string[]],
      listPageSize: [30],
      themeTopCustomList: this.fb.array([]),
      showDuplicate: [false],
      checkFileExist: [''],
      useQuickRefresh: [false],
      quickRefresh: [''],
      quickRefreshType: [QuickRefreshType.url],
      useSpider: [''],
    }),
  });
  group = computed(() => this.form.get('json') as FormGroup);
  //signals
  defaultBinding = computed(() => !!this.otherSettingItem());
  scrapyConfigList = rxResource({
    stream: () => this.scrapyService.getAllConfig(),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const data = this.otherSettingItem();
      const oldData = this.oldData();
      if (data) {
        this.form.patchValue(data, { emitEvent: false });
        return;
      }
      if (oldData) {
        this.group().patchValue(oldData, { emitEvent: false });
      }
    });
  }

  // handy getters for template access
  get rowColor() {
    return this.group().get('rowColor') as FormControl<string[]>;
  }

  get showDuplicate() {
    return this.group().get('showDuplicate') as FormControl<boolean>;
  }

  get listPageSize() {
    return this.group().get('listPageSize') as FormControl<number>;
  }

  get useQuickRefresh() {
    return this.group().get('useQuickRefresh') as FormControl<boolean>;
  }

  get quickRefresh() {
    return this.group().get('quickRefresh') as FormControl<string>;
  }

  get quickRefreshType() {
    return this.group().get('quickRefreshType') as FormControl<string>;
  }

  get useSpiderControl() {
    return this.group().get('useSpider') as FormControl<string>;
  }

  setDefaultColor() {
    this.rowColor.setValue(DEFAULT_ROW_COLOR);
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
          this.useSpiderControl.setValue(res.name);
        }
      });
  }
}
