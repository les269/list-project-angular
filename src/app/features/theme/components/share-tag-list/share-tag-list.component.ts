import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  ViewChildren,
  QueryList,
  signal,
  effect,
  WritableSignal,
  viewChild,
  linkedSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { ShareTagService } from '../../services/share-tag.service';
import { ShareTag } from '../../models';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { EMPTY, switchMap, Subject, take, takeUntil, filter, map } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { isBlank, parseHeaderId } from '../../../../shared/util/helper';
import { ShareTagValueListComponent } from '../share-tag-value-list/share-tag-value-list.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-share-tag-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatListModule,
    TranslateModule,
    MatIconModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './share-tag-list.component.html',
  styleUrl: './share-tag-list.component.scss',
})
export class ShareTagListComponent {
  readonly dialogRef = inject(MatDialogRef<ShareTagListComponent>);
  private readonly shareTagService = inject(ShareTagService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly matDialog = inject(MatDialog);
  private readonly messageBoxService = inject(MessageBoxService);

  readonly displayedColumns: string[] = [
    'shareTagId',
    'shareTagName',
    'updatedTime',
    'action',
  ];
  newTagName = signal('');
  newTagId = signal('');
  isEdit = signal(false);

  // @ViewChild('addTagDialog') addTagDialog!: TemplateRef<any>;
  addTagDialog = viewChild.required<TemplateRef<any>>('addTagDialog');
  sort = viewChild(MatSort);

  private addDialogRef?: MatDialogRef<any>;

  readonly tagsResource = rxResource({
    stream: () => this.shareTagService.getAllTag(),
    defaultValue: [] as ShareTag[],
  });
  dataSource = rxResource({
    stream: () =>
      this.shareTagService.getAllTag().pipe(
        map(data => {
          const ds = new MatTableDataSource<ShareTag>(data);
          ds.sort = this.sort();
          return ds;
        })
      ),
    defaultValue: new MatTableDataSource<ShareTag>([]),
  });

  deleteTag(shareTagId: string): void {
    this.shareTagService
      .inUse(shareTagId)
      .pipe(
        switchMap(inUse => {
          if (inUse.length > 0) {
            // show message that the tag is currently bound/used
            this.messageBoxService.openI18N('shareTag.inUse', {
              params: { values: inUse.join('\n') },
              onlyOk: true,
            });
            return EMPTY;
          }
          return this.messageBoxService.openI18N('msg.sureDeleteTag');
        }),
        filter(result => !!result), // only proceed if user confirmed
        switchMap(result => this.shareTagService.deleteTag(shareTagId))
      )
      .subscribe(x => {
        this.tagsResource.reload();
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.value().filter = filterValue.trim().toLowerCase();
  }

  onEditTag(tag: ShareTag) {
    this.newTagId.set(tag.shareTagId);
    this.newTagName.set(tag.shareTagName);
    this.isEdit.set(true);
    this.addDialogRef = this.matDialog.open(this.addTagDialog());
    this.addDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.newTagId.set('');
        this.newTagName.set('');
        this.isEdit.set(false);
      });
  }

  confirmAddTag() {
    if (isBlank(this.newTagId())) {
      this.snackbarService.isBlankMessage('shareTag.tagId');
      return;
    }
    if (isBlank(this.newTagName())) {
      this.snackbarService.isBlankMessage('shareTag.tagName');
      return;
    }
    if (
      !this.isEdit() &&
      this.dataSource
        .value()
        .data.find(x => x.shareTagId === this.newTagId().trim())
    ) {
      this.snackbarService.openI18N('shareTag.tagDuplicate');
      return;
    }

    const payload = {
      shareTagId: this.newTagId().trim(),
      shareTagName: this.newTagName().trim(),
    } as ShareTag;

    this.shareTagService.addTag(payload).subscribe(tags => {
      this.tagsResource.reload();
      this.isEdit.set(false);
      if (this.addDialogRef) {
        this.addDialogRef.close();
      }
      this.snackbarService.openI18N('msg.addSuccess');
    });
  }

  openAddDialog() {
    this.addDialogRef = this.matDialog.open(this.addTagDialog());
    this.addDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.newTagId.set('');
        this.newTagName.set('');
        this.isEdit.set(false);
      });
    // attach sort after view initialised
    setTimeout(() => {
      if (this.sort) {
        this.dataSource.value().sort = this.sort();
      }
    });
  }

  closeAddDialog() {
    if (this.addDialogRef) {
      this.addDialogRef.close();
    }
  }

  onReorderTag(tag: ShareTag) {
    this.matDialog.open(ShareTagValueListComponent, {
      width: '700px',
      maxWidth: '700px',
      data: tag,
    });
  }

  trackByShareTagId(_: number, item: ShareTag) {
    return item?.shareTagId;
  }
}
