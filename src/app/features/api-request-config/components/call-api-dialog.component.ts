import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  form,
  FormField,
  readonly as readonlyField,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { SignalCodeEditorComponent } from '../../../core/components/signal-code-editor/signal-code-editor.component';
import { ApiRequestConfig, CallApiParameters, CallApiResult } from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';

@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    SignalCodeEditorComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-call-api-dialog',
  styleUrl: './call-api-dialog.component.scss',
  templateUrl: './call-api-dialog.component.html',
})
export class CallApiDialogComponent {
  readonly data = inject<ApiRequestConfig>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CallApiDialogComponent>);
  private readonly service = inject(ApiRequestConfigService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isRunning = signal(false);
  readonly executionFailed = signal(false);
  readonly valueModel = signal({ parameters: '{}' });
  readonly valueForm = form(this.valueModel, path => {
    readonlyField(path.parameters, { when: () => this.isRunning() });
    validate(path.parameters, ({ value }) => {
      try {
        this.parseParameters(value());
        return undefined;
      } catch {
        return { kind: 'invalidParameters' };
      }
    });
  });
  readonly result = signal<CallApiResult | undefined>(undefined);

  private parseParameters(value: string): CallApiParameters {
    const parameters: unknown = JSON.parse(value);
    if (
      !parameters ||
      typeof parameters !== 'object' ||
      Array.isArray(parameters)
    ) {
      throw new Error('API parameters must be a JSON object');
    }
    return parameters as CallApiParameters;
  }

  onExecute(event?: Event): void {
    event?.preventDefault();
    if (this.isRunning() || this.data.config.enabled === false) return;
    this.valueForm().markAsTouched();
    if (this.valueForm().invalid()) return;
    const request = {
      apiId: this.data.apiId,
      json: this.parseParameters(this.valueModel().parameters),
    };
    this.isRunning.set(true);
    this.executionFailed.set(false);
    this.result.set(undefined);
    const disableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.service
      .callApi(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isRunning.set(false);
          this.dialogRef.disableClose = disableClose;
        })
      )
      .subscribe({
        next: response =>
          this.showResponse(response.status, response.headers, response.body),
        error: (error: unknown) => {
          this.executionFailed.set(true);
          if (error instanceof HttpErrorResponse) {
            this.showResponse(error.status, error.headers, error.error);
          }
        },
      });
  }

  private showResponse(
    status: number,
    headers: HttpHeaders,
    body: unknown
  ): void {
    this.result.set({
      status,
      headers: JSON.stringify(
        Object.fromEntries(
          headers.keys().map(key => [key, headers.getAll(key) ?? []])
        ),
        null,
        2
      ),
      body:
        typeof body === 'string'
          ? body
          : body == null
            ? ''
            : JSON.stringify(body, null, 2),
      bodyLanguage: typeof body === 'object' && body !== null ? 'json' : '',
    });
  }

  onClose(): void {
    if (!this.isRunning()) this.dialogRef.close();
  }
}
