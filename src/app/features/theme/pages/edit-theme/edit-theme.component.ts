import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ThemeCustom,
  ThemeCustomType,
  ThemeDB,
  ThemeDBType,
  ThemeHeader,
  ThemeHeaderType,
  ThemeImageType,
  ThemeLabel,
  ThemeLabelType,
  ThemeRequest,
} from '../../models';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, filter, switchMap, tap, throwError } from 'rxjs';
import { updateTitle } from '../../../../shared/state/layout.actions';
import { Store } from '@ngrx/store';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslateModule,
  ],
  selector: 'app-edit-theme',
  templateUrl: 'edit-theme.component.html',
  styleUrls: ['edit-theme.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class CreateThemeComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: ThemeRequest = {
    themeHeader: {
      name: '',
      version: '',
      title: '',
      type: ThemeHeaderType.imageList,
    },
    themeImage: {
      type: ThemeImageType.key,
      imageKey: '',
      imageUrl: '',
    },
    themeLabelList: [],
    themeDBList: [],
    themeCustom: [],
  };
  eThemeHeaderType = ThemeHeaderType;
  eThemeImageType = ThemeImageType;
  // 標籤設定
  labelDataSource = new MatTableDataSource<ThemeLabel>(
    this.model.themeLabelList
  );
  expandedLabel?: ThemeLabel | null;
  labelDisplayedColumns: string[] = ['seq', 'byKey', 'label', 'type', 'expand'];
  eThemeLabelType = ThemeLabelType;
  // 資料來源設定
  dbSource = new MatTableDataSource<ThemeDB>([]);
  dbDisplayedColumns = ['type', 'source', 'label', 'group', 'other'];
  eThemeDBType = ThemeDBType;
  //自定義功能
  customSource = new MatTableDataSource<ThemeCustom>([]);
  customDisplayedColumns = [];
  eThemeCustomType = ThemeCustomType;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private snackbarService: SnackbarService,
    private translateService: TranslateService,
    private store: Store
  ) {}

  ngOnInit() {
    this.translateService
      .get('title.editTheme')
      .subscribe((title) => this.store.dispatch(updateTitle({ title })));
    this.route.queryParams
      .pipe(
        tap((x) => console.log(x)),
        filter(
          (params) =>
            isNotBlank(params['name']) &&
            isNotBlank(params['version']) &&
            isNotBlank(params['type'])
        ),
        switchMap((params) => this.themeService.findTheme(params))
      )
      .subscribe((res) => {
        if (res.themeHeader === null) {
          this.router.navigate(['']);
          return;
        }
        this.status = 'edit';
        this.model.themeHeader = res.themeHeader;
        this.model.themeImage = res.themeImage;
        this.model.themeLabelList = res.themeLabelList;
        this.model.themeDBList = res.themeDBList;
        this.model.themeCustom = res.themeCustom;
      });
  }

  onBack() {
    this.router.navigate(['']);
  }

  update() {
    if (!this.validationModel()) {
      return;
    }
    this.themeService
      .existTheme(this.model.themeHeader)
      .pipe(
        switchMap((exist) => {
          if (this.status === 'new' && exist) {
            this.snackbarService.openByI18N('msg.themeExist');
            return EMPTY;
          }
          if (this.status === 'edit' && !exist) {
            this.snackbarService.openByI18N('msg.themeNotExist');
            return EMPTY;
          }
          return this.themeService.updateTheme(this.model);
        })
      )
      .subscribe(() => {
        this.router.navigate(['']);
        this.snackbarService.openByI18N('msg.createSuccess');
      });
  }

  validationModel(): boolean {
    if (isBlank(this.model.themeHeader.name)) {
      this.snackbarService.isBlankMessage('themeHeader.name');
      return false;
    }
    if (isBlank(this.model.themeHeader.version)) {
      this.snackbarService.isBlankMessage('themeHeader.version');
      return false;
    }
    if (isBlank(this.model.themeHeader.title)) {
      this.snackbarService.isBlankMessage('themeHeader.title');
      return false;
    }
    this.model.themeHeader.name = this.model.themeHeader.name.trim();
    this.model.themeHeader.version = this.model.themeHeader.version.trim();
    this.model.themeHeader.title = this.model.themeHeader.title.trim();
    if (this.model.themeHeader.type === ThemeHeaderType.imageList) {
      if (
        this.model.themeImage.type === ThemeImageType.key &&
        isBlank(this.model.themeImage.imageKey)
      ) {
        this.snackbarService.isBlankMessage('themeImage.imageKey');
        return false;
      }
      if (
        this.model.themeImage.type === ThemeImageType.url &&
        isBlank(this.model.themeImage.imageUrl)
      ) {
        this.snackbarService.isBlankMessage('themeImage.imageUrl');
        return false;
      }
      this.model.themeImage.imageKey = this.model.themeImage.imageKey.trim();
      this.model.themeImage.imageUrl = this.model.themeImage.imageUrl.trim();
    }
    for (let label of this.model.themeLabelList) {
      if (isBlank(label.label)) {
        this.snackbarService.isBlankMessage('themeLabel.labelName');
        return false;
      }
      if (isBlank(label.byKey)) {
        this.snackbarService.isBlankMessage('themeLabel.byKey');
        return false;
      }
    }
    for (let db of this.model.themeDBList) {
      if (isBlank(db.source)) {
        this.snackbarService.isBlankMessage('themeDB.source');
        return false;
      }
      if (isBlank(db.label)) {
        this.snackbarService.isBlankMessage('themeDB.label');
        return false;
      }
    }
    return true;
  }

  resetTheme() {
    this.model.themeHeader = {
      name: '',
      version: '',
      title: '',
      type: ThemeHeaderType.imageList,
    };
  }

  addLabel() {
    let element: ThemeLabel = {
      seq: this.labelDataSource.data.length + 1,
      byKey: '',
      label: '',
      type: ThemeLabelType.string,
      splitBy: '',
      useSpace: '，',
      isSearch: false,
      isCopy: false,
      isVisible: false,
      isSort: false,
    };
    this.model.themeLabelList = [...this.model.themeLabelList, element];
    this.expandedLabel = element;
  }

  onSelectLabelType(element: any) {
    console.log(element);
  }

  onLabelTypeUpDown(index: number, type: 'up' | 'down') {
    let data: ThemeLabel[] = JSON.parse(
      JSON.stringify(this.model.themeLabelList)
    );
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.model.themeLabelList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
  }
  onDeletLabelData(index: number) {
    this.model.themeLabelList = this.model.themeLabelList
      .filter((x, i) => i !== index)
      .map((x, i) => {
        x.seq = i + 1;
        return x;
      });
  }
  onAddDB() {
    let element: ThemeDB = {
      type: ThemeDBType.json,
      source: '',
      label: '',
      group: '',
    };
    this.model.themeDBList = [...this.model.themeDBList, element];
  }
  onDeletDB(index: number) {
    this.model.themeDBList = this.model.themeDBList.filter(
      (x, i) => i !== index
    );
  }
}
