import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ThemeEditMode,
  ThemeHeader,
  ThemeHeaderType,
  ThemeImageType,
  ThemeItemType,
  ThemeOtherSetting,
} from '../../models';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  isBlank,
  getHeaderId,
  isNotBlank,
  isNull,
} from '../../../../shared/util/helper';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, filter, map, switchMap, tap } from 'rxjs';
import { ThemeCustomTableComponent } from '../../components/theme-custom-table/theme-custom-table.component';
import { ThemeLabelTableComponent } from '../../components/theme-label-table/theme-label-table.component';
import { ThemeDatasetTableComponent } from '../../components/theme-dataset-table/theme-dataset-table.component';
import { ThemeTagTableComponent } from '../../components/theme-tag-table/theme-tag-table.component';
import { ThemeOtherSettingComponent } from '../../components/theme-other-setting/theme-other-setting.component';
import { ThemeTopCustomTableComponent } from '../../components/theme-top-custom-table/theme-top-custom-table.component';
import { QuickRefreshType } from '../../../dataset/model';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ThemeImageComponent } from '../../components/theme-image/theme-image.component';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { FormAlert } from '../../../../core/model';
import { ThemeItemService } from '../../services';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { LayoutStore } from '../../../../core/stores/layout.store';
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    ThemeLabelTableComponent,
    ThemeDatasetTableComponent,
    ThemeTagTableComponent,
    ThemeOtherSettingComponent,
    ThemeTopCustomTableComponent,
    ThemeCustomTableComponent,
    ThemeImageComponent,
    FormInvalidsComponent,
    TrimOnBlurDirective,
  ],
  selector: 'app-theme-edit',
  templateUrl: 'theme-edit.component.html',
  styleUrls: ['theme-edit.component.scss'],
})
export class ThemeEditComponent {
  //inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  readonly translateService = inject(TranslateService);
  readonly fb = inject(FormBuilder);
  readonly themeItemService = inject(ThemeItemService);
  readonly layoutStore = inject(LayoutStore);

  // enums
  readonly eThemeEditMode = ThemeEditMode;
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly eThemeImageType = ThemeImageType;

  //signals
  readonly isValidating = signal(false);
  readonly status = signal(ThemeEditMode.create);
  readonly isEditMode = computed(() => this.status() === ThemeEditMode.edit);
  readonly currentHeaderId = computed(() => {
    const req = this.themeReq();
    if (this.status() !== ThemeEditMode.edit || !req) {
      return '';
    }
    return getHeaderId(req.name, req.version, req.type);
  });
  readonly themeItems = rxResource({
    params: () => this.currentHeaderId(),
    stream: ({ params }) => this.themeItemService.getItemsByHeaderId(params),
  });

