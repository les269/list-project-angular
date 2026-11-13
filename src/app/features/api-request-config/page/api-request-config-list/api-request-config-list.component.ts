import { EditMode } from '../../../../core/model/global.model';
import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CallApiDialogComponent } from '../../components/call-api-dialog.component';
import { ApiRequestConfigDialog } from '../../components/api-request-config.dialog';
import { CopyApiRequestConfigDialog } from '../../components/copy-api-request-config.dialog';
import {
  ApiRequestConfig,
  ApiRequestConfigDialogData,
  createApiRequestSettings,
} from '../../model';
import { ApiRequestConfigService } from '../../service/api-request-config.service';

@Component({
  selector: 'app-api-request-config-list',
  templateUrl: './api-request-config-list.component.html',
  styleUrl: './api-request-config-list.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
  ],
})
export class ApiRequestConfigListComponent {
  private readonly service = inject(ApiRequestConfigService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(SnackbarService);
  private readonly messageBox = inject(MessageBoxService);
  private readonly destroyRef = inject(DestroyRef);
  readonly displayedColumns = [
    'apiId',
    'description',
    'enabled',
    'httpMethod',
    'createdTime',
    'updatedTime',
    'actions',
  ];
  readonly searchText = signal('');
  readonly deletingId = signal('');
  readonly requests = rxResource({
    stream: () => this.service.getAll(),
    defaultValue: [],
  });
  readonly dataSource = new MatTableDataSource<ApiRequestConfig>();
  private readonly sort = viewChild(MatSort);

  constructor() {
    this.dataSource.filterPredicate = (item, search) =>
      `${item.apiId} ${item.description}`.toLocaleLowerCase().includes(search);
    this.dataSource.sortingDataAccessor = (item, column) => {
      switch (column) {
        case 'apiId':
        case 'description':
          return item[column];
        case 'enabled':
          return Number(item.config.enabled !== false);
        case 'httpMethod':
          return item.config.httpMethod;
        case 'createdTime':
        case 'updatedTime':
          return item[column] ? new Date(item[column]).getTime() : 0;
        default:
          return '';
      }
    };
    effect(() => {
      this.dataSource.data = this.requests.hasValue()
        ? this.requests.value()
        : [];
      this.dataSource.filter = this.searchText().trim().toLocaleLowerCase();
    });
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
    });
  }

  onAdd(): void {
    this.openEditor(
      { apiId: '', description: '', config: createApiRequestSettings() },
      EditMode.CREATE
    );
  }

  onEdit(item: ApiRequestConfig): void {
    this.openEditor(item, EditMode.EDIT);
  }

  onCopy(item: ApiRequestConfig): void {
    if (this.deletingId() || this.requests.isLoading()) return;
    this.dialog
      .open<CopyApiRequestConfigDialog, ApiRequestConfig, boolean>(
        CopyApiRequestConfigDialog,
        {
          data: item,
          width: '500px',
          maxWidth: '96vw',
        }
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(saved => {
        if (saved) this.requests.reload();
      });
  }

  onExecute(item: ApiRequestConfig): void {
    if (this.deletingId() || this.requests.isLoading()) return;
    this.dialog.open<CallApiDialogComponent, ApiRequestConfig>(
      CallApiDialogComponent,
      {
        data: item,
        width: '1200px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        autoFocus: false,
      }
    );
  }

  private openEditor(value: ApiRequestConfig, type: EditMode): void {
    if (this.deletingId()) return;
    this.dialog
      .open<ApiRequestConfigDialog, ApiRequestConfigDialogData, boolean>(
        ApiRequestConfigDialog,
        {
          data: {
            value,
            type,
          },
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92vh',
        }
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(saved => {
        if (saved) this.requests.reload();
      });
  }

  onDelete(item: ApiRequestConfig): void {
    if (this.deletingId()) return;
    this.deletingId.set(item.apiId);
    this.messageBox
      .openI18N('msg.sureDeleteApi')
      .pipe(
        switchMap(confirmed => (confirmed ? this.service.delete(item) : EMPTY)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingId.set(''))
      )
      .subscribe({
        next: () => {
          this.snackbar.openI18N('msg.deleteSuccess');
          this.requests.reload();
        },
      });
  }
}
