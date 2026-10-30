import { CodeEditorModule } from '@acrodata/code-editor';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  min,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { languages } from '@codemirror/language-data';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { debounceTime, EMPTY, filter, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { ScrapyPagination, UpdateIntervalType } from '../../model';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-scrapy-pagination-edit',

  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'zh-tw' },
  ],
  imports: [
    FormField,
    CommonModule,
    MatIconModule,
    TranslateModule,
    MatButtonModule,
    CodeEditorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './scrapy-pagination-edit.component.html',
})
export class ScrapyPaginationEditComponent implements OnInit {
  readonly statusModel = signal<'new' | 'edit'>('new');
  readonly statusForm = form(this.statusModel);
  get status() {
    return this.statusModel();
  }
  set status(value: 'new' | 'edit') {
    this.statusModel.set(value);
  }
  readonly modelModel = signal<ScrapyPagination>({
    name: '',
    config: {
      startUrl: '',
      cookie: [],
      cssSelectList: [],
      keyRedirectUrlMap: {},
      springExpressionLangList: [],
      updateIntervalType: UpdateIntervalType.year,
      updateInterval: 0,
      lastUpdateDate: dayjs().startOf('day').toDate(),
    },
  });
  readonly modelForm = form(this.modelModel, p => {
    disabled(p.name, { when: () => this.statusModel() === 'edit' });
    disabled(p.config.lastUpdateDate);
    required(p.name);
    required(p.config.startUrl);
    min(p.config.updateInterval, 0);
  });
  get model() {
    return this.modelModel();
  }
  set model(value: ScrapyPagination) {
    this.modelModel.set(value);
  }
  readonly testHtmlModel = signal<string>('');
  readonly testHtmlForm = form(this.testHtmlModel);
  get testHtml() {
    return this.testHtmlModel();
  }
  set testHtml(value: string) {
    this.testHtmlModel.set(value);
  }
  readonly testResultModel = signal<string>('');
  readonly testResultForm = form(this.testResultModel);
  get testResult() {
    return this.testResultModel();
  }
  set testResult(value: string) {
    this.testResultModel.set(value);
  }
  languages = languages;
  eUpdateIntervalType = UpdateIntervalType;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scrapyPaginationService: ScrapyPaginationService,
    private snackbarService: SnackbarService
  ) {}
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        debounceTime(100),
        filter(params => isNotBlank(params.get('name'))),
        switchMap(params =>
          this.scrapyPaginationService.find(params.get('name')!)
        )
      )
      .subscribe(res => {
        if (res === null) {
          this.onBack();
          return;
        }
        this.model = res;
        this.status = 'edit';
      });
  }

  onBack() {
    this.router.navigate(['scrapy-pagination-list']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
    this.scrapyPaginationService
      .exist(this.model.name)
      .pipe(
        switchMap(exist => {
          if (this.status === 'new' && exist) {
            this.snackbarService.openI18N('msg.scrapyExist');
            return EMPTY;
          }
          if (this.status === 'edit' && !exist) {
            this.snackbarService.openI18N('msg.scrapyNotExist');
            return EMPTY;
          }
          return this.scrapyPaginationService.update(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.onBack();
        }
        this.snackbarService.openI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }

  validationModel() {
    if (isBlank(this.model.name)) {
      this.snackbarService.isBlankMessage('scrapy.name');
      return false;
    }
    if (isBlank(this.model.config.startUrl)) {
      this.snackbarService.isBlankMessage('scrapy.startUrl');
      return false;
    }
    if (
      !(
        Number.isInteger(this.model.config.updateInterval) &&
        this.model.config.updateInterval >= 0
      )
    ) {
      this.snackbarService.openI18N('msg.paramSizeError');
      return false;
    }

    return true;
  }

  onTestParseHtml() {
    this.scrapyPaginationService
      .testHtml({ html: this.testHtml, config: this.model.config })
      .subscribe(result => {
        this.testResult = JSON.stringify(result, undefined, 2);
      });
  }
}
