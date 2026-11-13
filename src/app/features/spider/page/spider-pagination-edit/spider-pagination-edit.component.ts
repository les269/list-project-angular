import { SignalFieldType } from '../../../../core/model/signal-field.model';
import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  apply,
  min,
  debounce,
  disabled,
  form,
  FormField,
  readonly,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, map, switchMap, take } from 'rxjs';
import { EditMode } from '../../../../core/model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  CookieTableDialogComponent,
  CookieTableDialogData,
} from '../../components/cookie-table-dialog/cookie-table-dialog.component';
import {
  HeadersTableDialogComponent,
  HeadersTableDialogData,
} from '../../components/headers-table-dialog/headers-table-dialog.component';
import {
  CookieListMapType,
  HeadersMapType,
  SpiderPagination,
  ExtractionRuleMode,
  TimeUnit,
  LastUpdateMode,
  UpdateIntervalMode,
  SpiderItem,
  UrlType,
} from '../../model';
import { SpiderPaginationService, SpiderService } from '../../services';
import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { PaginationParamsComponent } from '../../components/pagination-params/pagination-params.component';
import { PaginationUpdateControlComponent } from '../../components/pagination-update-control/pagination-update-control.component';
import { ExtractionRulesComponent } from '../../components/extraction-rules/extraction-rules.component';

import { paramSettingsSchema } from '../../schema/param-settings.schema';
import { paginationUpdateSchema } from '../../schema/pagination-update.schema';
import { applyExtractionRulesSchema } from '../../schema/extraction-rules.schema';

@Component({
  imports: [
    TranslatePipe,
    MatIconModule,
    MatButtonModule,
    SignalFieldComponent,
    PaginationParamsComponent,
    PaginationUpdateControlComponent,
    ExtractionRulesComponent,
    FormField,
    SignalCodeEditorComponent,
  ],
  selector: 'app-spider-pagination-edit',
  templateUrl: './spider-pagination-edit.component.html',
})
export class SpiderPaginationEditComponent {
  readonly fieldType = SignalFieldType;
  readonly saving = signal(false);
  readonly testing = signal(false);
  // 注入服務
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly spiderPaginationService = inject(SpiderPaginationService);
  readonly spiderService = inject(SpiderService);
  readonly matDialog = inject(MatDialog);
  readonly snackbarService = inject(SnackbarService);

