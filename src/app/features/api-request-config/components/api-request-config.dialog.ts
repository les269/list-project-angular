import { EditMode } from '../../../core/model/global.model';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  min,
  readonly as readonlyField,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, of, switchMap } from 'rxjs';
import { GenericTableComponent } from '../../../core/components/generic-table/generic-table.component';
import { SignalFieldComponent } from '../../../core/components/signal-field/signal-field.component';
import { SignalFieldType } from '../../../core/model/signal-field.model';
import { EnumOptionsPipe } from '../../../shared/util/util.pipe';
import { SignalCodeEditorComponent } from '../../../core/components/signal-code-editor/signal-code-editor.component';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../core/model/generic-table';
import { SnackbarService } from '../../../core/services/snackbar.service';
import {
  CookieTableDialogComponent,
  CookieTableDialogData,
} from '../../spider/components/cookie-table-dialog/cookie-table-dialog.component';
import {
  HeadersTableDialogComponent,
  HeadersTableDialogData,
} from '../../spider/components/headers-table-dialog/headers-table-dialog.component';
import { CookieListMapType, HeadersMapType } from '../../spider/model';
import {
  ApiRequestBodyType,
  ApiRequestConfig,
  ApiRequestConfigDialogData,
  ApiRequestQueryParam,
  ApiRequestSettings,
  createApiRequestQueryParam,
  createApiRequestSettings,
  HttpMethodType,
} from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';
import {
  buildRequestUrl,
  synchronizeQueryParameters,
} from '../util/request-query';