  //TODO資料轉移後刪除
  readonly imageItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.IMAGE) ?? undefined;
  });
  readonly imageRawData = computed(
    () =>
      this.headerResource.value()?.themeImage ?? {
        type: ThemeImageType.key,
        imageKey: '',
        imageUrl: '',
      }
  );
  readonly labelItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.LABEL) ?? undefined;
  });
  readonly labelRawData = computed(
    () => this.headerResource.value()?.themeLabelList ?? []
  );
  readonly datasetRawData = computed(
    () => this.headerResource.value()?.themeDatasetList ?? []
  );
  readonly datasetItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.DATASET) ?? undefined;
  });
  readonly customRawData = computed(
    () => this.headerResource.value()?.themeCustomList ?? []
  );
  readonly customItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.CUSTOM) ?? undefined;
  });
  readonly tagRawData = computed(
    () => this.headerResource.value()?.themeTagList ?? []
  );
  readonly tagItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.TAG) ?? undefined;
  });
  readonly otherSettingItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return (
      items.find(item => item.type === ThemeItemType.OTHERSETTING) ?? undefined
    );
  });
  readonly otherSettingRawData = computed(
    () =>
      this.headerResource.value()?.themeOtherSetting ??
      ({
        rowColor: [],
        listPageSize: 0,
        showDuplicate: false,
        themeTopCustomList: [],
        checkFileExist: '',
        useQuickRefresh: false,
        quickRefresh: '',
        quickRefreshType: QuickRefreshType.params,
        useSpider: '',
      } satisfies ThemeOtherSetting)
  );
  readonly topCustomRawData = computed(
    () => this.otherSettingRawData().themeTopCustomList ?? []
  );
  readonly topCustomItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return (
      items.find(item => item.type === ThemeItemType.TOPCUSTOM) ?? undefined
    );
  });

  // form
  readonly form: FormGroup = this.fb.group({
    name: [{ value: '', disabled: this.isEditMode() }, [Validators.required]],
    version: [
      { value: '', disabled: this.isEditMode() },
      [Validators.required],
    ],
    title: [{ value: '', disabled: this.isEditMode() }, [Validators.required]],
    type: [ThemeHeaderType.imageList, [Validators.required]],
    seq: [
      0,
      [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')],
    ],
  });
  readonly nameControl = this.form.get('name') as FormControl;
  readonly versionControl = this.form.get('version') as FormControl;
  readonly typeControl = this.form.get('type') as FormControl;
  readonly titleControl = this.form.get('title') as FormControl;
  readonly seqControl = this.form.get('seq') as FormControl;

  readonly themeReq = toSignal(
    this.route.queryParams.pipe(
      filter(
        params =>
          isNotBlank(params['name']) &&
          isNotBlank(params['version']) &&
          isNotBlank(params['type'])
      ),
      map(params => ({
        name: params['name'],
        version: params['version'],
        type: params['type'],
      }))
    )
  );
  readonly headerResource = rxResource({
    params: () => this.themeReq(),
    stream: ({ params }) => {
      this.status.set(ThemeEditMode.edit);
      return this.themeService.findTheme(params).pipe(
        tap(theme => {
          if (theme === null) {
            this.onBack();
          } else {
            this.form.patchValue(theme);
          }
        })
      );
    },
  });
  readonly formAlertsObj = computed(() => {
    const required = {
      errorId: 'required',
      msg: this.translateService.instant('msg.required'),
    };
    return {
      name: [required],
      version: [required],
      title: [required],
      seq: [
        required,
        {
          errorId: 'pattern',
          msg: this.translateService.instant('msg.integer'),
        },
        {
          errorId: 'min',
          msg: this.translateService.instant('msg.nonNegative'),
        },
      ],
    } satisfies Record<string, FormAlert[]>;
  });

  get themeHeaderType() {
    return this.form.get('type')?.value as ThemeHeaderType;
  }

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.form.get('name')?.disable();
        this.form.get('version')?.disable();
        this.form.get('type')?.disable();
      } else {
        this.form.get('name')?.enable();
        this.form.get('version')?.enable();
        this.form.get('type')?.enable();
      }
    });
  }

  onBack() {
    this.router.navigate(['']);
  }

  // Read full model from the form + list controls
  private getModelFromForm() {
    const base = { ...this.form.value } as ThemeHeader;
    base.themeLabelList = this.form.get('themeLabelList')?.value || [];
    base.themeDatasetList = this.form.get('themeDatasetList')?.value || [];
    base.themeCustomList = this.form.get('themeCustomList')?.value || [];
    base.themeTagList = this.form.get('themeTagList')?.value || [];
    base.themeOtherSetting =
      this.form.get('themeOtherSetting')?.value || base.themeOtherSetting;
    // ensure nested objects exist
    if (!base.themeImage)
      base.themeImage = {
        type: this.eThemeImageType.key,
        imageKey: '',
        imageUrl: '',
      };
    return base;
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.form.valid) {
      this.snackbarService.openI18N('msg.formInvalid');
      return;
    }

    // Build model from form
    const currentModel = this.form.value as ThemeHeader;

    this.isValidating.set(true);
    this.themeService
      .existTheme(currentModel)
      .pipe(
        switchMap(exist => {
          if (this.status() === ThemeEditMode.create && exist) {
            this.snackbarService.openI18N('msg.themeExist');
            return EMPTY;
          }
          if (this.status() === ThemeEditMode.edit && !exist) {
            this.snackbarService.openI18N('msg.themeNotExist');
            return EMPTY;
          }
          return this.themeService.updateTheme(currentModel);
        })
      )
      .subscribe({
        next: () => {
          if (back) {
            this.router.navigate(['']);
          }
          this.snackbarService.openI18N(
            type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
          );
          this.layoutStore.loadList();
          this.isValidating.set(false);
        },
        error: () => {
          this.isValidating.set(false);
        },
      });
  }

  validationOther(header: ThemeHeader) {
    let model = { ...header };
    if (
      model.type === 'imageList' &&
      model.themeOtherSetting.listPageSize <= 0
    ) {
      this.snackbarService.openI18N('otherSetting.listPageSizeMoreZero');
      return false;
    }
    if (model.themeOtherSetting.useQuickRefresh) {
      if (isBlank(model.themeOtherSetting.useSpider)) {
        this.snackbarService.openI18N('msg.quickRefreshSpiderEmpty');
        return false;
      }
      if (isBlank(model.themeOtherSetting.quickRefreshType)) {
        this.snackbarService.openI18N('otherSetting.quickRefreshTypeRequired');
        return false;
      }
      if (isBlank(model.themeOtherSetting.quickRefresh)) {
        this.snackbarService.isBlankMessage('otherSetting.quickRefresh');
        return false;
      }
    }
    return true;
  }
}
