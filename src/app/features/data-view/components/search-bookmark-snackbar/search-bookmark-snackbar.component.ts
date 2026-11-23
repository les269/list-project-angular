import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchBookmarkService } from '../../../theme/services/search-bookmark.service';
import { SearchBookmarkItem } from '../../../theme/models';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { SearchBookmarkItemCreateComponent } from '../../../theme/components/search-bookmark-item-create/search-bookmark-item-create.component';
import { SearchBookmarkItemListComponent } from '../../../theme/components/search-bookmark-item-list/search-bookmark-item-list.component';

export interface SearchBookmarkSnackbarData {
  id: string;
  getSearchValue: () => string;
  onSelect: (value: string) => void;
}

@Component({
  imports: [MatIconModule, TranslatePipe],
  selector: 'app-search-bookmark-snackbar',
  styleUrl: './search-bookmark-snackbar.component.scss',
  templateUrl: './search-bookmark-snackbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBookmarkSnackbarComponent {
  readonly data = inject<SearchBookmarkSnackbarData>(MAT_SNACK_BAR_DATA);
  readonly snackbarRef = inject(
    MatSnackBarRef<SearchBookmarkSnackbarComponent>
  );
  private readonly service = inject(SearchBookmarkService);
  private readonly dialog = inject(MatDialog);

  readonly isAdding = signal(false);
  readonly items = rxResource({
    stream: () => this.service.getItemById(this.data.id),
    defaultValue: [] satisfies SearchBookmarkItem[],
  });
  readonly sortedItems = computed(() =>
    this.items.hasValue()
      ? [...this.items.value()].sort((a, b) => a.seq - b.seq)
      : []
  );

  openCreate() {
    if (this.isAdding() || this.items.isLoading() || this.items.error()) return;
    this.isAdding.set(true);
    this.dialog
      .open<
        SearchBookmarkItemCreateComponent,
        Pick<SearchBookmarkItem, 'id' | 'value'>,
        SearchBookmarkItem
      >(SearchBookmarkItemCreateComponent, {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        data: { id: this.data.id, value: this.data.getSearchValue() },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        this.isAdding.set(false);
        if (result) this.items.reload();
      });
  }

  openConfig() {
    if (this.isAdding()) return;
    this.dialog.open(SearchBookmarkItemListComponent, {
      width: '800px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '92vh',
      data: { id: this.data.id, name: this.data.id },
    });
    this.snackbarRef.dismiss();
  }
}
