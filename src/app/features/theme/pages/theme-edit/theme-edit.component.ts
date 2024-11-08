import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DEFAULT_ROW_COLOR,
  ThemeHeader,
  ThemeHeaderType,
  ThemeImageType,
} from '../../models';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  isBlank,
  isNotBlank,
  isRepeat,
  isValidWidth,
} from '../../../../shared/util/helper';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, filter, switchMap, tap, throwError } from 'rxjs';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { ThemeLabelTableComponent } from '../../components/theme-label-table/theme-label-table.component';
import { ThemeDatasetTableComponent } from '../../components/theme-dataset-table/theme-dataset-table.component';
import { ThemeTagTableComponent } from '../../components/theme-tag-table/theme-tag-table.component';
import { ThemeOtherSettingComponent } from '../../components/theme-other-setting/theme-other-setting.component';
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
    CustomTableComponent,
    ThemeLabelTableComponent,
    ThemeDatasetTableComponent,
    ThemeTagTableComponent,
    ThemeOtherSettingComponent,
  ],
  selector: 'app-theme-edit',
  templateUrl: 'theme-edit.component.html',
  styleUrls: ['theme-edit.component.scss'],
})
export class ThemeEditComponent implements OnInit {
  status: 'new' | 'edit' = 'new';
  model: ThemeHeader = {
    name: '',
    version: '',
    title: '',
    type: ThemeHeaderType.imageList,
    themeImage: {
      type: ThemeImageType.key,
      imageKey: '',
      imageUrl: '',
    },
    themeLabelList: [],
    themeDatasetList: [],
    themeCustomList: [],
    themeTagList: [],
    seq: 0,
    themeOtherSetting: {
      rowColor: DEFAULT_ROW_COLOR,
      listPageSize: 30,
      topCustomList: [],
    },
  };
  eThemeHeaderType = ThemeHeaderType;
  eThemeImageType = ThemeImageType;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private snackbarService: SnackbarService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        filter(
          params =>
            isNotBlank(params['name']) &&
            isNotBlank(params['version']) &&
            isNotBlank(params['type'])
        ),
        switchMap(params =>
          this.themeService.findTheme({
            name: params['name'],
            version: params['version'],
            type: params['type'],
          })
        )
      )
      .subscribe(res => {
        if (res === null) {
          this.router.navigate(['']);
          return;
        }
        this.status = 'edit';
        this.model = res;
      });
  }

  onBack() {
    this.router.navigate(['']);
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (!this.validationModel()) {
      return;
    }
    this.themeService
      .existTheme(this.model)
      .pipe(
        switchMap(exist => {
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
        if (back) {
          this.router.navigate(['']);
        }
        this.snackbarService.openByI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }
  //驗證資料正確
  validationModel(): boolean {
    if (isBlank(this.model.name)) {
      this.snackbarService.isBlankMessage('themeHeader.name');
      return false;
    }
    if (isBlank(this.model.version)) {
      this.snackbarService.isBlankMessage('themeHeader.version');
      return false;
    }
    if (isBlank(this.model.title)) {
      this.snackbarService.isBlankMessage('themeHeader.title');
      return false;
    }
    if (this.model.seq === null) {
      this.model.seq = 0;
    }
    this.model.name = this.model.name.trim();
    this.model.version = this.model.version.trim();
    this.model.title = this.model.title.trim();

    return (
      this.validationImage() &&
      this.validationLabel() &&
      this.validationDataset() &&
      this.validationTag()
    );
  }

  validationImage() {
    const { themeImage } = this.model;
    if (this.model.type === ThemeHeaderType.imageList) {
      if (
        themeImage.type === ThemeImageType.key &&
        isBlank(themeImage.imageKey)
      ) {
        this.snackbarService.isBlankMessage('themeImage.imageKey');
        return false;
      }
      if (
        themeImage.type === ThemeImageType.url &&
        isBlank(themeImage.imageUrl)
      ) {
        this.snackbarService.isBlankMessage('themeImage.imageUrl');
        return false;
      }
      themeImage.imageKey = themeImage.imageKey.trim();
      themeImage.imageUrl = themeImage.imageUrl.trim();
    }
    return true;
  }

  validationLabel() {
    for (let label of this.model.themeLabelList) {
      if (isBlank(label.label)) {
        this.snackbarService.isBlankMessage('themeLabel.labelName');
        return false;
      }
      if (isBlank(label.byKey)) {
        this.snackbarService.isBlankMessage('themeLabel.byKey');
        return false;
      }

      if (this.model.type === 'table') {
        if (isNotBlank(label.width) && !isValidWidth(label.width)) {
          this.snackbarService.openByI18N('msg.lengthError', {
            label: this.translateService.instant('themeLabel.width'),
          });
          return false;
        }
        if (isNotBlank(label.minWidth) && !isValidWidth(label.minWidth)) {
          this.snackbarService.openByI18N('msg.lengthError', {
            label: this.translateService.instant('themeLabel.minWidth'),
          });
          return false;
        }
        if (isNotBlank(label.maxWidth) && !isValidWidth(label.maxWidth)) {
          this.snackbarService.openByI18N('msg.lengthError', {
            label: this.translateService.instant('themeLabel.maxWidth'),
          });
          return false;
        }
      }
    }
    if (isRepeat(this.model.themeLabelList.map(x => x.byKey))) {
      this.snackbarService.openByI18N('msg.repeatColumn', {
        text: this.translateService.instant('themeLabel.byKey'),
      });
      return false;
    }
    return true;
  }

  validationDataset() {
    for (let dataset of this.model.themeDatasetList) {
      if (dataset.datasetList.length === 0) {
        this.snackbarService.openByI18N('themeDataset.datasetEmpty');
        return false;
      }
      if (isBlank(dataset.label)) {
        this.snackbarService.isBlankMessage('themeDataset.label');
        return false;
      }
    }
    if (isRepeat(this.model.themeDatasetList.map(x => x.label))) {
      this.snackbarService.openByI18N('themeDataset.labelRepeat');
      return false;
    }
    //byKey不可重複
    if (isRepeat(this.model.themeCustomList.map(x => x.byKey))) {
      this.snackbarService.openByI18N('msg.repeatColumn', {
        text: this.translateService.instant('themeCustom.byKey'),
      });
      return false;
    }
    for (let custom of this.model.themeCustomList) {
      if (isBlank(custom.label)) {
        this.snackbarService.isBlankMessage('themeCustom.labelName');
        return false;
      }
      if (isBlank(custom.byKey)) {
        this.snackbarService.isBlankMessage('themeCustom.byKey');
        return false;
      }
    }
    return true;
  }

  validationTag() {
    for (let tag of this.model.themeTagList) {
      if (isBlank(tag.tag)) {
        this.snackbarService.isBlankMessage('themeTag.tag');
        return false;
      }
    }
    if (isRepeat(this.model.themeTagList.map(x => x.tag))) {
      this.snackbarService.openByI18N('themeTag.tagRepeat');
      return false;
    }
    return true;
  }

  validationOther() {
    if (
      this.model.type === 'imageList' &&
      this.model.themeOtherSetting.listPageSize <= 0
    ) {
      this.snackbarService.openByI18N('otherSetting.listPageSizeMoreZero');
      return false;
    }
    return true;
  }
}
