import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyService } from '../../services/scrapy.service';
import { ScrapyPagination } from '../../model';
import { CookieTableComponent } from '../../components/cookie-table/cookie-table.component';
import { CssSelectTableComponent } from '../../components/css-select-table/css-select-table.component';
import { MatButtonModule } from '@angular/material/button';
import { SpringExpressionLangTableComponent } from '../../components/spring-expression-lang-table/spring-expression-lang-table.component';
import { languages } from '@codemirror/language-data';
import { CodeEditorModule } from '@acrodata/code-editor';

@Component({
  selector: 'app-scrapy-pagination-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    TranslateModule,
    CookieTableComponent,
    CssSelectTableComponent,
    MatButtonModule,
    SpringExpressionLangTableComponent,
    CodeEditorModule,
  ],
  templateUrl: './scrapy-pagination-edit.component.html',
})
export class ScrapyPaginationEditComponent {
  status: 'new' | 'edit' = 'new';
  model: ScrapyPagination = {
    name: '',
    config: {
      startUrl: '',
      cookie: [],
      cssSelectList: [],
      redirectUrlList: [],
      redirectParamsList: [],
      springExpressionLangList: [],
    },
  };
  testHtml: string = '';
  testResult: string = '';
  languages = languages;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scrapyService: ScrapyService,
    private translateService: TranslateService,
    private snackbarService: SnackbarService
  ) {}

  onBack() {
    this.router.navigate(['scrapy-pagination-list']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
  }

  validationModel() {
    return true;
  }

  onTestParseHtml() {}
}
