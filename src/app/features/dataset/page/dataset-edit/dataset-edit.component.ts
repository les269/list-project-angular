import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DatasetService } from '../../service/dataset.service';
import { EMPTY, filter, map, startWith, switchMap } from 'rxjs';
import { isNotBlank } from '../../../../shared/util/helper';
import { CodeEditorModule } from '@acrodata/code-editor';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import {
  Dataset,
  DatasetConfigType,
  DatasetEditMode,
  DatasetField,
  DatasetFieldType,
} from '../../model';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { languages } from '@codemirror/language-data';
import { ScrapyPaginationService } from '../../../spider/services/scrapy-pagination.service';
import { ControlsOf, ToFormArray } from '../../../../core/model/generic-table';
import {
  rxResource,
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dataset-edit',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    CodeEditorModule,
    DatasetFieldTableComponent,
  ],
  templateUrl: './dataset-edit.component.html',
})
export class DatasetEditComponent {
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly datasetService = inject(DatasetService);
  readonly snackbarService = inject(SnackbarService);
  readonly selectTableService = inject(SelectTableService);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly scrapyPaginationService = inject(ScrapyPaginationService);
  readonly fb = inject(FormBuilder);
  // enum and constant
  readonly eDatasetConfigType = DatasetConfigType;
  readonly codeEditorLanguages = languages;
  // signal
  readonly status = signal(DatasetEditMode.create);
  readonly datasetName = toSignal<string | null>(
    this.route.paramMap.pipe(
      map(params => params.get('name')),
      filter(name => isNotBlank(name))
    ),
    { initialValue: undefined }
  );
  readonly dataset = rxResource({
    params: () => this.datasetName(),
    stream: ({ params }) => {
      if (params === null) {
        return EMPTY;
      }
      return this.datasetService.findDataset(params);
    },
    defaultValue: undefined,
  });
  readonly fieldList = computed(() => {
    const dataset = this.dataset.value();
    return dataset?.config.fieldList ?? [];
  });

  // form
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    config: this.fb.nonNullable.group({
      type: [DatasetConfigType.all],
      groupName: ['', [Validators.required]],
      filePath: [''],
      fileExtension: [''],
      folderPath: [''],
      filing: [false],
      filingRegular: [''],
      fieldList: this.fb.array<FormGroup<ControlsOf<DatasetField>>>([]),
      autoImageDownload: [false],
      imageByKey: [''],
      scrapyText: [''],
      scrapyPagination: [''],
    }),
  });

  get isCreateMode() {
    return this.status() === DatasetEditMode.create;
  }

  get isEditMode() {
    return this.status() === DatasetEditMode.edit;
  }

  get configForm() {
    return this.form.controls.config;
  }

  get nameControl(): FormControl<string> {
    return this.form.controls.name;
  }

  get fieldListControl(): ToFormArray<DatasetField> {
    return this.configForm.controls.fieldList;
  }

  get configType(): DatasetConfigType {
    return this.configForm.controls.type.value;
  }

  get groupNameControl(): FormControl<string> {
    return this.configForm.controls.groupName;
  }

  get filePathControl(): FormControl<string> {
    return this.configForm.controls.filePath;
  }

  get folderPathControl(): FormControl<string> {
    return this.configForm.controls.folderPath;
  }

  get filingRegularControl(): FormControl<string> {
    return this.configForm.controls.filingRegular;
  }

  get scrapyPaginationControl(): FormControl<string> {
    return this.configForm.controls.scrapyPagination;
  }

  get filingControl(): FormControl<boolean> {
    return this.configForm.controls.filing;
  }

  get autoImageDownloadControl(): FormControl<boolean> {
    return this.configForm.controls.autoImageDownload;
  }

  get imageByKeyControl(): FormControl<string> {
    return this.configForm.controls.imageByKey;
  }

  constructor() {
    this.initConditionalValidation();

    effect(() => {
      const name = this.datasetName();
      const dataset = this.dataset.value();
      if (name === undefined || dataset === undefined) {
        return;
      }

      if (dataset === null) {
        this.router.navigate(['dataset-list']);
        return;
      }

      this.patchForm(dataset);
      this.updateConditionalValidators();
      this.status.set(DatasetEditMode.edit);
      this.form.controls.name.disable({ emitEvent: false });
    });
  }

  private initConditionalValidation() {
    this.configForm.controls.type.valueChanges
      .pipe(
        startWith(this.configForm.controls.type.value),
        takeUntilDestroyed()
      )
      .subscribe(() => this.updateConditionalValidators());

    this.filingControl.valueChanges
      .pipe(startWith(this.filingControl.value), takeUntilDestroyed())
      .subscribe(() => this.updateConditionalValidators());

    this.autoImageDownloadControl.valueChanges
      .pipe(
        startWith(this.autoImageDownloadControl.value),
        takeUntilDestroyed()
      )
      .subscribe(() => this.updateConditionalValidators());
  }

  private setRequired(control: AbstractControl, required: boolean) {
    if (required) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateConditionalValidators() {
    this.setRequired(
      this.filePathControl,
      this.configType === DatasetConfigType.file
    );
    this.setRequired(
      this.folderPathControl,
      this.configType === DatasetConfigType.folder
    );
    this.setRequired(
      this.scrapyPaginationControl,
      this.configType === DatasetConfigType.pagination
    );
    this.setRequired(
      this.filingRegularControl,
      this.filingControl.value &&
        (this.configType === DatasetConfigType.file ||
          this.configType === DatasetConfigType.folder)
    );
    this.setRequired(
      this.imageByKeyControl,
      this.autoImageDownloadControl.value
    );
  }

  private patchForm(dataset: Dataset) {
    const { fieldList, ...configValues } = dataset.config;
    this.form.patchValue(
      { name: dataset.name, config: configValues },
      { emitEvent: false }
    );
  }

  onBack() {
    this.router.navigate(['dataset-list'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  update(back: boolean, type: 'save' | 'commit') {
    this.updateConditionalValidators();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue();

    this.datasetService
      .existDataset(data.name)
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
          return this.datasetService.updateDataset(data);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['dataset-list']);
        }
        this.snackbarService.openI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }

  selectGroupDataset() {
    this.groupDatasetService
      .getAllGroupDataset()
      .pipe(
        switchMap(res => this.selectTableService.selectSingleGroupDataset(res))
      )
      .subscribe(res => {
        if (res) {
          this.groupNameControl.setValue(res.groupName);
        }
      });
  }

  importCsvTxt(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.readJsonFile(file);
      input.value = '';
    }
  }

  readJsonFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.configForm.controls.scrapyText.setValue(reader.result as string);
      } catch (error) {
        console.error('Invalid JSON file', error);
      }
    };
    reader.onerror = () => {
      console.error('Error reading file');
    };
    reader.readAsText(file);
  }

  changeType() {
    if (
      this.configType !== DatasetConfigType.file &&
      this.configType !== DatasetConfigType.folder
    ) {
      this.filingControl.setValue(false);
      this.configForm.controls.filingRegular.setValue('');
    }
  }

  selectScrapyPagination() {
    this.scrapyPaginationService
      .getAll()
      .pipe(
        switchMap(res =>
          this.selectTableService.selectSingleScrapyPagination(res)
        )
      )
      .subscribe(res => {
        if (res) {
          this.scrapyPaginationControl.setValue(res.name);
        }
      });
  }
}
