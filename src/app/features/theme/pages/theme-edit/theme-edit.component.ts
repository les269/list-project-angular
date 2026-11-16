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
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, filter, finalize, map, switchMap, tap } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { EditMode } from '../../../../core/model/global.model';
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { getHeaderId, isNotBlank } from '../../../../shared/util/helper';
import { patchField } from '../../../../shared/util/signal-form';
import { ThemeCustomTableComponent } from '../../components/theme-custom-table/theme-custom-table.component';
import { ThemeDatasetTableComponent } from '../../components/theme-dataset-table/theme-dataset-table.component';
import { ThemeImageComponent } from '../../components/theme-image/theme-image.component';
import { ThemeLabelTableComponent } from '../../components/theme-label-table/theme-label-table.component';
import { ThemeOtherSettingComponent } from '../../components/theme-other-setting/theme-other-setting.component';
import { ThemeTagTableComponent } from '../../components/theme-tag-table/theme-tag-table.component';
import { ThemeTopCustomTableComponent } from '../../components/theme-top-custom-table/theme-top-custom-table.component';
import { ThemeHeader, ThemeHeaderType, ThemeItemType } from '../../models';
import { ThemeItemService } from '../../services';
import { ThemeService } from '../../services/theme.service';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    ThemeLabelTableComponent,
    ThemeDatasetTableComponent,
    ThemeTagTableComponent,
    ThemeOtherSettingComponent,
    ThemeTopCustomTableComponent,
    ThemeCustomTableComponent,
    ThemeImageComponent,
    SignalFieldComponent,
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
  readonly themeItemService = inject(ThemeItemService);
  readonly layoutStore = inject(LayoutStore);

  // 列舉
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly fieldType = SignalFieldType;
  readonly themeTypeOptions = Object.values(ThemeHeaderType).map(value => ({
    value,
    label: `themeHeader.${value}`,
  }));

  // 頁面狀態
  readonly isSaving = signal(false);
  readonly status = signal<EditMode>(EditMode.CREATE);
  readonly isEditMode = computed(() => this.status() === EditMode.EDIT);
  readonly currentHeaderId = computed(() => {
    const req = this.themeReq();
    if (this.status() !== EditMode.EDIT || !req) {
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
    required(p.name, { message: 'msg.required' });
    required(p.version, { message: 'msg.required' });
    required(p.title, { message: 'msg.required' });
    required(p.type, { message: 'msg.required' });
    required(p.seq, { message: 'msg.required' });
    min(p.seq, 0, { message: 'msg.nonNegative' });
    validate(p.seq, ({ value }) =>
      Number.isInteger(value())
        ? undefined
        : { kind: 'pattern', message: 'msg.integer' }
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
      this.status.set(EditMode.EDIT);
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
          if (this.status() === EditMode.CREATE && exist) {
            this.snackbarService.openI18N('msg.themeExist');
            return EMPTY;
          }
          if (this.status() === EditMode.EDIT && !exist) {
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
