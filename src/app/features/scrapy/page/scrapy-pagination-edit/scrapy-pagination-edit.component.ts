import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyService } from '../../services/scrapy.service';
import { ScrapyPagination, UpdateIntervalType } from '../../model';
import { CookieTableComponent } from '../../components/cookie-table/cookie-table.component';
import { CssSelectTableComponent } from '../../components/css-select-table/css-select-table.component';
import { MatButtonModule } from '@angular/material/button';
import { SpringExpressionLangTableComponent } from '../../components/spring-expression-lang-table/spring-expression-lang-table.component';
import { languages } from '@codemirror/language-data';
import { CodeEditorModule } from '@acrodata/code-editor';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import moment from 'moment';
import { isBlank, isNotBlank, isNumber } from '../../../../shared/util/helper';
import { debounceTime, EMPTY, filter, switchMap } from 'rxjs';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-scrapy-pagination-edit',
  standalone: true,
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'zh-tw' },
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    TranslateModule,
    CookieTableComponent,
    CssSelectTableComponent,
    MatButtonModule,
    CodeEditorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './scrapy-pagination-edit.component.html',
})
export class ScrapyPaginationEditComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: ScrapyPagination = {
    name: '',
    config: {
      startUrl: '',
      cookie: [],
      cssSelectList: [],
      keyRedirectUrlMap: {},
      springExpressionLangList: [],
      updateIntervalType: UpdateIntervalType.year,
      updateInterval: 0,
      lastUpdateDate: moment().startOf('day').toDate(),
    },
  };
  testHtml: string = '';
  testResult: string = '';
  languages = languages;
  eUpdateIntervalType = UpdateIntervalType;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scrapyPaginationService: ScrapyPaginationService,
    private translateService: TranslateService,
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
            this.snackbarService.openByI18N('msg.scrapyExist');
            return EMPTY;
          }
          if (this.status === 'edit' && !exist) {
            this.snackbarService.openByI18N('msg.scrapyNotExist');
            return EMPTY;
          }
          return this.scrapyPaginationService.update(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.onBack();
        }
        this.snackbarService.openByI18N(
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
      this.snackbarService.openByI18N('msg.paramSizeError');
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
