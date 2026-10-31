import { CodeEditor } from '@acrodata/code-editor';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { languages } from '@codemirror/language-data';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { isBlank, isNotJson, jsonFormat } from '../../../shared/util/helper';
import { ApiConfig, HttpMethodType } from '../model';
import { ApiConfigService } from '../service/api-config.service';

export interface ApiConfigDialogData {
  value: ApiConfig;
  list: ApiConfig[];
  type: 'add' | 'edit';
}
@Component({
  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    CodeEditor,
  ],
  selector: 'app-api-config-dialog',
  templateUrl: 'api-config.dialog.html',
})
export class ApiConfigDialog {
  readonly dialogRef = inject(MatDialogRef<ApiConfigDialog>);
  readonly data = inject<ApiConfigDialogData>(MAT_DIALOG_DATA);
  readonly valueModel = signal({
    apiName: this.data.value.apiName ?? '',
    httpMethod: this.data.value.httpMethod,
    endpointUrl: this.data.value.endpointUrl ?? '',
    requestBody: this.data.value.requestBody ?? '',
    httpParams: this.data.value.httpParams ?? '',
    httpHeaders: this.data.value.httpHeaders ?? '',
    successMessage: this.data.value.successMessage ?? '',
    updatedTime: this.data.value.updatedTime ?? 0,
  });
  readonly valueForm = form(this.valueModel, p => {
    disabled(p.apiName, { when: () => this.data.type === 'edit' });
    required(p.apiName);
    required(p.endpointUrl);
  });
  get value() {
    return this.valueModel();
  }
  set value(value) {
    this.valueModel.set(value);
  }
  list = this.data.list;
  type = this.data.type;
  eHttpMethodType = HttpMethodType;
  languages = languages;

  constructor(
    private snackbarService: SnackbarService,
    private apiConfigService: ApiConfigService
  ) {}

  onOk(): void {
    const {
      apiName,
      httpMethod,
      endpointUrl,
      requestBody,
      httpParams,
      httpHeaders,
      successMessage,
      updatedTime,
    } = this.value;
    if (isBlank(apiName)) {
      this.snackbarService.isBlankMessage('apiConfig.apiName');
      return;
    }
    if (isBlank(endpointUrl)) {
      this.snackbarService.isBlankMessage('apiConfig.endpointUrl');
      return;
    }
    if (
      this.type === 'add' &&
      this.list.find(x => x.apiName === apiName.trim())
    ) {
      this.snackbarService.openI18N('msg.apiExist');
      return;
    }
    if (
      (httpMethod === 'post' || httpMethod === 'put') &&
      isNotJson(requestBody)
    ) {
      this.snackbarService.openI18N('msg.jsonError');
      return;
    }
    this.apiConfigService
      .update({
        apiName: apiName.trim(),
        httpMethod,
        endpointUrl: endpointUrl.trim(),
        requestBody: jsonFormat(requestBody),
        httpParams: httpParams.trim(),
        httpHeaders: httpHeaders.trim(),
        successMessage: successMessage.trim(),
        updatedTime,
      })
      .subscribe(res => {
        this.dialogRef.close('success');
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  formatBody() {
    this.value.requestBody = JSON.stringify(
      JSON.parse(this.value.requestBody!),
      undefined,
      2
    );
  }
}
