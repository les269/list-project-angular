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
import { QueryActionType, SortType } from '../../../theme/models';
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
import {
  DataStore,
  FilterStore,
  HeaderStore,
  ListBaseViewStoreAdapter,
  ResourceStore,
  RouteStore,
  UIStateStore,
} from '../../stores/index.store';

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
  providers: [
    ListBaseViewStoreAdapter,
    RouteStore,
    HeaderStore,
    DataStore,
    FilterStore,
    ResourceStore,
    UIStateStore,
  ],
  selector: 'app-image-list-view',
  templateUrl: 'image-list-view.component.html',
  styleUrl: 'image-list-view.component.scss',
})
export class ImageListViewComponent {
  readonly store = inject(ListBaseViewStoreAdapter);

  replaceImageUrl = replaceValue;
  ctrlPressed = signal<boolean>(false);

  fixedImage = viewChild<FixedImageComponent>('fixedImage');

  constructor() {
    // 監聽路由變化並滾動到頂部
    effect(() => {
      this.store.queryParamMap();
      setTimeout(() => this.toTop());
    });

    // 驗證必要的 headerId
    effect(() => {
      if (isBlank(this.store.headerId())) {
        this.store.router.navigate(['']);
      }
    });
  }

  private toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateQueryAndScroll(action: any) {
    this.store.patchQuery(action);
    this.toTop();
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

  quickRefresh(element: any) {
    const datasetName = element[this.store.DATASET_NAME_KEY];
    const byKey = this.store.defaultKey();
    const primeKey = element[byKey];
    const otherSetting = this.store.themeOtherSetting();

    if (!otherSetting) return;

    const scrapyName = otherSetting.useSpider;
    const isParamType = otherSetting.quickRefreshType === 'params';
    const params = isParamType
      ? element[otherSetting.quickRefresh]
          .split(',')
          .map((x: string) => element[x.trim()])
      : [];
    const url = isParamType ? '' : element[otherSetting.quickRefresh].trim();

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
          x[primeKey] = res;
          return x;
        });
        this.store.snackbarService.openI18N('msg.refreshSuccess');
      });
  }

  changeSort(event: SortType) {
    this.store.sortKey.set(event.key);
    this.updateQueryAndScroll({
      type: QueryActionType.sort,
      key: event.key,
      asc: this.store.queryParamsAsc(),
    });
  }

  changeAsc() {
    this.store.ascFlag.update(x => !x);
    this.updateQueryAndScroll({
      type: QueryActionType.sort,
      key: this.store.queryParamsSort(),
      asc: this.store.ascFlag(),
    });
  }

  changePage(page: number) {
    this.store.setPage(page);
    this.toTop();
  }

  getData(data: any) {
    const refreshData =
      this.store.quickRefreshResult()[data[this.store.defaultKey()]];
    return refreshData ? { ...data, ...refreshData } : data;
  }

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  onKeyToggle(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.ctrlPressed.set(event.type === 'keydown');
    }
  }
}
