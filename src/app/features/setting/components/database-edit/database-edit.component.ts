import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  required,
  readonly,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { defer, finalize, Observable, take } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DEFAULT_DYNAMIC_DB_KEY } from '../../../../shared/util/global';
import { hasFieldError, patchField } from '../../../../shared/util/signal-form';
import {
  DatabaseConfig,
  DatabaseType,
  TestConnectionResult,
} from '../../model';
import { DatabaseConfigService } from '../../services/database-config.service';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-database-edit',
  imports: [
    FormField,
    CommonModule,
    TranslatePipe,
    MatDialogModule,
    MatButtonModule,
    TrimOnBlurDirective,
  ],
  templateUrl: './database-edit.component.html',
  styleUrl: './database-edit.component.scss',
})
export class DatabaseEditComponent implements OnInit {
  readonly hasError = hasFieldError;
  private databaseService = inject(DatabaseConfigService);
  private messageBoxService = inject(MessageBoxService);
  private snackbarService = inject(SnackbarService);
  readonly dialogRef = inject(MatDialogRef<DatabaseEditComponent>);
  readonly data = inject<{
    databaseConfig: DatabaseConfig;
    databaseConfigList: DatabaseConfig[];
    isAdd: boolean;
  }>(MAT_DIALOG_DATA);
  readonly isProcessing = signal(false);
  readonly formModel = signal({
    configId: '',
    configName: '',
    databaseType: DatabaseType.SQLITE,
    sqliteFilePath: '',
    host: '',
    port: 0,
    databaseName: '',
    username: '',
    password: '',
    description: '',
    jdbcUrl: '',
    driverClassName: '',
    hibernateDialect: '',
    additionalProperties: '',
    enabled: 1,
    createdTime: '',
    updatedTime: '',
  });
  readonly form = form(this.formModel, p => {
    readonly(p, { when: () => this.isProcessing() });
    disabled(p.configId, { when: () => !this.data.isAdd });
    validate(p, ({ value }) =>
      this.data.isAdd &&
      value().configId.trim().toLowerCase() === DEFAULT_DYNAMIC_DB_KEY
        ? { kind: 'configIdIsDefault' }
        : undefined
    );
    required(p.sqliteFilePath, {
      when: ({ valueOf }) => valueOf(p.databaseType) === DatabaseType.SQLITE,
    });
    required(p.port, {
      when: ({ valueOf }) =>
        valueOf(p.databaseType) === DatabaseType.POSTGRESQL,
    });
    validate(p.port, ({ value, valueOf }) =>
      valueOf(p.databaseType) === DatabaseType.POSTGRESQL &&
      (!Number.isInteger(value()) || value() < 1 || value() > 65535)
        ? { kind: 'portRange' }
        : undefined
    );
    for (const field of [p.host, p.databaseName, p.username, p.password]) {
      required(field, {
        when: ({ valueOf }) =>
          valueOf(p.databaseType) === DatabaseType.POSTGRESQL,
      });
    }
    required(p.configId);
    required(p.configName);
    required(p.databaseType);
  });

  databaseType = DatabaseType;

  testSuccess = signal<{ success: boolean; data: DatabaseConfig }>({
    success: false,
    data: {} as DatabaseConfig,
  });

  ngOnInit(): void {
    patchField(this.form, this.data.databaseConfig);

    if (!this.data.isAdd) {
      if (this.data.databaseConfig.databaseType === DatabaseType.SQLITE) {
        this.form
          .sqliteFilePath()
          .value.set(
            this.data.databaseConfig.jdbcUrl.replace('jdbc:sqlite:', '')
          );
      }
    }
  }

  get isSqlite(): boolean {
    return this.form.databaseType()?.value() === DatabaseType.SQLITE;
  }

  get isPostgresql(): boolean {
    return this.form.databaseType()?.value() === DatabaseType.POSTGRESQL;
  }

  testConnection() {
    if (this.isProcessing()) return;
    this.form.configId().value.update(value => value.trim());
    if (this.isSqlite) {
      this.form.sqliteFilePath().value.set(
        this.form()
          .value()
          .sqliteFilePath.trim()
          .replace(/[\u2000-\u200F\u202A-\u202F\uFEFF]/g, '')
      );
    }

    if (this.form().invalid()) {
      this.form().markAsTouched();
      this.form().errorSummary()[0]?.fieldTree().focusBoundControl();
      return;
    }
    const snapshot = structuredClone(this.form().value());
    this.testSuccess.set({ success: false, data: {} as DatabaseConfig });
    this.runOperation(
      () => this.databaseService.testConnection(snapshot),
      (result: TestConnectionResult) => {
        if (result.success) {
          this.testSuccess.set({
            success: true,
            data: snapshot,
          });
          this.snackbarService.openI18N('msg.testConnectionSuccess');
        } else {
          this.testSuccess.set({ success: false, data: {} as DatabaseConfig });
          this.messageBoxService.openI18N('msg.testConnectionFailed', {
            params: { message: result.message },
            onlyOk: true,
          });
        }
      }
    );
  }

  private runOperation<T>(
    operation: () => Observable<T>,
    onSuccess: (value: T) => void
  ) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    defer(operation)
      .pipe(
        take(1),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({ next: onSuccess, error: () => {} });
  }

  onSubmit(): void {
    if (this.isProcessing()) return;
    this.form.configId().value.update(value => value.trim());
    if (!this.form().valid()) {
      this.form().markAsTouched();
      return;
    }
    if (
      JSON.stringify(this.form().value()) !==
      JSON.stringify(this.testSuccess().data)
    ) {
      this.testSuccess.set({ success: false, data: {} as DatabaseConfig });
      this.snackbarService.openI18N('msg.pleaseTestIfUpdata');
      return;
    }
    if (
      this.data.isAdd &&
      this.data.databaseConfigList.some(
        config => config.configId === this.form().value().configId
      )
    ) {
      this.snackbarService.openI18N('msg.configIdExist');
      return;
    }
    const configId = this.data.isAdd
      ? this.form().value().configId.trim()
      : this.data.databaseConfig.configId;
    const databaseConfig: DatabaseConfig = {
      ...this.form().value(),
      configId: configId,
      enabled: 1,
      driverClassName: '',
      hibernateDialect: '',
      additionalProperties: '',
      jdbcUrl: this.generateJdbcUrl(),
    };
    this.runOperation(
      () => this.databaseService.saveConfig(databaseConfig),
      () => {
        this.snackbarService.openI18N('msg.saveSuccess', {
          onlyOk: true,
        });
        this.dialogRef.close(true);
      }
    );
  }

  generateJdbcUrl() {
    const formValue = this.form().value();
    if (formValue.databaseType === DatabaseType.SQLITE) {
      return `jdbc:sqlite:${formValue.sqliteFilePath.trim().replace(/\\/g, '/')}`;
    } else if (formValue.databaseType === DatabaseType.POSTGRESQL) {
      return `jdbc:postgresql://${formValue.host}:${formValue.port}/${formValue.databaseName}`;
    }
    return '';
  }
}
