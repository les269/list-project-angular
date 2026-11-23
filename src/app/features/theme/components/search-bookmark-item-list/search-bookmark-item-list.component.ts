import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, finalize, switchMap, take } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  SearchBookmark,
  SearchBookmarkItem,
} from '../../models/search-bookmark.model';
import { SearchBookmarkService } from '../../services/search-bookmark.service';

@Component({
  imports: [
    DatePipe,
    TranslatePipe,
    MatDialogModule,
    MatIconModule,
    MatSortModule,
    MatTableModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  selector: 'app-search-bookmark-item-list',
  styleUrl: './search-bookmark-item-list.component.scss',
  templateUrl: './search-bookmark-item-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBookmarkItemListComponent {
  readonly bookmark = inject<SearchBookmark>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<SearchBookmarkItemListComponent>
  );
  private readonly service = inject(SearchBookmarkService);
  private readonly messageBox = inject(MessageBoxService);
  private readonly snackbar = inject(SnackbarService);

  readonly dataSource = new MatTableDataSource<SearchBookmarkItem>();
  readonly displayedColumns = [
    'drag',
    'seq',
    'id',
    'value',
    'updatedTime',
    'actions',
  ];
  readonly isDeleting = signal(false);
  readonly isSavingOrder = signal(false);
  readonly isBusy = computed(() => this.isDeleting() || this.isSavingOrder());
  readonly filterValue = signal('');
  readonly sort = signal<Sort>({ active: 'seq', direction: 'asc' });
  readonly tableSort = viewChild(MatSort);
  readonly items = rxResource({
    stream: () => this.service.getItemById(this.bookmark.id),
    defaultValue: [],
  });
  readonly canDrag = computed(
    () =>
      !this.isBusy() &&
      !this.items.isLoading() &&
      this.items.hasValue() &&
      this.sort().active === 'seq' &&
      this.sort().direction === 'asc'
  );
  readonly originalItems = computed(() =>
    this.items.hasValue()
      ? [...this.items.value()].sort((a, b) => a.seq - b.seq)
      : []
  );
  readonly orderedItems = linkedSignal(() => this.originalItems());
  readonly hasOrderChanges = computed(() => {
    const original = this.originalItems();
    const ordered = this.orderedItems();
    return (
      original.length !== ordered.length ||
      original.some(
        (item, index) =>
          item.id !== ordered[index].id || item.value !== ordered[index].value
      )
    );
  });

  constructor() {
    this.dataSource.filterPredicate = (item, query) =>
      item.id.toLowerCase().includes(query) ||
      item.value.toLowerCase().includes(query);
    const accessor = this.dataSource.sortingDataAccessor;
    this.dataSource.sortingDataAccessor = (item, column) =>
      column === 'updatedTime'
        ? Date.parse(item.updatedTime ?? '') || 0
        : accessor(item, column);

    effect(() => {
      const items = this.orderedItems();
      untracked(() => (this.dataSource.data = items));
    });
    effect(() => {
      const sort = this.tableSort();
      untracked(() => (this.dataSource.sort = sort ?? null));
    });
    effect(() => {
      const query = this.filterValue().trim().toLowerCase();
      untracked(() => (this.dataSource.filter = query));
    });
  }

  changeSort(sort: Sort) {
    if (this.isBusy() || this.hasOrderChanges()) return;
    this.sort.set(sort);
  }

  deleteItem(item: SearchBookmarkItem) {
    if (
      this.isBusy() ||
      this.hasOrderChanges() ||
      this.items.isLoading() ||
      !this.items.hasValue()
    )
      return;
    this.isDeleting.set(true);
    this.dialogRef.disableClose = true;
    this.messageBox
      .openI18N('searchBookmark.sureDeleteItem', {
        params: { value: item.value },
      })
      .pipe(
        take(1),
        filter(Boolean),
        switchMap(() => this.service.deleteItemById(item.id, item.value)),
        finalize(() => {
          this.isDeleting.set(false);
          this.dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: () => {
          this.items.reload();
          this.snackbar.openI18N('msg.deleteSuccess');
        },
        error: () => {},
      });
  }

  close() {
    if (!this.isBusy()) this.dialogRef.close();
  }

  dropItem(event: CdkDragDrop<SearchBookmarkItem[]>) {
    if (!this.canDrag()) return;
    const current = this.orderedItems();
    const visible = [...event.container.data];
    if (
      event.previousIndex === event.currentIndex ||
      event.previousIndex < 0 ||
      event.currentIndex < 0 ||
      event.previousIndex >= visible.length ||
      event.currentIndex >= visible.length
    )
      return;
    const visibleItems = new Set(visible);
    moveItemInArray(visible, event.previousIndex, event.currentIndex);
    let index = 0;
    // 篩選時僅交換可見資料的位置，保留其他資料在完整清單中的位置。
    const reordered = current.map(item =>
      visibleItems.has(item) ? visible[index++] : item
    );
    this.orderedItems.set(
      reordered.map((value, seqIndex) => ({
        ...value,
        seq: current[seqIndex].seq,
      }))
    );
  }

  resetOrder() {
    if (!this.isBusy()) this.orderedItems.set(this.originalItems());
  }

  saveOrder() {
    if (
      this.isBusy() ||
      !this.hasOrderChanges() ||
      this.items.isLoading() ||
      !this.items.hasValue()
    )
      return;
    this.isSavingOrder.set(true);
    this.dialogRef.disableClose = true;
    this.service
      .updateItemOrder({
        id: this.bookmark.id,
        values: this.orderedItems().map(item => item.value),
      })
      .pipe(
        finalize(() => {
          this.isSavingOrder.set(false);
          this.dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: items => {
          this.items.value.set(items);
          this.snackbar.openI18N('msg.saveSuccess');
        },
        error: () => {},
      });
  }
}
