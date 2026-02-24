import {
  Component,
  inject,
  OnInit,
  ViewChildren,
  QueryList,
  ViewChild,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectionModel } from '@angular/cdk/collections';
import { ShareTagService } from '../../services/share-tag.service';
import { ShareTag, ShareTagValue } from '../../models';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { EMPTY, map, switchMap } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-share-tag-value-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './share-tag-value-list.component.html',
  styleUrl: './share-tag-value-list.component.scss',
})
export class ShareTagValueListComponent {
  readonly dialogRef = inject(MatDialogRef<ShareTagValueListComponent>);
  readonly data = inject<ShareTag>(MAT_DIALOG_DATA);
  private readonly shareTagService = inject(ShareTagService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translateService = inject(TranslateService);
  private readonly messageBoxService = inject(MessageBoxService);
  private readonly dialog = inject(MatDialog);
  private addDialogRef?: MatDialogRef<any>;

  dataSource = rxResource({
    stream: () =>
      this.shareTagService.getShareTagValue(this.data.shareTagId).pipe(
        map(data => {
          const ds = new MatTableDataSource<ShareTagValue>(data);
          ds.sort = this.sort();
          return ds;
        })
      ),
    defaultValue: new MatTableDataSource<ShareTagValue>([]),
  });
  displayedColumns: string[] = ['select', 'value', 'updatedTime', 'action'];
  selection = new SelectionModel<ShareTagValue>(true, []);
  shareTagName: string = '';
  newValue: string = '';

  sort = viewChild(MatSort);
  addTagValueDialog = viewChild.required<TemplateRef<any>>('addTagValueDialog');

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.value().filter = filterValue.trim().toLowerCase();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.value().data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.value().data);
  }

  onDeleteSelect() {
    if (this.selection.selected.length === 0) {
      return;
    }

    const selectedValues = this.selection.selected.map(item => item.value);
    this.messageBoxService
      .openI18N(this.translateService.instant('msg.sureDeleteTagValue'))
      .pipe(
        switchMap(result => {
          if (!result) return EMPTY;
          const req: { shareTagId: string; values: string[] } = {
            shareTagId: this.data.shareTagId,
            values: selectedValues,
          };
          return this.shareTagService.deleteShareTagValueList(req);
        })
      )
      .subscribe(x => {
        this.dataSource.reload();
        this.snackbarService.openI18N('msg.deleteSuccess');
        this.selection.clear();
      });
  }

  deleteTag(tagValue: string): void {
    this.messageBoxService
      .openI18N(this.translateService.instant('msg.sureDeleteTagValue'))
      .pipe(
        switchMap(result => {
          if (!result) return EMPTY;
          const req: ShareTagValue = {
            shareTagId: this.data.shareTagId,
            value: tagValue,
          };
          return this.shareTagService.deleteTagValue(req);
        })
      )
      .subscribe(x => {
        this.dataSource.reload();
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  openAddValueDialog(): void {
    this.newValue = '';
    this.addDialogRef = this.dialog.open(this.addTagValueDialog(), {
      width: '400px',
    });
  }

  closeAddValueDialog(): void {
    this.addDialogRef?.close();
  }

  confirmAddValueTag(): void {
    if (!this.newValue || !this.newValue.trim()) {
      this.snackbarService.isBlankMessage('shareTag.tagValue');
      return;
    }

    const req: ShareTagValue = {
      shareTagId: this.data.shareTagId,
      value: this.newValue.trim(),
    };

    this.shareTagService.addTagValue(req).subscribe({
      next: data => {
        this.dataSource.reload();
        this.snackbarService.openI18N('msg.addSuccess');
        this.closeAddValueDialog();
      },
      error: () => {
        this.snackbarService.openI18N('msg.addFailed');
      },
    });
  }
}
