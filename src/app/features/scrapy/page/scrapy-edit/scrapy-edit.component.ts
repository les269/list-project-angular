import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrapyConfig, ScrapyData, ScrapyPageType } from '../../model';
import { ScrapyService } from '../../services/scrapy.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { languages } from '@codemirror/language-data';
import { CodeEditor } from '@acrodata/code-editor';
import { Router, ActivatedRoute } from '@angular/router';
import { filter, switchMap, EMPTY, debounceTime } from 'rxjs';
import { isBlank, isNotBlank, isNotJson } from '../../../../shared/util/helper';
import { MatTabsModule } from '@angular/material/tabs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CookieTableComponent } from '../../components/cookie-table/cookie-table.component';
import { CssSelectTableComponent } from '../../components/css-select-table/css-select-table.component';

@Component({
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    CodeEditor,
    MatTabsModule,
    MatTooltipModule,
    MatCheckboxModule,
    CookieTableComponent,
    CssSelectTableComponent,
  ],
  selector: 'app-scrapy-edit',
  templateUrl: 'scrapy-edit.component.html',
})
export class ScrapyEditComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: ScrapyConfig = {
    name: '',
    data: [],
    testJson: '',
    testUrl: '',
    paramSize: 1,
  };

  eScrapyPageType = ScrapyPageType;
  languages = languages;
  selected = -1;
  testResult = '';
  defaultJS = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scrapyService: ScrapyService,
    private translateService: TranslateService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    this.defaultJS = this.translateService.instant('scrapy.defaultJS');
    this.route.paramMap
      .pipe(
        debounceTime(100),
        filter(params => isNotBlank(params.get('name'))),
        switchMap(params => this.scrapyService.findConfig(params.get('name')!))
      )
      .subscribe(res => {
        if (res === null) {
          this.router.navigate(['scrapy-list']);
          return;
        }
        this.model = res;
        this.status = 'edit';
      });
  }

  onAddData() {
    this.model.data.push({
      url: '',
      cookie: [],
      scrapyPageType: ScrapyPageType.scrapyData,
      cssSelectList: [],
      script: this.defaultJS,
      name: '',
      html: '',
      replaceRegular: '',
      replaceRegularTo: '',
    });
  }

  onDeleteData(i: number) {
    this.model.data.splice(i, 1);
  }

  onBack() {
    this.router.navigate(['scrapy-list']);
  }
  //執行測試當前html的返回值是否正常
  onTestParseHtml(data: ScrapyData) {
    this.scrapyService
      .testScrapyHtml({ scrapyData: data })
      .subscribe(result => {
        this.testResult = JSON.stringify(result, undefined, 2);
      });
  }

  onTestJson() {
    if (
      isNotJson(this.model.testJson) ||
      !Array.isArray(JSON.parse(this.model.testJson))
    ) {
      this.snackbarService.openByI18N('msg.testJsonError');
      return;
    }
    this.testResult = '';
    this.scrapyService
      .testScrapyJson({
        scrapyDataList: this.model.data,
        json: JSON.parse(this.model.testJson),
      })
      .subscribe(result => {
        this.testResult = JSON.stringify(result, undefined, 2);
      });
  }

  onTestUrl() {
    this.scrapyService
      .testScrapyUrl({
        scrapyDataList: this.model.data,
        url: this.model.testUrl,
      })
      .subscribe(result => {
        this.testResult = JSON.stringify(result, undefined, 2);
      });
  }
  //驗證保存資料
  validationModel(): boolean {
    if (isBlank(this.model.name)) {
      this.snackbarService.isBlankMessage('scrapy.name');
      return false;
    }
    if (
      !(Number.isInteger(this.model.paramSize) && this.model.paramSize >= 1)
    ) {
      this.snackbarService.openByI18N('msg.paramSizeError');
      return false;
    }
    return true;
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
    this.scrapyService
      .existConfig(this.model.name)
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
          return this.scrapyService.updateConfig(this.model);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['scrapy-list']);
        }
        this.snackbarService.openByI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }

  moveTab(list: ScrapyData[], index: number, type: 'left' | 'right') {
    const source = list[index];
    const target = list.splice(index + (type === 'left' ? -1 : 1), 1, source);
    list.splice(index, 1, target[0]);
    this.selected = index + (type === 'left' ? -1 : 1);
  }
}
