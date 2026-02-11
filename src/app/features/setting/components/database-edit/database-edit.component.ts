import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatabaseConfig, TestConnectionResult } from '../../model';
import { TranslateModule } from '@ngx-translate/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DatabaseConfigService } from '../../services/database-config.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DEFAULT_DYNAMIC_DB_KEY } from '../../../../shared/util/global';

@Component({
  selector: 'app-database-edit',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './database-edit.component.html',
  styleUrl: './database-edit.component.scss',
})
export class DatabaseEditComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private databaseService = inject(DatabaseConfigService);
  private messageBoxService = inject(MessageBoxService);
  private snackbarService = inject(SnackbarService);
  readonly dialogRef = inject(MatDialogRef<DatabaseEditComponent>);
  readonly data = inject<{
    databaseConfig: DatabaseConfig;
    databaseConfigList: DatabaseConfig[];
    isAdd: boolean;
  }>(MAT_DIALOG_DATA);
  form: FormGroup = this.formBuilder.nonNullable.group(
    {
      configId: ['', [Validators.required]],
      configName: ['', [Validators.required]],
      databaseType: ['sqlite', [Validators.required]],
      sqliteFilePath: [''],
      host: [''],
      port: [''],
      databaseName: [''],
      username: [''],
      password: [''],
      description: [''],
    },
    {
      validators: [
        this.sqlitePathRequiredValidator,
        this.configIdIsDefaultValidator,
      ],
    }
  );

  databaseTypes = ['sqlite', 'postgresql'];

  testSuccess = signal<{ success: boolean; data: DatabaseConfig }>({
    success: false,
    data: {} as DatabaseConfig,
  });

  ngOnInit(): void {
    this.form.patchValue(this.data.databaseConfig);

    if (!this.data.isAdd) {
      this.form.get('configId')?.disable();
      if (this.data.databaseConfig.databaseType === 'sqlite') {
        this.form
          .get('sqliteFilePath')
          ?.setValue(
            this.data.databaseConfig.jdbcUrl.replace('jdbc:sqlite:', '')
          );
      }
      this.form.removeValidators(this.configIdIsDefaultValidator);
    }
    this.onDatabaseTypeChange();
  }

  configIdIsDefaultValidator(group: AbstractControl) {
    const configId = group.get('configId')?.value.trim().toLowerCase();
    if (configId === DEFAULT_DYNAMIC_DB_KEY) {
      return { configIdIsDefault: true };
    }
    return null;
  }

  sqlitePathRequiredValidator(group: AbstractControl) {
    const type = group.get('databaseType')?.value;
    const path = group.get('sqliteFilePath')?.value;

    if (type === 'sqlite' && !path) {
      return { sqlitePathRequired: true };
    }
    return null;
  }

  onDatabaseTypeChange(): void {
    const databaseTypeControl = this.form.get('databaseType');
    databaseTypeControl?.valueChanges.subscribe(value => {
      this.updatePostgresqlValidators(value);
    });
    this.updatePostgresqlValidators(databaseTypeControl?.value);
  }

  updatePostgresqlValidators(databaseType: string): void {
    const sqliteFields = ['sqliteFilePath'];
    const postgresqlFields = [
      'host',
      'port',
      'databaseName',
      'username',
      'password',
    ];

    sqliteFields.forEach(field => {
      const control = this.form.get(field);
      if (databaseType === 'sqlite') {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });

    postgresqlFields.forEach(field => {
      const control = this.form.get(field);
      if (databaseType === 'postgresql') {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });
  }

  get isSqlite(): boolean {
    return this.form.get('databaseType')?.value === 'sqlite';
  }

  get isPostgresql(): boolean {
    return this.form.get('databaseType')?.value === 'postgresql';
  }

  testConnection() {
    if (this.isSqlite) {
      this.form
        .get('sqliteFilePath')
        ?.setValue(
          this.form.value.sqliteFilePath
            .trim()
            .replace(/[\u2000-\u200F\u202A-\u202F\uFEFF]/g, '')
        );
      this.form.get('sqliteFilePath')?.updateValueAndValidity();
    }

    this.databaseService
      .testConnection(this.form.value)
      .subscribe((result: TestConnectionResult) => {
        if (result.success) {
          this.testSuccess.set({
            success: true,
            data: this.form.value,
          });
          this.snackbarService.openI18N('msg.testConnectionSuccess');
        } else {
          this.testSuccess.set({ success: false, data: {} as DatabaseConfig });
          this.messageBoxService.openI18N('msg.testConnectionFailed', {
            params: { message: result.message },
            onlyOk: true,
          });
        }
      });
  }

  onSubmit(): void {
    console.log(this.form.getRawValue());
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.updateValueAndValidity();
        if (control?.invalid) {
          console.log('Invalid control:', key, control.errors);
        }
      });
      return;
    }
    if (
      JSON.stringify(this.form.value) !==
      JSON.stringify(this.testSuccess().data)
    ) {
      this.testSuccess.set({ success: false, data: {} as DatabaseConfig });
      this.snackbarService.openI18N('msg.pleaseTestIfUpdata');
      return;
    }
    if (
      this.data.isAdd &&
      this.data.databaseConfigList.some(
        config => config.configId === this.form.value.configId
      )
    ) {
      this.snackbarService.openI18N('msg.configIdExist');
      return;
    }
    const configId = this.data.isAdd
      ? this.form.value.configId.trim()
      : this.data.databaseConfig.configId;
    const databaseConfig: DatabaseConfig = {
      ...this.form.value,
      configId: configId,
      enabled: 1,
      driverClassName: '',
      hibernateDialect: '',
      additionalProperties: '',
      jdbcUrl: this.generateJdbcUrl(),
    };
    this.databaseService.saveConfig(databaseConfig).subscribe(() => {
      this.snackbarService.openI18N('msg.saveSuccess', {
        onlyOk: true,
      });
      this;
      this.dialogRef.close(true);
    });
  }

  generateJdbcUrl() {
    const formValue = this.form.value;
    if (formValue.databaseType === 'sqlite') {
      return `jdbc:sqlite:${formValue.sqliteFilePath.trim().replace(/\\/g, '/')}`;
    } else if (formValue.databaseType === 'postgresql') {
      return `jdbc:postgresql://${formValue.host}:${formValue.port}/${formValue.databaseName}`;
    }
    return '';
  }
}