@Component({
  selector: 'app-api-request-config-dialog',
  templateUrl: './api-request-config.dialog.html',
  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    MatTabsModule,
    TranslatePipe,
    SignalCodeEditorComponent,
    SignalFieldComponent,
    GenericTableComponent,
    EnumOptionsPipe,
  ],
})
export class ApiRequestConfigDialog {
  readonly dialogRef = inject(MatDialogRef<ApiRequestConfigDialog, boolean>);
  readonly data = inject<ApiRequestConfigDialogData>(MAT_DIALOG_DATA);
  readonly editMode = EditMode;
  private readonly service = inject(ApiRequestConfigService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly isSaving = signal(false);
  readonly saveFailed = signal(false);
  private readonly duplicateApiId = signal('');
  readonly eHttpMethod = HttpMethodType;
  readonly fieldType = SignalFieldType;
  readonly eBodyType = ApiRequestBodyType;
  readonly entryColumns: GenericTableColumn[] = [
    {
      key: 'enabled',
      label: 'apiRequestConfig.entryEnabled',
      columnType: GenericColumnType.custom,
      width: '90px',
    },
    { key: 'name', label: 'Key', columnType: GenericColumnType.custom },
    { key: 'value', label: 'Value', columnType: GenericColumnType.custom },
  ];
  readonly displayedEntryColumns = ['enabled', 'name', 'value'];
  readonly createQueryRow = createApiRequestQueryParam;
  readonly createBodyRow = createApiRequestQueryParam;
  private readonly bodyFormatFailure = signal<string | undefined>(undefined);
  readonly valueModel = signal({
    apiId: this.data.value.apiId,
    description: this.data.value.description,
    config: this.initialConfig(),
  } satisfies ApiRequestConfig);
  readonly bodyFormatFailed = computed(
    () =>
      this.bodyFormatFailure() !== undefined &&
      this.bodyFormatFailure() === this.valueModel().config.requestBody
  );
  readonly codeLanguage = computed(() => {
    const type = this.valueModel().config.bodyType;
    return type === ApiRequestBodyType.text ? '' : type;
  });
  readonly valueForm = form(this.valueModel, p => {
    readonlyField(p, { when: () => this.isSaving() });
    disabled(p.apiId, {
      when: () => this.data.type === EditMode.EDIT || this.isSaving(),
    });
    disabled(p.config.httpMethod, { when: () => this.isSaving() });
    disabled(p.config.bodyType, { when: () => this.isSaving() });
    disabled(p.config.enabled, { when: () => this.isSaving() });
    disabled(p.config.httpParams, { when: () => this.isSaving() });
    disabled(p.config.bodyFormFields, { when: () => this.isSaving() });
    required(p.apiId, { message: 'apiRequestConfig.errors.required' });
    validate(p.apiId, ({ value }) => {
      const rawApiId = value();
      const apiId = rawApiId.trim();
      if (!apiId)
        return rawApiId
          ? { kind: 'required', message: 'apiRequestConfig.errors.required' }
          : undefined;
      return apiId === this.duplicateApiId()
        ? {
            kind: 'duplicateApiId',
            message: 'apiRequestConfig.errors.duplicateApiId',
          }
        : undefined;
    });
    required(p.config.endpointUrl, {
      message: 'apiRequestConfig.errors.requiredEndpointUrl',
    });
    min(p.config.timeoutMs, 1, {
      message: 'apiRequestConfig.errors.invalidTimeout',
    });
    validate(p.config.timeoutMs, ({ value }) =>
      value() < 1 || Number.isSafeInteger(value())
        ? undefined
        : {
            kind: 'invalidTimeout',
            message: 'apiRequestConfig.errors.invalidTimeout',
          }
    );
  });
  private initialConfig() {
    const config = createApiRequestSettings(this.data.value.config);
    const editorConfig = {
      ...config,
      httpParams: this.withSequence(
        synchronizeQueryParameters(config.endpointUrl, config.httpParams)
      ),
      bodyFormFields: this.withSequence(config.bodyFormFields),
    };
    return editorConfig satisfies ApiRequestSettings;
  }

  private withSequence<T>(rows: T[]): (T & { seq: number })[] {
    return rows.map((row, index) => ({ ...row, seq: index + 1 }));
  }

  onEndpointUrlInput(event: Event): void {
    if (this.isSaving()) return;
    const endpointUrl = (event.target as HTMLInputElement).value;
    this.valueModel.update(value => ({
      ...value,
      config: {
        ...value.config,
        endpointUrl,
        httpParams: this.withSequence(
          synchronizeQueryParameters(endpointUrl, value.config.httpParams)
        ),
      },
    }));
  }

  onParamTextInput(index: number, key: string, event: Event): void {
    if (key !== 'name' && key !== 'value') return;
    const text = (event.target as HTMLInputElement).value;
    this.updateQueryParameter(
      index,
      key === 'value' ? { value: text } : { name: text }
    );
  }

  onParamEnabledChange(index: number, event: Event): void {
    this.updateQueryParameter(index, {
      enabled: (event.target as HTMLInputElement).checked,
    });
  }

  updateQueryParameter(
    index: number,
    patch: Partial<ApiRequestQueryParam>
  ): void {
    if (this.isSaving()) return;
    this.valueForm.config
      .httpParams()
      .value.update(rows =>
        rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
      );
    this.syncQueryUrl();
  }

  syncQueryUrl(): void {
    if (this.isSaving()) return;
    this.valueModel.update(value => {
      return {
        ...value,
        config: {
          ...value.config,
          endpointUrl: buildRequestUrl(
            value.config.endpointUrl,
            value.config.httpParams
          ),
        },
      };
    });
    this.valueForm.config.httpParams().markAsDirty();
    this.valueForm.config.endpointUrl().markAsDirty();
  }

  openCookies(): void {
    if (this.isSaving() || this.data.type !== EditMode.EDIT) return;
    this.dialog.open<CookieTableDialogComponent, CookieTableDialogData>(
      CookieTableDialogComponent,
      {
        data: { refId: this.data.value.apiId, mapType: CookieListMapType.API },
        width: '1100px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        autoFocus: false,
      }
    );
  }

  openHeaders(): void {
    if (this.isSaving() || this.data.type !== EditMode.EDIT) return;
    this.dialog.open<HeadersTableDialogComponent, HeadersTableDialogData>(
      HeadersTableDialogComponent,
      {
        data: { refId: this.data.value.apiId, mapType: HeadersMapType.API },
        width: '1100px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        autoFocus: false,
      }
    );
  }

  formatBody(): void {
    if (
      this.isSaving() ||
      this.valueModel().config.bodyType !== ApiRequestBodyType.json
    )
      return;
    const body = this.valueModel().config.requestBody;
    if (!body.trim()) return;
    try {
      this.valueForm.config
        .requestBody()
        .value.set(JSON.stringify(JSON.parse(body), null, 2));
      this.valueForm.config.requestBody().markAsDirty();
      this.bodyFormatFailure.set(undefined);
    } catch {
      this.bodyFormatFailure.set(body);
    }
  }

  onSave(event?: Event): void {
    event?.preventDefault();
    if (this.isSaving()) return;
    this.valueForm().markAsTouched();
    if (this.valueForm().invalid()) return;
    const value = this.valueModel();
    const request: ApiRequestConfig = {
      apiId: value.apiId.trim(),
      description: value.description.trim(),
      config: structuredClone({
        ...value.config,
        endpointUrl: value.config.endpointUrl.trim(),
      }),
    };
    this.isSaving.set(true);
    this.saveFailed.set(false);
    const disableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.service
      .exist(request.apiId)
      .pipe(
        switchMap(exists => {
          if (exists) {
            this.duplicateApiId.set(request.apiId);
            return EMPTY;
          }
          return this.service.update(request);
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
          this.dialogRef.disableClose = disableClose;
        })
      )
      .subscribe({
        next: () => {
          this.snackbar.openI18N('msg.saveSuccess');
          this.dialogRef.close(true);
        },
        error: () => this.saveFailed.set(true),
      });
  }

  onCancel(): void {
    if (!this.isSaving()) this.dialogRef.close();
  }
}
