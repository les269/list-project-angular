import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  GroupDataset,
  GroupDatasetApi,
  GroupDatasetConfigType,
  GroupDatasetField,
  GroupDatasetFieldType,
  GroupDatasetScrapy,
} from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { isNotBlank } from '../../../../shared/util/helper';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { DatasetEditMode } from '../../model';
import { ControlsOf, ToFormArray } from '../../../../core/model/generic-table';
import { GroupDatasetFieldTableComponent } from '../../components/group-dataset-field-table/group-dataset-field-table.component';
import { GroupDatasetScrapyTableComponent } from '../../components/group-dataset-scrapy-table/group-dataset-scrapy-table.component';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';

@Component({
  selector: 'app-group-dataset-edit',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
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
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly snackbarService = inject(SnackbarService);
  readonly fb = inject(FormBuilder);
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
  readonly form = this.fb.nonNullable.group({
    groupName: ['', [Validators.required]],
    config: this.fb.nonNullable.group({
      byKey: ['', [Validators.required]],
      imageSaveFolder: [''],
      type: [GroupDatasetConfigType.scrapy],
      groupDatasetFieldList: this.fb.array<
        FormGroup<ControlsOf<GroupDatasetField>>
      >([]),
      groupDatasetScrapyList: this.fb.array<
        FormGroup<ControlsOf<GroupDatasetScrapy>>
      >([]),
      groupDatasetApiList: this.fb.array<
        FormGroup<ControlsOf<GroupDatasetApi>>
      >([]),
    }),
  });

  // computed for initial data display
  readonly fieldListInitData = computed(() => {
    const groupDataset = this.groupDataset.value();
    return groupDataset?.config.groupDatasetFieldList ?? [];
  });
  readonly scrapyListInitData = computed(() => {
    const groupDataset = this.groupDataset.value();
    return groupDataset?.config.groupDatasetScrapyList ?? [];
  });
  readonly apiListInitData = computed(() => {
    const groupDataset = this.groupDataset.value();
    return groupDataset?.config.groupDatasetApiList ?? [];
  });

  get isCreateMode() {
    return this.status() === DatasetEditMode.create;
  }

  get isEditMode() {
    return this.status() === DatasetEditMode.edit;
  }

  get groupNameControl(): FormControl<string> {
    return this.form.controls.groupName;
  }

  get configForm() {
    return this.form.controls.config;
  }

  get byKeyControl(): FormControl<string> {
    return this.configForm.controls.byKey;
  }

  get fieldListControl(): ToFormArray<GroupDatasetField> {
    return this.configForm.controls.groupDatasetFieldList;
  }

  get scrapyListControl(): ToFormArray<GroupDatasetScrapy> {
    return this.configForm.controls.groupDatasetScrapyList;
  }

  get apiListControl(): ToFormArray<GroupDatasetApi> {
    return this.configForm.controls.groupDatasetApiList;
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

      this.patchForm(groupDataset);
      this.status.set(DatasetEditMode.edit);
      this.form.controls.groupName.disable({ emitEvent: false });
    });
  }

  private patchForm(groupDataset: GroupDataset) {
    const {
      groupDatasetFieldList,
      groupDatasetScrapyList,
      groupDatasetApiList,
      ...configValues
    } = groupDataset.config;
    this.form.patchValue(
      { groupName: groupDataset.groupName, config: configValues },
      { emitEvent: false }
    );
  }

  onBack() {
    this.router.navigate(['group-dataset-list']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue() as GroupDataset;

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
