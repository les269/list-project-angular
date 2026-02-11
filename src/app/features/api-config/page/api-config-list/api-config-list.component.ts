import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiConfig, HttpMethodType } from '../../model';
import { MatButtonModule } from '@angular/material/button';
import { ApiConfigService } from '../../service/api-config.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiConfigDialog,
  ApiConfigDialogData,
} from '../../components/api-config.dialog';

import { isNotBlank } from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CommonModule } from '@angular/common';
import { MessageBoxService } from '../../../../core/services/message-box.service';

@Component({
  standalone: true,
  selector: 'app-api-config-list',
  templateUrl: 'api-config-list.component.html',
  styleUrl: 'api-config-list.component.scss',
  imports: [
    MatTableModule,
    MatIconModule,
    TranslateModule,
    MatButtonModule,
    CommonModule,
  ],
})
export class ApiConfigListComponent implements OnInit {
  displayedColumns = ['apiName', 'httpMethod', 'endpointUrl', 'other'];
  list: ApiConfig[] = [];
  constructor(
    private translateService: TranslateService,
    private apiConfigService: ApiConfigService,
    private matDialog: MatDialog,
    private snackbarService: SnackbarService,
    private messageBoxService: MessageBoxService
  ) {}

  ngOnInit() {
    this.getList();
  }

  getList() {
    this.apiConfigService.getAll().subscribe(res => {
      this.list = res;
    });
  }

  onEdit(index: number) {
    this.matDialog
      .open<ApiConfigDialog, ApiConfigDialogData, ApiConfig>(ApiConfigDialog, {
        data: {
          value: this.list[index],
          list: this.list,
          type: 'edit',
        },
        width: '50vw',
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.getList();
        }
      });
  }
  onDelete(index: number) {
    this.messageBoxService.openI18N('msg.sureDeleteApi').subscribe(result => {
      if (isNotBlank(result)) {
        this.apiConfigService.delete(this.list[index]).subscribe(() => {
          this.snackbarService.openI18N('msg.deleteSuccess');
          this.getList();
        });
      }
    });
  }
  onAdd() {
    this.matDialog
      .open<ApiConfigDialog, ApiConfigDialogData, ApiConfig>(ApiConfigDialog, {
        data: {
          value: {
            apiName: '',
            httpMethod: HttpMethodType.get,
            endpointUrl: '',
            requestBody: '',
            httpParams: '',
            httpHeaders: '',
            successMessage: '',
          },
          list: this.list,
          type: 'add',
        },
        width: '50vw',
        panelClass: 'custom-modalbox',
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.getList();
        }
      });
  }
}
