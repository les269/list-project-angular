import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { disabled, form, readonly, required } from '@angular/forms/signals';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, finalize, switchMap, take } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { EditMode } from '../../../../core/model/global.model';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SearchBookmark } from '../../models/search-bookmark.model';
import { SearchBookmarkService } from '../../services/search-bookmark.service';
import { SearchBookmarkItemListComponent } from '../search-bookmark-item-list/search-bookmark-item-list.component';

@Component({
  imports: [
    DatePipe,
    TranslatePipe,
    MatDialogModule,
    MatIconModule,
    SignalFieldComponent,
  ],
  selector: 'app-search-bookmark-list',
  styleUrl: './search-bookmark-list.component.scss',
  templateUrl: './search-bookmark-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBookmarkListComponent {
  readonly dialogRef = inject(MatDialogRef<SearchBookmarkListComponent>);
  private readonly service = inject(SearchBookmarkService);
  private readonly messageBox = inject(MessageBoxService);
  private readonly snackbar = inject(SnackbarService);
  private readonly matDialog = inject(MatDialog);

  private editorDialogRef?: MatDialogRef<unknown>;

  readonly editMode = EditMode;
  readonly mode = signal(EditMode.CREATE);
  readonly isEditing = signal(false);
  readonly isBusy = signal(false);
  readonly filterValue = signal('');
  readonly bookmarkModel = signal({ id: '', name: '' });
  readonly editorTemplate =
    viewChild.required<TemplateRef<unknown>>('editorTemplate');
  readonly bookmarks = rxResource({
    stream: () => this.service.getAll(),
    defaultValue: [],
  });
  readonly filteredBookmarks = computed(() => {
    const query = this.filterValue().trim().toLowerCase();
    const bookmarks = this.bookmarks.hasValue() ? this.bookmarks.value() : [];
    return bookmarks.filter(bookmark =>
      [bookmark.id, bookmark.name].some(value =>
        value.toLowerCase().includes(query)
      )
    );
  });
  readonly bookmarkForm = form(this.bookmarkModel, p => {
    required(p.id);
    required(p.name);
    disabled(p.id, { when: () => this.mode() === EditMode.EDIT });
    readonly(p, { when: () => this.isBusy() });
  });

  openCreate() {
    if (this.isBusy() || this.isEditing()) return;
    this.mode.set(EditMode.CREATE);
    this.bookmarkForm().reset({ id: '', name: '' });
    this.openEditor();
  }

  openEdit(bookmark: SearchBookmark) {
    if (this.isBusy() || this.isEditing()) return;
    this.mode.set(EditMode.EDIT);
    this.bookmarkForm().reset({ id: bookmark.id, name: bookmark.name });
    this.openEditor();
  }

  cancelEdit() {
    if (this.isBusy()) return;
    this.editorDialogRef?.close();
  }

  save() {
    if (
      this.isBusy() ||
      !this.isEditing() ||
      this.bookmarks.isLoading() ||
      this.bookmarks.error()
    )
      return;
    const raw = this.bookmarkModel();
    const payload = { id: raw.id.trim(), name: raw.name.trim() };
    this.bookmarkModel.set(payload);
    this.bookmarkForm().markAsTouched();
    if (this.bookmarkForm().invalid()) return;
    if (
      this.mode() === EditMode.CREATE &&
      this.bookmarks.value().some(bookmark => bookmark.id === payload.id)
    ) {
      this.snackbar.openI18N('searchBookmark.duplicate');
      return;
    }
    this.setBusy(true);
    this.service
      .update(payload)
      .pipe(finalize(() => this.setBusy(false)))
      .subscribe({
        next: () => {
          this.editorDialogRef?.close();
          this.bookmarks.reload();
          this.snackbar.openI18N('msg.saveSuccess');
        },
        error: () => {},
      });
  }

  deleteBookmark(bookmark: SearchBookmark) {
    if (this.isBusy()) return;
    this.setBusy(true);
    this.messageBox
      .openI18N('searchBookmark.sureDelete', {
        params: { name: bookmark.name },
      })
      .pipe(
        take(1),
        filter(Boolean),
        switchMap(() => this.service.deleteById(bookmark.id)),
        finalize(() => this.setBusy(false))
      )
      .subscribe({
        next: () => {
          if (this.bookmarkModel().id === bookmark.id)
            this.editorDialogRef?.close();
          this.bookmarks.reload();
          this.snackbar.openI18N('msg.deleteSuccess');
        },
        error: () => {},
      });
  }

  close() {
    if (!this.isBusy()) this.dialogRef.close();
  }

  openItems(bookmark: SearchBookmark) {
    if (this.isBusy()) return;
    this.matDialog.open(SearchBookmarkItemListComponent, {
      width: '800px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '92vh',
      data: bookmark,
    });
  }

  private setBusy(value: boolean) {
    this.isBusy.set(value);
    this.dialogRef.disableClose = value;
    if (this.editorDialogRef) this.editorDialogRef.disableClose = value;
  }

  private openEditor() {
    this.isEditing.set(true);
    this.editorDialogRef = this.matDialog.open(this.editorTemplate(), {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'input:not([disabled])',
    });
    this.editorDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.editorDialogRef = undefined;
        this.isEditing.set(false);
        this.mode.set(EditMode.CREATE);
        this.bookmarkForm().reset({ id: '', name: '' });
      });
  }
}
