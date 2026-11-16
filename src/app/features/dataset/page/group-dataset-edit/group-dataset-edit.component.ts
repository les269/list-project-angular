import {
  createGroupDatasetField,
  createGroupDatasetApi,
  createGroupDatasetScrapy,
} from '../../util/group-dataset-rows';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { applyEach, disabled, form, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { EditMode } from '../../../../core/model/global.model';
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';
import { GroupDatasetFieldTableComponent } from '../../components/group-dataset-field-table/group-dataset-field-table.component';
import { GroupDatasetScrapyTableComponent } from '../../components/group-dataset-scrapy-table/group-dataset-scrapy-table.component';
import {
  GroupDataset,
  GroupDatasetConfigType,
  GroupDatasetFieldType,
} from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-group-dataset-edit',

  imports: [
    TranslatePipe,
    SignalFieldComponent,
    GroupDatasetFieldTableComponent,
    GroupDatasetScrapyTableComponent,
    GroupDatasetApiTableComponent,
  ],
  templateUrl: './group-dataset-edit.component.html',
  styleUrl: './group-dataset-edit.component.scss',
})
export class GroupDatasetEditComponent {
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly snackbarService = inject(SnackbarService);
  // enum
  readonly eGroupDatasetFieldType = GroupDatasetFieldType;
  readonly eGroupDatasetConfigType = GroupDatasetConfigType;
  readonly fieldType = SignalFieldType;
  readonly configTypeOptions = Object.values(GroupDatasetConfigType)
    .sort()
    .map(value => ({ value, label: `dataset.${value}` }));
  // signals
  readonly status = signal<EditMode>(EditMode.CREATE);

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
      required(row.apiId);
      required(row.label);
    });
    required(p.groupName, { message: 'msg.required' });
    required(p.config.byKey, { message: 'msg.required' });
  });

  get isCreateMode() {
    return this.status() === EditMode.CREATE;
  }

  get isEditMode() {
    return this.status() === EditMode.EDIT;
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
        this.status.set(EditMode.EDIT);
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
