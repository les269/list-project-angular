import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { disabled, form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, finalize } from 'rxjs';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderPaginationData } from '../../model';
import { SpiderPaginationDataService, SpiderService } from '../../services';
import { SpiderPaginationDataJsonComponent } from '../spider-pagination-data-json/spider-pagination-data-json.component';

export interface SpiderPaginationDataDialogData {
  spiderPaginationId: string;
}

@Component({
  imports: [
    DatePipe,
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatPaginatorModule,
    MatTableModule,
    TranslatePipe,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
  selector: 'app-spider-pagination-data',
  templateUrl: './spider-pagination-data.component.html',
})
export class SpiderPaginationDataComponent {
  readonly displayedColumns = [
    'groupId',
    'dataId',
    'createdTime',
    'updatedTime',
    'lastSuccessTime',
  ];
  readonly data = inject<SpiderPaginationDataDialogData>(MAT_DIALOG_DATA);
  readonly dataService = inject(SpiderPaginationDataService);
  readonly spiderService = inject(SpiderService);
  readonly snackbarService = inject(SnackbarService);
  readonly matDialog = inject(MatDialog);
  readonly destroyRef = inject(DestroyRef);
  readonly refreshing = signal(false);
  readonly records = rxResource({
    stream: () =>
      this.dataService.getBySpiderPaginationId(this.data.spiderPaginationId),
    defaultValue: [] as SpiderPaginationData[],
  });
  readonly rows = computed(() =>
    this.records.hasValue() ? this.records.value() : []
  );
  readonly groupIds = computed(() =>
    [...new Set(this.rows().map(row => row.groupId))].sort()
  );
  readonly filterModel = linkedSignal<string[], { groupId: string }>({
    source: this.groupIds,
    computation: (groups, previous) => {
      const groupId = previous?.value.groupId ?? '';
      return { groupId: groups.includes(groupId) ? groupId : '' };
    },
  });
  readonly filterForm = form(this.filterModel, path => {
    disabled(path, {
      when: () => this.records.isLoading() || this.refreshing(),
    });
  });
  readonly filteredRows = computed(() => {
    const groupId = this.filterModel().groupId;
    return groupId
      ? this.rows().filter(row => row.groupId === groupId)
      : this.rows();
  });
  readonly pageSize = signal(50);
  readonly pageIndex = linkedSignal({
    source: this.filteredRows,
    computation: () => 0,
  });
  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  onForceRefresh() {
    if (this.refreshing() || this.records.isLoading()) return;
    this.refreshing.set(true);
    this.spiderService
      .executePagination(this.data.spiderPaginationId, true)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // HTTP 錯誤由共用 interceptor 顯示，原有清單保留供再次刷新。
        catchError(() => EMPTY),
        finalize(() => this.refreshing.set(false))
      )
      .subscribe(() => {
        // 執行結果只有本次成功寫入的資料，須重新查詢才會取得完整清單。
        this.records.reload();
        this.snackbarService.openI18N('msg.refreshSuccess');
      });
  }

  onOpenData(row: SpiderPaginationData) {
    this.matDialog.open(SpiderPaginationDataJsonComponent, {
      data: row,
      width: '900px',
      maxWidth: '95vw',
    });
  }
}
