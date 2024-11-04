import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { GroupDatasetScrapyTableComponent } from '../../components/group-dataset-scrapy-table/group-dataset-scrapy-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GroupDataset, GroupDatasetFieldType } from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { debounceTime, EMPTY, filter, switchMap } from 'rxjs';
import { GroupDatasetFieldTableComponent } from '../../components/group-dataset-field-table/group-dataset-field-table.component';
import { isNotBlank } from '../../../../shared/util/helper';

@Component({
  selector: 'app-group-dataset-edit',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    DatasetFieldTableComponent,
    GroupDatasetScrapyTableComponent,
    GroupDatasetFieldTableComponent,
  ],
  templateUrl: './group-dataset-edit.component.html',
  styleUrl: './group-dataset-edit.component.scss',
})
export class GroupDatasetEditComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: GroupDataset = {
    groupName: '',
    config: {
      byKey: '',
      groupDatasetScrapyList: [],
      groupDatasetFieldList: [],
      imageSaveFolder: '',
    },
  };
  eGroupDatasetFieldType = GroupDatasetFieldType;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private groupDatasetService: GroupDatasetService,
    private translateService: TranslateService,
    private snackbarService: SnackbarService
  ) {}
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        debounceTime(100),
        filter(params => isNotBlank(params.get('name'))),
        switchMap(params =>
          this.groupDatasetService.getGroupDataset(params.get('name')!)
        )
      )
      .subscribe(res => {
        if (res === null) {
          this.router.navigate(['group-dataset-list']);
          return;
        }
        this.model = res;
        this.status = 'edit';
      });
  }

  onBack() {
    this.router.navigate(['group-dataset-list']);
  }
  validationModel(): boolean {
    return true;
  }
  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
    this.groupDatasetService
      .existGroupDataset(this.model.groupName)
      .pipe(
        switchMap(exist => {
          if (this.status === 'new' && exist) {
            this.snackbarService.openByI18N('msg.datasetExist');
            return EMPTY;
          }
          if (this.status === 'edit' && !exist) {
            this.snackbarService.openByI18N('msg.datasetNotExist');
            return EMPTY;
          }
          return this.groupDatasetService.updateGroupDataset(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['group-dataset-list']);
        }
        this.snackbarService.openByI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }
}
