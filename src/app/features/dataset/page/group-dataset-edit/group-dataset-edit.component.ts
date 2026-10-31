import {
  createGroupDatasetField,
  createGroupDatasetApi,
  createGroupDatasetScrapy,
} from '../../util/group-dataset-rows';
import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  applyEach,
  disabled,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { hasFieldError } from '../../../../shared/util/signal-form';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';
import { GroupDatasetFieldTableComponent } from '../../components/group-dataset-field-table/group-dataset-field-table.component';
import { GroupDatasetScrapyTableComponent } from '../../components/group-dataset-scrapy-table/group-dataset-scrapy-table.component';
import {
  DatasetEditMode,
  GroupDataset,
  GroupDatasetConfigType,
  GroupDatasetFieldType,
} from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-group-dataset-edit',

  imports: [
    MatTableModule,
    FormField,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    GroupDatasetFieldTableComponent,
    GroupDatasetScrapyTableComponent,
    GroupDatasetApiTableComponent,
  ],
  templateUrl: './group-dataset-edit.component.html',
})
export class GroupDatasetEditComponent {
  readonly hasError = hasFieldError;
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly snackbarService = inject(SnackbarService);
  // enum
  readonly eGroupDatasetFieldType = GroupDatasetFieldType;
  readonly eGroupDatasetConfigType = GroupDatasetConfigType;
  // signals
  readonly status = signal(DatasetEditMode.create);

  readonly groupDatasetName = toSignal<string | null>(
    this.route.paramMap.pipe(
      map(params => params.get('name')),
      filter(name => isNotBlank(name))
    ),
    { initialValue: undefined }
  );
  readonly groupDataset = rxResource({
    params: () => this.groupDatasetName(),
    stream: ({ params }) => {
      if (params === null) return EMPTY;
      return this.groupDatasetService.getGroupDataset(params);
    },
    defaultValue: undefined,
  });

  // form
  readonly formModel = signal({
    groupName: '',
    config: {
      byKey: '',
      imageSaveFolder: '',
      type: GroupDatasetConfigType.scrapy,
      groupDatasetFieldList: [] as ReturnType<typeof createGroupDatasetField>[],
      groupDatasetScrapyList: [] as ReturnType<
        typeof createGroupDatasetScrapy
      >[],
      groupDatasetApiList: [] as ReturnType<typeof createGroupDatasetApi>[],
    },
  });
  readonly form = form(this.formModel, p => {
    disabled(p.groupName, { when: () => this.isEditMode });
    applyEach(p.config.groupDatasetFieldList, row => {
      required(row.key);
      required(row.label);
    });
    applyEach(p.config.groupDatasetScrapyList, row => {
      required(row.name);
      required(row.label);
    });
    applyEach(p.config.groupDatasetApiList, row => {
      required(row.apiName);
      required(row.label);
    });
    required(p.groupName);
    required(p.config.byKey);
  });

  get isCreateMode() {
    return this.status() === DatasetEditMode.create;
  }

  get isEditMode() {
    return this.status() === DatasetEditMode.edit;
  }

  get groupNameControl() {
    return this.form.groupName;
  }

  get configForm() {
    return this.form.config;
  }

  get byKeyControl() {
    return this.configForm.byKey;
  }

  get fieldListControl() {
    return this.configForm.groupDatasetFieldList;
  }

  get scrapyListControl() {
    return this.configForm.groupDatasetScrapyList;
  }

  get apiListControl() {
    return this.configForm.groupDatasetApiList;
  }

  constructor() {
    effect(() => {
      const name = this.groupDatasetName();
      const groupDataset = this.groupDataset.value();
      if (name === undefined || groupDataset === undefined) return;

      if (groupDataset === null) {
        this.router.navigate(['group-dataset-list']);
        return;
      }

      untracked(() => {
        this.patchForm(groupDataset);
        this.status.set(DatasetEditMode.edit);
      });
    });
  }

  private patchForm(groupDataset: GroupDataset) {
    const config = groupDataset.config;
    this.form().reset({
      groupName: groupDataset.groupName,
      config: {
        byKey: config.byKey ?? '',
        imageSaveFolder: config.imageSaveFolder ?? '',
        type: config.type ?? GroupDatasetConfigType.scrapy,
        groupDatasetFieldList: (config.groupDatasetFieldList ?? []).map(
          createGroupDatasetField
        ),
        groupDatasetScrapyList: (config.groupDatasetScrapyList ?? []).map(
          createGroupDatasetScrapy
        ),
        groupDatasetApiList: (config.groupDatasetApiList ?? []).map(
          createGroupDatasetApi
        ),
      },
    });
  }

  onBack() {
    this.router.navigate(['group-dataset-list']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const data = this.form().value() as GroupDataset;

    this.groupDatasetService
      .existGroupDataset(data.groupName)
      .pipe(
        switchMap(exist => {
          if (this.isCreateMode && exist) {
            this.snackbarService.openI18N('msg.datasetExist');
            return EMPTY;
          }
          if (this.isEditMode && !exist) {
            this.snackbarService.openI18N('msg.datasetNotExist');
            return EMPTY;
          }
          return this.groupDatasetService.updateGroupDataset(data);
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
