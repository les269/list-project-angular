import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GroupDataset } from '../../model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DatasetService } from '../../service/dataset.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { MessageBoxComponent } from '../../../../core/components/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { CopyDatasetComponent } from '../../components/copy-dataset/copy-dataset.component';
import { CopyGroupDatasetComponent } from '../../components/copy-group-dataset/copy-group-dataset.component';
import { EditGroupDatasetDataComponent } from '../../components/edit-group-dataset-data/edit-group-dataset-data.component';

@Component({
  selector: 'app-group-dataset-list',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './group-dataset-list.component.html',
  styleUrl: './group-dataset-list.component.scss',
})
export class GroupDatasetListComponent {
  displayedColumns = ['groupName', 'createdTime', 'updatedTime', 'other'];
  list: GroupDataset[] = [];
  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private snackbarService: SnackbarService,
    private groupDatasetService: GroupDatasetService
  ) {}

  ngOnInit() {
    this.getList();
  }
  getList() {
    this.groupDatasetService.getAllGroupDataset().subscribe(res => {
      this.list = res;
    });
  }
  onAdd() {
    this.router.navigate(['group-dataset-edit']);
  }
  onDelete(index: number) {
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteDataset'),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.groupDatasetService
            .deleteGroupDataset(this.list[index].groupName)
            .subscribe(() => {
              this.snackbarService.openByI18N('msg.deletSuccess');
              this.getList();
            });
        }
      });
  }
  onEdit(index: number) {
    this.router.navigate(['group-dataset-edit', this.list[index].groupName]);
  }
  onCopy(index: number) {
    this.matDialog
      .open(CopyGroupDatasetComponent, {
        data: { source: this.list[index] },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.snackbarService.openByI18N('msg.copySuccess');
          this.getList();
        }
      });
  }
  onEditDatasetData(e: GroupDataset) {
    this.matDialog.open(EditGroupDatasetDataComponent, {
      data: {
        groupName: e.groupName,
        primeValue: '',
      },
      minWidth: '60vw',
      autoFocus: false,
    });
  }
}
