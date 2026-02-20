import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  debounceTime,
  filter,
  map,
  pipe,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { updateTitle } from '../../../shared/state/layout.actions';
import {
  groupBy,
  isBlank,
  isNotBlank,
  isNumber,
  replaceValue,
  sortSeq,
} from '../../../shared/util/helper';
import {
  ThemeHeader,
  ThemeImage,
  ThemeOtherSetting,
  ThemeLabel,
  ThemeDataset,
  ThemeTag,
  ThemeCustom,
  ThemeHeaderType,
  SortType,
  ThemeTopCustomValueResponse,
  ThemeTopCustom,
  ShareTag,
  ShareTagValue,
  QueryAction,
} from '../models';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { Store } from '@ngrx/store';
import { DatasetService } from '../../dataset/service/dataset.service';
import { DatasetData } from '../../dataset/model';
import { EditGroupDatasetDataComponent } from '../../dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import { MatDialog } from '@angular/material/dialog';
import { GroupDatasetService } from '../../dataset/service/group-dataset.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { api } from '../../../../environments/environment';
import { FileService } from '../../../core/services/file.service';
import { ShareTagService } from '../services/share-tag.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ListBaseViewStore } from './list-base-view.store';

@Component({
  standalone: true,
  imports: [],
  selector: 'app-list-base-view',
  template: ``,
})
export class ListBaseViewComponent implements OnInit, OnDestroy {
  // routeParamSub: Subscription | undefined;
  // routeEventsSub: Subscription | undefined;

  constructor() {}

  ngOnInit() {
    // this.routeParamSub = this.route.paramMap
    //   .pipe(debounceTime(100))
    //   .subscribe(params => {
    //     this.themeService.getByHeaderId(this.headerId()).subscribe(res => {
    //       if (!res) {
    //         this.router.navigate(['']);
    //         return;
    //       }
    //       this.themeHeader.set(res);
    //       //設定標題
    //       document.title = this.themeHeader().title;
    //       this.store.dispatch(updateTitle({ title: this.themeHeader().title }));
    //       //呼叫取得清單資料
    //       this.getDataSoure();
    //       this.getTopCustomValueMap();
    //       this.getShareTagList();
    //     });
    //   });
  }

  ngOnDestroy() {
    // if (this.routeParamSub) {
    //   this.routeParamSub.unsubscribe();
    // }
    // if (this.routeEventsSub) {
    //   this.routeEventsSub.unsubscribe();
    // }
  }

  // getDataSoure() {
  //取得dataset的name並去除重複

  // const tagIds = this.themeTagList().map(t => t.shareTagId);
  // this.shareTagService.getShareTagValues(tagIds).subscribe(x => {
  //   this.shareTagValueList.set(x);
  // });

  // const uniqueDatasetList = Array.from(
  //   new Set(this.themeDatasetList().flatMap(x => x.datasetList))
  // );
  // this.datasetService
  //   .findDatasetDataByNameList(uniqueDatasetList)
  //   .subscribe(values => {
  //     this.datasetDataList.set(values);
  //     this.initData();
  //   });
  // }

  // getTopCustomValueMap() {
  //   this.themeService.findTopCustomValue(this.headerId()).subscribe(x => {
  //     this.topCustomValueMap.set(x);
  //   });
  // }

  // changeDataset() {
  //   this.changeDatasetBefore();
  //   this.changeDatasetAfter();
  // }

  // openEditData(data: any) {
  //   this.store.datasetService
  //     .findDataset(data[this.datasetNameStr])
  //     .pipe(
  //       switchMap(x =>
  //         this.groupdatasetService.getGroupDataset(x.config.groupName)
  //       )
  //     )
  //     .subscribe(x => {
  //       this.matDialog.open(EditGroupDatasetDataComponent, {
  //         data: {
  //           groupName: x.groupName,
  //           primeValue: data[x.config.byKey],
  //         },
  //         minWidth: '60vw',
  //         autoFocus: false,
  //       });
  //     });
  // }

  // onRefresh() {
  //   this.datasetService
  //     .refreshDataByNameList(this.useDataset().datasetList)
  //     .subscribe(x => {
  //       this.getDataSoure();
  //       this.refreshDate.set(new Date());
  //       this.snackbarService.openI18N('msg.refreshSuccess');
  //     });
  // }

  // getTagValueLength(shareTagId: string) {
  //   const valueList = this.shareTagValueMap()[shareTagId];
  //   if (valueList && this.useData()) {
  //     const nameList = this.useData().map((x: any) => x[this.defaultKey()]);
  //     return valueList.filter(x => nameList.includes(x)).length;
  //   }
  //   return 0;
  // }

  // filterAutoCompleteList(): string[] {
  //   let lastElement = '';
  //   if (typeof this.searchValue() === 'string') {
  //     lastElement = (this.searchValue() + '').split(',').slice(-1)[0]!;
  //   } else if (this.searchValue().length > 0) {
  //     lastElement = this.searchValue().slice(-1)[0];
  //   }
  //   lastElement = lastElement.toLocaleLowerCase();
  //   return this.autoCompleteList().filter(x =>
  //     x.toLowerCase().includes(lastElement)
  //   );
  // }

  // selectMultipleValue() {
  //   this.selectTableService
  //     .selectMultipleValue(this.autoCompleteList(), this.searchValue())
  //     .subscribe(res => {
  //       this.searchValue.set(res.map(x => x.value).join(','));
  //       this.searchChange();
  //     });
  // }

  // getFileExist() {
  //   const { checkFileExist } = this.themeOtherSetting();
  //   if (isNotBlank(checkFileExist)) {
  //     const req = this.useData().map((x: any) => ({
  //       path: replaceValue(checkFileExist, x),
  //       name: x[this.defaultKey()],
  //     }));
  //     this.fileService.fileExist(req).subscribe(x => {
  //       this.fileExist = x;
  //     });
  //   }
  // }

  // getShareTagList() {
  //   this.shareTagService.getAllTag().subscribe(tags => {
  //     this.allShareTag.set(tags);
  //   });
  // }

  initData() {
    // This method is intentionally left blank for child classes to override.
  }
  changeDatasetBefore() {
    // This method is intentionally left blank for child classes to override.
  }
  changeDatasetAfter() {
    // This method is intentionally left blank for child classes to override.
  }
  onSearch() {
    // This method is intentionally left blank for child classes to override.
  }
  changeTag() {
    // This method is intentionally left blank for child classes to override.
  }
  changeUrl() {
    // This method is intentionally left blank for child classes to override.
  }

  searchChange(text?: string) {
    // This method is intentionally left blank for child classes to override.
  }
}
