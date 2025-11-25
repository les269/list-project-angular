import {
  Component,
  inject,
  OnInit,
  ViewChild,
  TemplateRef,
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
import { isBlank } from '../../../../shared/util/helper';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';

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
  constructor(
    private shareTagService: ShareTagService,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.shareTagService.getAllTag().subscribe(tags => {
      this.dataSource.data = tags;
    });
  }

  deleteTag(shareTagId: string): void {
    this.matDialog
      .open(MessageBoxComponent, {
        data: { message: this.translateService.instant('msg.sureDeleteTag') },
      })
      .afterClosed()
      .pipe(
        switchMap(result => {
          if (!result) return EMPTY;

          // check if the tag is in use before deleting
          return this.shareTagService.inUse(shareTagId).pipe(
            switchMap(inUse => {
              if (inUse) {
                // show message that the tag is currently bound/used
                this.snackbarService.openByI18N('shareTag.inUse');
                return EMPTY;
              }
              return this.shareTagService.deleteTag(shareTagId);
            })
          );
        })
      )
      .pipe(switchMap(() => this.shareTagService.getAllTag()))
      .subscribe(x => {
        this.dataSource.data = x;
        this.snackbarService.openByI18N('msg.deleteSuccess');
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
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

  closeAddDialog() {
    if (this.addDialogRef) {
      this.addDialogRef.close();
    }
  }
}
