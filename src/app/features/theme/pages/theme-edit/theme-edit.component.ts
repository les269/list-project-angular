import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EMPTY, filter, finalize, map, switchMap, tap } from 'rxjs';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { FormAlert } from '../../../../core/model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { getHeaderId, isNotBlank } from '../../../../shared/util/helper';
import { patchField } from '../../../../shared/util/signal-form';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { ThemeCustomTableComponent } from '../../components/theme-custom-table/theme-custom-table.component';
import { ThemeDatasetTableComponent } from '../../components/theme-dataset-table/theme-dataset-table.component';
import { ThemeImageComponent } from '../../components/theme-image/theme-image.component';
import { ThemeLabelTableComponent } from '../../components/theme-label-table/theme-label-table.component';
import { ThemeOtherSettingComponent } from '../../components/theme-other-setting/theme-other-setting.component';
import { ThemeTagTableComponent } from '../../components/theme-tag-table/theme-tag-table.component';
import { ThemeTopCustomTableComponent } from '../../components/theme-top-custom-table/theme-top-custom-table.component';
import {
  ThemeEditMode,
  ThemeHeader,
  ThemeHeaderType,
  ThemeItemType,
} from '../../models';
import { ThemeItemService } from '../../services';
import { ThemeService } from '../../services/theme.service';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
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
    FormField,
  ],
  selector: 'app-theme-edit',
  templateUrl: 'theme-edit.component.html',
  styleUrls: ['theme-edit.component.scss'],
})
export class ThemeEditComponent {
  // 注入服務
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  readonly translateService = inject(TranslateService);
  readonly themeItemService = inject(ThemeItemService);
  readonly layoutStore = inject(LayoutStore);

  // 列舉
  readonly eThemeEditMode = ThemeEditMode;
  readonly eThemeHeaderType = ThemeHeaderType;

  // 頁面狀態
  readonly isSaving = signal(false);
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
    params: () => this.currentHeaderId() || undefined,
    stream: ({ params }) => this.themeItemService.getItemsByHeaderId(params),
  });

  readonly imageItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.IMAGE) ?? undefined;
  });
  readonly labelItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.LABEL) ?? undefined;
  });
  readonly datasetItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.DATASET) ?? undefined;
  });
  readonly customItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return items.find(item => item.type === ThemeItemType.CUSTOM) ?? undefined;
  });
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
  readonly topCustomItem = computed(() => {
    const items = this.themeItems.value();
    if (!items) return undefined;
    return (
      items.find(item => item.type === ThemeItemType.TOPCUSTOM) ?? undefined
    );
  });

  // 表單
  readonly formModel = signal<ThemeHeader>({
    name: '',
    version: '',
    title: '',
    type: ThemeHeaderType.imageList,
    seq: 0,
  });
  readonly form = form(this.formModel, p => {
    disabled(p.name, { when: () => this.isEditMode() });
    disabled(p.version, { when: () => this.isEditMode() });
    disabled(p.type, { when: () => this.isEditMode() });
    required(p.name);
    required(p.version);
    required(p.title);
    required(p.type);
    required(p.seq);
    min(p.seq, 0);
    validate(p.seq, ({ value }) =>
      Number.isInteger(value()) ? undefined : { kind: 'pattern' }
    );
  });

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
            patchField(this.form, theme);
          }
        })
      );
    },
  });
  private readonly validationMessages = toSignal(
    this.translateService.stream([
      'msg.required',
      'msg.integer',
      'msg.nonNegative',
    ]),
    {
      initialValue: this.translateService.instant([
        'msg.required',
        'msg.integer',
        'msg.nonNegative',
      ]),
    }
  );
  readonly formAlertsObj = computed(() => {
    const messages = this.validationMessages();
    const required = {
      errorId: 'required',
      msg: messages['msg.required'],
    };
    return {
      name: [required],
      version: [required],
      title: [required],
      seq: [
        required,
        {
          errorId: 'pattern',
          msg: messages['msg.integer'],
        },
        {
          errorId: 'min',
          msg: messages['msg.nonNegative'],
        },
      ],
    } satisfies Record<string, FormAlert[]>;
  });

  onBack() {
    this.router.navigate(['']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.isSaving()) return;
    if (!this.form().valid()) {
      this.snackbarService.openI18N('msg.formInvalid');
      return;
    }

    const currentModel = this.form().value();

    this.isSaving.set(true);
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
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          if (back) {
            this.router.navigate(['']);
          }
          this.snackbarService.openI18N(
            type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
          );
          this.layoutStore.loadThemeList();
        },
        error: () => {},
      });
  }
}
