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
import {
  GroupDataset,
  GroupDatasetConfigType,
  GroupDatasetFieldType,
} from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { debounceTime, EMPTY, filter, switchMap } from 'rxjs';
import { GroupDatasetFieldTableComponent } from '../../components/group-dataset-field-table/group-dataset-field-table.component';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';

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
    GroupDatasetScrapyTableComponent,
    GroupDatasetFieldTableComponent,
    GroupDatasetApiTableComponent,
  ],
  templateUrl: './group-dataset-edit.component.html',
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
      groupDatasetApiList: [],
      type: GroupDatasetConfigType.scrapy,
    },
  };
  eGroupDatasetFieldType = GroupDatasetFieldType;
  eGroupDatasetConfigType = GroupDatasetConfigType;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private groupDatasetService: GroupDatasetService,
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
    if (isBlank(this.model.groupName)) {
      this.snackbarService.isBlankMessage('dataset.groupName');
      return false;
    }
    if (isBlank(this.model.config.byKey)) {
      this.snackbarService.isBlankMessage('dataset.byKey');
      return false;
    }
    for (const field of this.model.config.groupDatasetFieldList) {
      if (isBlank(field.key)) {
        this.snackbarService.isBlankMessage('dataset.fieldKey');
        return false;
      }
      if (isBlank(field.label)) {
        this.snackbarService.isBlankMessage('dataset.fieldLabel');
        return false;
      }
    }

    for (const scrapy of this.model.config.groupDatasetScrapyList) {
      if (isBlank(scrapy.name)) {
        this.snackbarService.isBlankMessage('dataset.scrapyName');
        return false;
      }
      if (isBlank(scrapy.label)) {
        this.snackbarService.isBlankMessage('dataset.scrapyLabel');
        return false;
      }
    }

    for (const api of this.model.config.groupDatasetApiList) {
      if (isBlank(api.apiName)) {
        this.snackbarService.isBlankMessage('dataset.apiName');
        return false;
      }
      if (isBlank(api.label)) {
        this.snackbarService.isBlankMessage('dataset.apiLabel');
        return false;
      }
    }
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
            this.snackbarService.openI18N('msg.datasetExist');
            return EMPTY;
          }
          if (this.status === 'edit' && !exist) {
            this.snackbarService.openI18N('msg.datasetNotExist');
            return EMPTY;
          }
          return this.groupDatasetService.updateGroupDataset(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['group-dataset-list']);
        }
        this.snackbarService.openI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }
}