  // 狀態
  readonly status = computed<EditMode>(() =>
    this.spiderPaginationId() ? this.editMode.EDIT : this.editMode.CREATE
  );
  readonly spiderPaginationId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('spiderPaginationId') ?? undefined)
    ),
    { initialValue: undefined }
  );
  readonly spiderPagination = rxResource({
    params: () => this.spiderPaginationId(),
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.spiderPaginationService.getById(params);
    },
    defaultValue: {
      spiderPaginationId: '',
      paginationConfig: {
        paramSettings: [],
        startUrl: '',
        nextPageUrlKey: '',
        extractionRuleMode: ExtractionRuleMode.SELECT,
        extractionRuleList: [],
        groupIdTemplate: '',
        dataIdKey: '',
        updateControl: {
          lastUpdateMode: LastUpdateMode.NONE,
          lastUpdateDate: new Date(),
          lastUpdateParamKey: '',
          updateIntervalMode: UpdateIntervalMode.NONE,
          updateInterval: 0,
          updateIntervalUnit: TimeUnit.DAY,
          updateIntervalParamKey: '',
        },
        requestIntervalMs: 0,
        retainHistory: true,
      },
    } satisfies SpiderPagination,
  });
  readonly model = linkedSignal(() => this.spiderPagination.value());
  readonly form = form(this.model, schemaPath => {
    const config = schemaPath.paginationConfig;
    disabled(schemaPath, {
      when: () =>
        this.saving() ||
        this.testing() ||
        this.spiderPagination.isLoading() ||
        !!this.spiderPagination.error(),
    });
    required(schemaPath.spiderPaginationId);
    required(config.startUrl);
    required(config.groupIdTemplate);
    required(config.dataIdKey);
    min(config.requestIntervalMs, 0);
    apply(config.paramSettings, paramSettingsSchema);
    apply(config, paginationUpdateSchema);
    applyExtractionRulesSchema(
      config.extractionRuleList,
      config.extractionRuleMode
    );
    debounce(schemaPath.paginationConfig.startUrl, 300);
    debounce(schemaPath.paginationConfig.nextPageUrlKey, 300);
    disabled(schemaPath.spiderPaginationId, { when: () => this.isEditMode });
  });
  readonly useJsonPath = computed(
    () =>
      this.form.paginationConfig.extractionRuleMode().value() ===
      ExtractionRuleMode.JSON_PATH
  );
  readonly testModel = signal({ html: '', json: '', resultJson: '' });
  readonly testForm = form(this.testModel, path => {
    disabled(path, { when: () => this.form().disabled() });
    readonly(path.resultJson);
  });
  // 常數
  readonly editMode = EditMode;

  get isCreateMode() {
    return this.status() === this.editMode.CREATE;
  }
  get isEditMode() {
    return this.status() === this.editMode.EDIT;
  }

  onCookiesDialog() {
    const data: CookieTableDialogData = {
      refId: this.form.spiderPaginationId().value() ?? '',
      mapType: CookieListMapType.SPIDER_PAGINATION,
    };
    this.matDialog.open(CookieTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  onHeadersDialog() {
    const data: HeadersTableDialogData = {
      refId: this.form.spiderPaginationId().value() ?? '',
      mapType: HeadersMapType.SPIDER_PAGINATION,
    };
    this.matDialog.open(HeadersTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  onFormatJson() {
    if (this.testForm().disabled()) return;
    const json = this.testModel().json;
    if (!json.trim()) return;
    try {
      this.testForm.json().value.set(JSON.stringify(JSON.parse(json), null, 2));
    } catch {
      this.snackbarService.openI18N('msg.invalidJson');
    }
  }

  onTestParse() {
    if (this.form().disabled()) return;
    const config = this.form.paginationConfig;
    if (config.extractionRuleList().invalid()) {
      config.extractionRuleList().markAsTouched();
      this.snackbarService.openI18N('msg.formInvalid');
      return;
    }
    if (this.useJsonPath()) {
      try {
        JSON.parse(this.testModel().json);
      } catch {
        this.snackbarService.openI18N('msg.invalidJson');
        return;
      }
    }
    // 沿用擷取預覽契約，只測試目前規則與貼上的資料。
    const request: SpiderItem = {
      spiderItemId: this.model().spiderPaginationId,
      description: '',
      itemSetting: {
        url: this.model().paginationConfig.startUrl,
        urlType: UrlType.BY_PARAMS,
        mode: config.extractionRuleMode().value(),
        extractionRuleList: structuredClone(
          config.extractionRuleList().value()
        ),
        testData: { ...this.testModel(), resultJson: '' },
        skipWhenUsingUrl: false,
      },
    };
    this.testForm.resultJson().value.set('');
    this.testing.set(true);
    this.spiderService
      .previewExtraction(request)
      .pipe(
        take(1),
        finalize(() => this.testing.set(false))
      )
      .subscribe({
        next: result => {
          this.testForm.resultJson().value.set(JSON.stringify(result, null, 2));
          this.snackbarService.openI18N('msg.extractSuccess');
        },
        error: (error: unknown) => {
          this.snackbarService.openI18N('msg.extractFailed', {
            message:
              error && typeof error === 'object' && 'message' in error
                ? String(error.message ?? '')
                : '',
          });
        },
      });
  }

  update() {
    if (
      this.saving() ||
      this.testing() ||
      this.spiderPagination.isLoading() ||
      this.spiderPagination.error()
    )
      return;
    const formState = this.form();
    if (formState.invalid()) {
      formState.markAsTouched();
      this.snackbarService.openI18N('msg.formInvalid');
      return;
    }
    const id = this.form.spiderPaginationId().value();
    const request = structuredClone(this.model());
    this.saving.set(true);
    this.spiderPaginationService
      .isInUse(id ?? '')
      .pipe(
        switchMap(exist => {
          if (this.isCreateMode && exist) {
            this.snackbarService.openI18N('msg.spiderExist');
            return EMPTY;
          }
          if (this.isEditMode && !exist) {
            this.snackbarService.openI18N('msg.spiderNotExist');
            return EMPTY;
          }
          return this.spiderPaginationService.update(request);
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        if (this.isCreateMode) {
          this.router.navigate(['spider-pagination-edit', id], {
            replaceUrl: true,
          });
        }
        this.snackbarService.openI18N('msg.saveSuccess');
      });
  }

  onBack() {
    this.router.navigate(['spider-pagination-list']);
  }
}
