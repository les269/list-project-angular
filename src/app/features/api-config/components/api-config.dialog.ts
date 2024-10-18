import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ApiConfig, HttpMethodType } from '../model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { isBlank, isNotJson, jsonFormat } from '../../../shared/util/helper';
import { ApiConfigService } from '../service/api-config.service';

export interface ApiConfigDialogData {
  value: ApiConfig;
  list: ApiConfig[];
  type: 'add' | 'edit';
}
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
  ],
  selector: 'app-api-config-dialog',
  templateUrl: 'api-config.dialog.html',
})
export class ApiConfigDialog {
  readonly dialogRef = inject(MatDialogRef<ApiConfigDialog>);
  readonly data = inject<ApiConfigDialogData>(MAT_DIALOG_DATA);
  value = this.data.value;
  list = this.data.list;
  type = this.data.type;
  eHttpMethodType = HttpMethodType;

  constructor(
    private snackbarService: SnackbarService,
    private apiConfigService: ApiConfigService
  ) {}

  onOk(): void {
    const {
      apiName,
      apiLabel,
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
    if (isBlank(apiLabel)) {
      this.snackbarService.isBlankMessage('apiConfig.apiLabel');
      return;
    }
    if (isBlank(endpointUrl)) {
      this.snackbarService.isBlankMessage('apiConfig.endpointUrl');
      return;
    }
    if (
      this.type === 'add' &&
      this.list.find(
        x => x.apiName === apiName.trim() && x.apiLabel === apiLabel.trim()
      )
    ) {
      this.snackbarService.openByI18N('msg.apiExist');
      return;
    }
    if (
      (httpMethod === 'post' || httpMethod === 'put') &&
      isNotJson(requestBody)
    ) {
      this.snackbarService.openByI18N('msg.jsonError');
      return;
    }
    this.apiConfigService
      .update({
        apiName: apiName.trim(),
        apiLabel: apiLabel.trim(),
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
