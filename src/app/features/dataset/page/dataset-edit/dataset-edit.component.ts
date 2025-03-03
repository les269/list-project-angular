import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DatasetService } from '../../service/dataset.service';
import { debounceTime, EMPTY, filter, switchMap } from 'rxjs';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { CodeEditor, CodeEditorModule } from '@acrodata/code-editor';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Dataset, DatasetConfigType, GroupDataset } from '../../model';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { languages } from '@codemirror/language-data';
import { ScrapyPaginationService } from '../../../scrapy/services/scrapy-pagination.service';
import { ScrapyPagination } from '../../../scrapy/model';

@Component({
  selector: 'app-dataset-edit',
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
    MatChipsModule,
    CodeEditorModule,
  ],
  templateUrl: './dataset-edit.component.html',
})
export class DatasetEditComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: Dataset = {
    name: '',
    config: {
      type: DatasetConfigType.all,
      groupName: '',
      filePath: '',
      fileExtension: '',
      folderPath: '',
      filing: false,
      filingRegular: '',
      fieldList: [],
      autoImageDownload: false,
      imageByKey: '',
      scrapyText: '',
      scrapyPagination: '',
    },
  };
  eDatasetConfigType = DatasetConfigType;
  groupDatasetList: GroupDataset[] = [];
  scrapyPaginationList: ScrapyPagination[] = [];
  languages = languages;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datasetService: DatasetService,
    private translateService: TranslateService,
    private snackbarService: SnackbarService,
    private selectTableService: SelectTableService,
    private groupDatasetService: GroupDatasetService,
    private scrapyPaginationService: ScrapyPaginationService
  ) {}

  ngOnInit() {
    this.groupDatasetService.getAllGroupDataset().subscribe(res => {
      if (res) {
        this.groupDatasetList = res;
      }
    });
    this.scrapyPaginationService.getAll().subscribe(res => {
      if (res) {
        this.scrapyPaginationList = res;
      }
    });
    this.route.paramMap
      .pipe(
        debounceTime(100),
        filter(params => isNotBlank(params.get('name'))),
        switchMap(params =>
          this.datasetService.findDataset(params.get('name')!)
        )
      )
      .subscribe(res => {
        if (res === null) {
          this.router.navigate(['dataset-list']);
          return;
        }
        this.model = res;
        this.status = 'edit';
      });
  }

  onBack() {
    this.router.navigate(['dataset-list']);
  }

  //驗證保存資料
  validationModel(): boolean {
    if (isBlank(this.model.name)) {
      this.snackbarService.isBlankMessage('dataset.name');
      return false;
    }
    if (isBlank(this.model.config.groupName)) {
      this.snackbarService.isBlankMessage('dataset.groupName');
      return false;
    }
    if (
      this.model.config.type === 'file' &&
      isBlank(this.model.config.filePath)
    ) {
      this.snackbarService.isBlankMessage('dataset.filePath');
      return false;
    }
    if (
      this.model.config.type === 'folder' &&
      isBlank(this.model.config.folderPath)
    ) {
      this.snackbarService.isBlankMessage('dataset.folderPath');
      return false;
    }
    if (
      this.model.config.type === 'pagination' &&
      isBlank(this.model.config.scrapyPagination)
    ) {
      this.snackbarService.isBlankMessage('dataset.pagination');
      return false;
    }
    if (this.model.config.filing && isBlank(this.model.config.filingRegular)) {
      this.snackbarService.isBlankMessage('dataset.filingRegular');
      return false;
    }
    if (this.model.config.autoImageDownload) {
      if (isBlank(this.model.config.imageByKey)) {
        this.snackbarService.isBlankMessage('dataset.imageByKey');
        return false;
      }
    }
    for (const field of this.model.config.fieldList) {
      if (isBlank(field.key)) {
        this.snackbarService.isBlankMessage('dataset.fieldKey');
        return false;
      }
      if (isBlank(field.label)) {
        this.snackbarService.isBlankMessage('dataset.fieldLabel');
        return false;
      }
    }

    return true;
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
    this.datasetService
      .existDataset(this.model.name)
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
          return this.datasetService.updateDataset(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['dataset-list']);
        }
        this.snackbarService.openByI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }

  selectGroupDataset() {
    this.selectTableService
      .selectSingleGroupDataset(this.groupDatasetList)
      .subscribe(res => {
        if (res) {
          this.model.config.groupName = res.groupName;
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
        this.model.config.scrapyText = reader.result as string;
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
      this.model.config.type !== DatasetConfigType.file &&
      this.model.config.type !== DatasetConfigType.folder
    ) {
      this.model.config.filing = false;
      this.model.config.filingRegular = '';
    }
  }

  selectScrapyPagination() {
    this.selectTableService
      .selectSingleScrapyPagination(this.scrapyPaginationList)
      .subscribe(res => {
        if (res) {
          this.model.config.scrapyPagination = res.name;
        }
      });
  }
}
