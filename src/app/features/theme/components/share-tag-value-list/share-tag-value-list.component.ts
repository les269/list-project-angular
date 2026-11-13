import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, readonly, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, map, switchMap, take } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ShareTag, ShareTagValue } from '../../models';
import { ShareTagService } from '../../services/share-tag.service';

@Component({
  selector: 'app-share-tag-value-list',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],

  imports: [
    FormField,
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './share-tag-value-list.component.html',
  styleUrl: './share-tag-value-list.component.scss',
})
export class ShareTagValueListComponent {
  readonly dialogRef = inject(MatDialogRef<ShareTagValueListComponent>);
  readonly data = inject<ShareTag>(MAT_DIALOG_DATA);
  private readonly shareTagService = inject(ShareTagService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly messageBoxService = inject(MessageBoxService);
  private readonly dialog = inject(MatDialog);
  private addDialogRef?: MatDialogRef<any>;

  dataSource = rxResource({
    stream: () =>
      this.shareTagService.getShareTagValue(this.data.shareTagId).pipe(
        map(data => {
          this.selection.clear();
          return new MatTableDataSource<ShareTagValue>(data);
        })
      ),
    defaultValue: new MatTableDataSource<ShareTagValue>([]),
  });
  displayedColumns: string[] = ['select', 'value', 'updatedTime', 'action'];
  selection = new SelectionModel<ShareTagValue>(true, []);
  shareTagName: string = '';
  readonly newValueModel = signal<string>('');
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly filterValue = signal('');
  // 使用表格已完成篩選、排序與分頁的資料，避免全選時重複排序整份清單。
  readonly currentPageRows = toSignal(
    toObservable(this.dataSource.value).pipe(
      switchMap(dataSource => dataSource.connect())
    ),
    { initialValue: [] as ShareTagValue[] }
  );
  readonly newValueForm = form(this.newValueModel, p => {
    required(p);
    readonly(p, { when: () => this.isSaving() });
  });

  sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);
  addTagValueDialog = viewChild.required<TemplateRef<any>>('addTagValueDialog');

  constructor() {
    effect(() => {
      const dataSource = this.dataSource.value();
      const sort = this.sort();
      const paginator = this.paginator();
      untracked(() => {
        dataSource.sort = sort ?? null;
        dataSource.paginator = paginator ?? null;
      });
    });
    effect(() => {
      const dataSource = this.dataSource.value();
      const filter = this.filterValue();
      untracked(() => {
        dataSource.filter = filter;
      });
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value.trim().toLowerCase());
    this.paginator()?.firstPage();
  }

  isAllSelected() {
    const rows = this.currentPageRows();
    return rows.length > 0 && rows.every(row => this.selection.isSelected(row));
  }

  isPagePartiallySelected() {
    const rows = this.currentPageRows();
    const count = rows.filter(row => this.selection.isSelected(row)).length;
    return count > 0 && count < rows.length;
  }

  toggleAllRows() {
    if (this.isDeleting()) return;
    if (this.isAllSelected()) {
      this.selection.deselect(...this.currentPageRows());
      return;
    }

    this.selection.select(...this.currentPageRows());
  }

  onDeleteSelect() {
    if (
      this.isSaving() ||
      this.isDeleting() ||
      this.selection.selected.length === 0
    ) {
      return;
    }

    const selectedValues = this.selection.selected.map(item => item.value);
    this.isDeleting.set(true);
    this.messageBoxService
      .openI18N('msg.sureDeleteTagValue')
      .pipe(
        take(1),
        switchMap(result => {
          if (!result) return EMPTY;
          const req: { shareTagId: string; values: string[] } = {
            shareTagId: this.data.shareTagId,
            values: selectedValues,
          };
          return this.shareTagService.deleteShareTagValueList(req);
        }),
        finalize(() => this.isDeleting.set(false))
      )
      .subscribe({
        next: () => {
          this.dataSource.reload();
          this.snackbarService.openI18N('msg.deleteSuccess');
          this.selection.clear();
        },
        error: () => {},
      });
  }

  deleteTag(tagValue: string): void {
    if (this.isSaving() || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.messageBoxService
      .openI18N('msg.sureDeleteTagValue')
      .pipe(
        take(1),
        switchMap(result => {
          if (!result) return EMPTY;
          const req: ShareTagValue = {
            shareTagId: this.data.shareTagId,
            value: tagValue,
          };
          return this.shareTagService.deleteTagValue(req);
        }),
        finalize(() => this.isDeleting.set(false))
      )
      .subscribe({
        next: () => {
          this.dataSource.reload();
          this.snackbarService.openI18N('msg.deleteSuccess');
        },
        error: () => {},
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  openAddValueDialog(): void {
    if (this.isSaving() || this.isDeleting()) return;
    this.newValueForm().reset('');
    this.addDialogRef = this.dialog.open(this.addTagValueDialog(), {
      width: '400px',
    });
  }

  closeAddValueDialog(): void {
    if (this.isSaving()) return;
    this.addDialogRef?.close();
  }

  confirmAddValueTag(): void {
    if (this.isSaving() || this.isDeleting()) return;
    this.newValueForm().markAsTouched();
    const value = this.newValueModel().trim();
    if (!value) {
      this.snackbarService.isBlankMessage('shareTag.tagValue');
      return;
    }

    const req: ShareTagValue = {
      shareTagId: this.data.shareTagId,
      value,
    };

    this.isSaving.set(true);
    const dialogRef = this.addDialogRef;
    if (dialogRef) dialogRef.disableClose = true;
    this.shareTagService
      .addTagValue(req)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          if (dialogRef) dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: data => {
          this.dataSource.reload();
          this.snackbarService.openI18N('msg.addSuccess');
          dialogRef?.close();
        },
        error: () => {
          this.snackbarService.openI18N('msg.addFailed');
        },
      });
  }
}
