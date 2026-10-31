import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import { createDatasetField } from '../../util/dataset-field';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { hasFieldError } from '../../../../shared/util/signal-form';
import { ScrapyPaginationService } from '../../../spider/services/scrapy-pagination.service';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { Dataset, DatasetConfigType, DatasetEditMode } from '../../model';
import { DatasetService } from '../../service/dataset.service';
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-dataset-edit',

  imports: [
    MatTableModule,
    FormField,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    SignalCodeEditorComponent,
    DatasetFieldTableComponent,
  ],
  templateUrl: './dataset-edit.component.html',
})
export class DatasetEditComponent {
  readonly hasError = hasFieldError;
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly datasetService = inject(DatasetService);
  readonly snackbarService = inject(SnackbarService);
  readonly selectTableService = inject(SelectTableService);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly scrapyPaginationService = inject(ScrapyPaginationService);
  // enum and constant
  readonly eDatasetConfigType = DatasetConfigType;
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

  // form
  readonly formModel = signal({
    name: '',
    config: {
      type: DatasetConfigType.all,
      groupName: '',
      filePath: '',
      fileExtension: '',
      folderPath: '',
      filing: false,
      filingRegular: '',
      fieldList: [] as ReturnType<typeof createDatasetField>[],
      autoImageDownload: false,
      imageByKey: '',
      scrapyText: '',
      scrapyPagination: '',
    },
  });
  private readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.name, { when: () => this.isEditMode });
    applyEach(p.config.fieldList, row => {
      required(row.key);
      required(row.label);
    });
    required(p.config.filePath, {
      when: ({ valueOf }) => valueOf(p.config.type) === DatasetConfigType.file,
    });
    required(p.config.folderPath, {
      when: ({ valueOf }) =>
        valueOf(p.config.type) === DatasetConfigType.folder,
    });
    required(p.config.scrapyPagination, {
      when: ({ valueOf }) =>
        valueOf(p.config.type) === DatasetConfigType.pagination,
    });
    required(p.config.filingRegular, {
      when: ({ valueOf }) =>
        valueOf(p.config.filing) &&
        [DatasetConfigType.file, DatasetConfigType.folder].includes(
          valueOf(p.config.type)
        ),
    });
    required(p.config.imageByKey, {
      when: ({ valueOf }) => valueOf(p.config.autoImageDownload),
    });
    required(p.name);
    required(p.config.groupName);
  });

  get isCreateMode() {
    return this.status() === DatasetEditMode.create;
  }

  get isEditMode() {
    return this.status() === DatasetEditMode.edit;
  }

  get configForm() {
    return this.form.config;
  }

  get nameControl() {
    return this.form.name;
  }

  get fieldListControl() {
    return this.configForm.fieldList;
  }

  get configType(): DatasetConfigType {
    return this.configForm.type().value();
  }

  get groupNameControl() {
    return this.configForm.groupName;
  }

  get filePathControl() {
    return this.configForm.filePath;
  }

  get folderPathControl() {
    return this.configForm.folderPath;
  }

  get filingRegularControl() {
    return this.configForm.filingRegular;
  }

  get scrapyPaginationControl() {
    return this.configForm.scrapyPagination;
  }

  get filingControl() {
    return this.configForm.filing;
  }

  get autoImageDownloadControl() {
    return this.configForm.autoImageDownload;
  }

  get imageByKeyControl() {
    return this.configForm.imageByKey;
  }

  constructor() {
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

      untracked(() => {
        this.patchForm(dataset);
        this.status.set(DatasetEditMode.edit);
      });
    });
  }

  private patchForm(dataset: Dataset) {
    this.form().reset({
      name: dataset.name,
      config: {
        ...structuredClone(this.initialFormValue.config),
        ...structuredClone(dataset.config),
        fieldList: (dataset.config.fieldList ?? []).map(createDatasetField),
      },
    });
  }

  onBack() {
    this.router.navigate(['dataset-list'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const data = this.form().value();

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
          this.groupNameControl().value.set(res.groupName);
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
        this.configForm.scrapyText().value.set(reader.result as string);
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
      this.filingControl().value.set(false);
      this.configForm.filingRegular().value.set('');
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
          this.scrapyPaginationControl().value.set(res.name);
        }
      });
  }
}
