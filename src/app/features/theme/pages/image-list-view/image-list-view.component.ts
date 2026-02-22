import {
  Component,
  effect,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  isBlank,
  isNotBlank,
  replaceValue,
} from '../../../../shared/util/helper';
import {
  QueryActionType,
  ShareTagValue,
  SortType,
  ThemeLabel,
} from '../../models';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListItemValueComponent } from '../../components/list-item-value/list-item-value.component';
import { CustomButtonsComponent } from '../../components/custom-buttons/custom-buttons.component';
import { TopCustomButtonsComponent } from '../../components/top-custom-buttons/top-custom-buttons.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FixedImageComponent } from '../../../../core/components/fixed-image/fixed-image.component';
import { ItemTagButtonsComponent } from '../../components/item-tag-buttons/item-tag-buttons.component';
import { ImgContentComponent } from '../../components/img-content/img-content.component';
import { ListBaseViewStore } from '../../components/list-base-view.store';

@Component({
  standalone: true,
  imports: [
    MatIconModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollTopComponent,
    MatButtonModule,
    MatTooltipModule,
    ListItemValueComponent,
    CustomButtonsComponent,
    TopCustomButtonsComponent,
    MatAutocompleteModule,
    NgTemplateOutlet,
    FixedImageComponent,
    ItemTagButtonsComponent,
    ImgContentComponent,
  ],
  providers: [ListBaseViewStore],
  selector: 'app-image-list-view',
  templateUrl: 'image-list-view.component.html',
  styleUrl: 'image-list-view.component.scss',
})
export class ImageListViewComponent {
  readonly store = inject(ListBaseViewStore);

  replaceImageUrl = replaceValue;
  ctrlPressed = signal<boolean>(false);

  fixedImage = viewChild<FixedImageComponent>('fixedImage');

  constructor() {
    effect(() => {
      this.store.queryParamMap();
      setTimeout(() => this.toTop());
    });
    effect(() => {
      if (isBlank(this.store.headerId())) {
        this.store.router.navigate(['']);
      }
    });
  }
  toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getImageUrl(data: any) {
    const themeImage = this.store.themeImage();
    if (themeImage === undefined) {
      return 'assets/img/img-not-found.jpg';
    }
    let url = '';
    switch (themeImage.type) {
      case 'key':
        url =
          this.store.webApi + '/proxy-image?url=' + data[themeImage.imageKey];
        break;
      case 'url':
        url =
          this.store.webApi +
          '/proxy-image?url=' +
          this.replaceImageUrl(themeImage.imageUrl, data, true);
        break;
    }
    return url;
  }

  checkValueVisible(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (value instanceof Array) {
      return value.length > 0;
    }
    if (typeof value === 'number') {
      return true;
    }
    if (typeof value === 'string') {
      return isNotBlank(value);
    }

    return true;
  }
  checkVisibleByDataset(themeLabel: ThemeLabel): boolean {
    if (themeLabel.visibleDatasetNameList?.length > 0) {
      const label = this.store.useDataset().label;
      return themeLabel.visibleDatasetNameList.includes(label);
    }
    return true;
  }

  tagValueUpdate(event: ShareTagValue) {
    const list = this.store.shareTagValueMap()[event.shareTagId];
    const index = list.indexOf(event.value);
    if (index > -1) {
      this.store.shareTagService.deleteTagValue(event).subscribe(() => {
        this.store.shareTagValueList.reload();
      });
    } else {
      this.store.shareTagService.addTagValue(event).subscribe(() => {
        this.store.shareTagValueList.reload();
      });
    }
  }

  quickRefresh(element: any) {
    const datasetName = element[this.store.DATASET_NAME_KEY];
    const byKey = this.store.defaultKey();
    const primeKey = element[byKey];
    const otherSetting = this.store.themeOtherSetting();
    if (!otherSetting) return;
    const scrapyName = otherSetting.useSpider;
    var params = [];
    var url = '';
    if (otherSetting.quickRefreshType === 'params') {
      params = element[otherSetting.quickRefresh]
        .split(',')
        .map((x: string) => element[x.trim()]);
    } else if (otherSetting.quickRefreshType === 'url') {
      url = element[otherSetting.quickRefresh].trim();
    }

    this.store.datasetService
      .quickRefreshDataset({
        byKey,
        primeKey,
        scrapyName,
        datasetName,
        url,
        params,
        quickRefreshType: otherSetting.quickRefreshType,
      })
      .subscribe(res => {
        this.store.quickRefreshResult.update(x => {
          x[byKey] = res;
          return x;
        });
        this.store.snackbarService.openI18N('msg.refreshSuccess');
      });
  }

  changeSort(event: SortType) {
    this.store.sortKey.set(event.key);
    this.store.patchQuery({
      type: QueryActionType.sort,
      key: event.key,
      asc: this.store.queryParamsAsc(),
    });
    this.toTop();
  }
  changeAsc() {
    this.store.ascFlag.update(x => !x);
    this.store.patchQuery({
      type: QueryActionType.sort,
      key: this.store.queryParamsSort(),
      asc: this.store.ascFlag(),
    });
    this.toTop();
  }
  changePage(page: number) {
    this.store.currentPage.set(page);
    this.store.patchQuery({
      type: QueryActionType.page,
      page,
    });
    this.toTop();
  }

  getData(data: any) {
    const id = data[this.store.defaultKey()];
    const refreshData = this.store.quickRefreshResult()[id];
    if (refreshData) {
      return { ...data, ...refreshData };
    }
    return data;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.ctrlPressed.set(true);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.ctrlPressed.set(false);
    }
  }
}
