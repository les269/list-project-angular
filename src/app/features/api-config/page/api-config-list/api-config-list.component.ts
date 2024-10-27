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
import { MessageBoxComponent } from '../../../../core/components/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CommonModule } from '@angular/common';

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
  displayedColumns = [
    'apiName',
    'apiLabel',
    'httpMethod',
    'endpointUrl',
    'other',
  ];
  list: ApiConfig[] = [];
  constructor(
    private translateService: TranslateService,
    private apiConfigService: ApiConfigService,
    private matDialog: MatDialog,
    private snackbarService: SnackbarService
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
    this.matDialog
      .open(MessageBoxComponent, {
        data: { message: this.translateService.instant('msg.sureDeleteApi') },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.apiConfigService.delete(this.list[index]).subscribe(() => {
            this.snackbarService.openByI18N('msg.deletSuccess');
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
            apiLabel: '',
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
