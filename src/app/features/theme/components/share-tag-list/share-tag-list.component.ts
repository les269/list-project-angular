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
import { rxResource } from '@angular/core/rxjs-interop';
import { disabled, form, readonly, required } from '@angular/forms/signals';
import {
  MatDialog,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, filter, finalize, map, switchMap, take } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { EditMode } from '../../../../core/model/global.model';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { ShareTag } from '../../models';
import { ShareTagService } from '../../services/share-tag.service';
import { ShareTagValueListComponent } from '../share-tag-value-list/share-tag-value-list.component';

@Component({
  selector: 'app-share-tag-list',

  imports: [
    SignalFieldComponent,
    CommonModule,
    TranslatePipe,
    MatIconModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
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
  readonly editMode = EditMode;
  readonly tagModel = signal({ shareTagId: '', shareTagName: '' });
  readonly initialTagValue = structuredClone(this.tagModel());
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly filterValue = signal('');
  readonly mode = signal(EditMode.CREATE);

  addTagDialog = viewChild.required<TemplateRef<any>>('addTagDialog');
  sort = viewChild(MatSort);

  private addDialogRef?: MatDialogRef<any>;

  dataSource = rxResource({
    stream: () =>
      this.shareTagService
        .getAllTag()
        .pipe(map(data => new MatTableDataSource<ShareTag>(data))),
    defaultValue: new MatTableDataSource<ShareTag>([]),
  });

  readonly tagForm = form(this.tagModel, p => {
    required(p.shareTagId);
    required(p.shareTagName);
    disabled(p.shareTagId, { when: () => this.mode() === EditMode.EDIT });
    readonly(p, { when: () => this.isSaving() });
  });

  constructor() {
    effect(() => {
      const dataSource = this.dataSource.value();
      const sort = this.sort();
      untracked(() => {
        dataSource.sort = sort ?? null;
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

  deleteTag(shareTagId: string): void {
    if (this.isSaving() || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.shareTagService
      .inUse(shareTagId)
      .pipe(
        switchMap(inUse => {
          if (inUse.length > 0) {
            return this.messageBoxService
              .openI18N('shareTag.inUse', {
                params: { values: inUse.join('\n') },
                onlyOk: true,
              })
              .pipe(switchMap(() => EMPTY));
          }
          return this.messageBoxService.openI18N('msg.sureDeleteTag');
        }),
        take(1),
        filter(result => !!result),
        switchMap(() => this.shareTagService.deleteTag(shareTagId)),
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

  onNoClick(): void {
    this.dialogRef.close();
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value.trim().toLowerCase());
  }

  onEditTag(tag: ShareTag) {
    if (this.isSaving() || this.isDeleting()) return;
    this.tagForm().reset({
      shareTagId: tag.shareTagId,
      shareTagName: tag.shareTagName,
    });
    this.mode.set(EditMode.EDIT);
    this.addDialogRef = this.matDialog.open(this.addTagDialog(), {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
    });
    this.addDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.tagForm().reset(structuredClone(this.initialTagValue));
        this.mode.set(EditMode.CREATE);
      });
  }

  confirmAddTag() {
    if (this.isSaving() || this.isDeleting()) return;
    this.tagForm().markAsTouched();
    const raw = this.tagModel();
    const payload = {
      shareTagId: raw.shareTagId.trim(),
      shareTagName: raw.shareTagName.trim(),
    };
    if (isBlank(payload.shareTagId)) {
      this.snackbarService.isBlankMessage('shareTag.tagId');
      return;
    }
    if (isBlank(payload.shareTagName)) {
      this.snackbarService.isBlankMessage('shareTag.tagName');
      return;
    }
    if (
      this.mode() === EditMode.CREATE &&
      this.dataSource
        .value()
        .data.some(x => x.shareTagId === payload.shareTagId)
    ) {
      this.snackbarService.openI18N('shareTag.tagDuplicate');
      return;
    }

    this.isSaving.set(true);
    const dialogRef = this.addDialogRef;
    if (dialogRef) dialogRef.disableClose = true;
    this.shareTagService
      .addTag(payload)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          if (dialogRef) dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: () => {
          this.dataSource.reload();
          this.mode.set(EditMode.CREATE);
          dialogRef?.close();
          this.snackbarService.openI18N('msg.addSuccess');
        },
        error: () => {},
      });
  }

  openAddDialog() {
    if (this.isSaving() || this.isDeleting()) return;
    this.mode.set(EditMode.CREATE);
    this.tagForm().reset(structuredClone(this.initialTagValue));
    this.addDialogRef = this.matDialog.open(this.addTagDialog(), {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
    });
    this.addDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.tagForm().reset(structuredClone(this.initialTagValue));
        this.mode.set(EditMode.CREATE);
      });
  }

  closeAddDialog() {
    if (this.isSaving()) return;
    if (this.addDialogRef) {
      this.addDialogRef.close();
    }
  }

  onReorderTag(tag: ShareTag) {
    this.matDialog.open(ShareTagValueListComponent, {
      width: '700px',
      maxWidth: 'calc(100vw - 32px)',
      data: tag,
    });
  }

  trackByShareTagId(_: number, item: ShareTag) {
    return item?.shareTagId;
  }
}
