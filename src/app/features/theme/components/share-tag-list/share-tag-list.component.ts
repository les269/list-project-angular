import {
  Component,
  inject,
  OnInit,
  ViewChild,
  TemplateRef,
  ViewChildren,
  QueryList,
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
import { EMPTY, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { isBlank, parseHeaderId } from '../../../../shared/util/helper';
import { ShareTagValueListComponent } from '../share-tag-value-list/share-tag-value-list.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';

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
export class ShareTagListComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ShareTagListComponent>);
  private readonly shareTagService = inject(ShareTagService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly matDialog = inject(MatDialog);
  private readonly translateService = inject(TranslateService);
  private readonly messageBoxService = inject(MessageBoxService);
  dataSource: MatTableDataSource<ShareTag> = new MatTableDataSource<ShareTag>(
    []
  );
  displayedColumns: string[] = [
    'shareTagId',
    'shareTagName',
    'updatedTime',
    'action',
  ];
  newTagName: string = '';
  newTagId: string = '';
  isEdit: boolean = false;

  @ViewChild('addTagDialog') addTagDialog!: TemplateRef<any>;
  @ViewChild(MatSort) sort!: MatSort;
  private addDialogRef?: MatDialogRef<any>;

  ngOnInit(): void {
    this.shareTagService.getAllTag().subscribe(tags => {
      this.dataSource.data = tags;
    });
  }

  deleteTag(shareTagId: string): void {
    this.shareTagService
      .inUse(shareTagId)
      .pipe(
        switchMap(inUse => {
          if (inUse.length > 0) {
            // show message that the tag is currently bound/used
            this.messageBoxService.openI18N('shareTag.inUse', {
              values: inUse.join('\n'),
            });
            return EMPTY;
          }
          return this.messageBoxService.openI18N(
            'msg.sureDeleteTag',
            undefined,
            true
          );
        }),
        switchMap(result => {
          if (!result) return EMPTY;
          return this.shareTagService.deleteTag(shareTagId);
        }),
        switchMap(() => this.shareTagService.getAllTag())
      )
      .subscribe(x => {
        this.dataSource.data = x;
        this.snackbarService.openByI18N('msg.deleteSuccess');
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onEditTag(tag: ShareTag) {
    this.newTagId = tag.shareTagId;
    this.newTagName = tag.shareTagName;
    this.isEdit = true;
    this.addDialogRef = this.matDialog.open(this.addTagDialog);
    this.addDialogRef.afterClosed().subscribe(() => {
      this.newTagId = '';
      this.newTagName = '';
      this.isEdit = false;
    });
  }

  confirmAddTag() {
    if (isBlank(this.newTagId)) {
      this.snackbarService.isBlankMessage('shareTag.tagId');
      return;
    }
    if (isBlank(this.newTagName)) {
      this.snackbarService.isBlankMessage('shareTag.tagName');
      return;
    }
    if (
      !this.isEdit &&
      this.dataSource.data.find(x => x.shareTagId === this.newTagId.trim())
    ) {
      this.snackbarService.openByI18N('shareTag.tagDuplicate');
      return;
    }

    const payload = {
      shareTagId: this.newTagId.trim(),
      shareTagName: this.newTagName.trim(),
    } as ShareTag;

    this.shareTagService
      .addTag(payload)
      .pipe(switchMap(() => this.shareTagService.getAllTag()))
      .subscribe(tags => {
        this.dataSource.data = tags;
        this.newTagId = '';
        this.newTagName = '';
        this.isEdit = false;
        if (this.addDialogRef) {
          this.addDialogRef.close();
        }
        this.snackbarService.openByI18N('msg.addSuccess');
      });
  }

  openAddDialog() {
    this.addDialogRef = this.matDialog.open(this.addTagDialog);
    this.addDialogRef.afterClosed().subscribe(() => {
      this.newTagId = '';
      this.newTagName = '';
      this.isEdit = false;
    });
    // attach sort after view initialised
    setTimeout(() => {
      if (this.sort) {
        this.dataSource.sort = this.sort;
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
}
