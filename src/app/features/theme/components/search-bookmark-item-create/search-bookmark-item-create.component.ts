import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, readonly, required, validate } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { SearchBookmarkItem } from '../../models';
import { SearchBookmarkService } from '../../services/search-bookmark.service';

@Component({
  imports: [MatDialogModule, TranslatePipe, SignalFieldComponent],
  selector: 'app-search-bookmark-item-create',
  styleUrl: './search-bookmark-item-create.component.scss',
  templateUrl: './search-bookmark-item-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBookmarkItemCreateComponent {
  private readonly data =
    inject<Pick<SearchBookmarkItem, 'id' | 'value'>>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<SearchBookmarkItemCreateComponent, SearchBookmarkItem>
  );
  private readonly service = inject(SearchBookmarkService);

  readonly isSaving = signal(false);
  readonly model = signal({ value: this.data.value });
  readonly itemForm = form(this.model, p => {
    required(p.value);
    validate(p.value, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'msg.required' }
    );
    readonly(p, { when: () => this.isSaving() });
  });

  save() {
    if (this.isSaving()) return;
    this.itemForm().markAsTouched();
    if (this.itemForm().invalid()) return;
    this.isSaving.set(true);
    this.dialogRef.disableClose = true;
    this.service
      .updateItem({ id: this.data.id, ...this.model() })
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: item => this.dialogRef.close(item),
        error: () => {},
      });
  }

  close() {
    if (!this.isSaving()) this.dialogRef.close();
  }
}
