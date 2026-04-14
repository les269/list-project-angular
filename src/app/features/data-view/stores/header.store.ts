import { computed, inject, Injectable } from '@angular/core';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { map, filter, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { getHeaderId, isBlank, sortSeq } from '../../../shared/util/helper';
import { TranslateService } from '@ngx-translate/core';
import {
  ThemeHeaderType,
  ThemeHeader,
  ThemeOtherSetting,
  ThemeLabel,
  ThemeDataset,
  ThemeTag,
  ThemeTopCustom,
  ThemeCustom,
  DEFAULT_ROW_COLOR,
  ThemeItem,
  ThemeItemType,
} from '../../theme/models';
import { ShareTagService } from '../../theme/services/share-tag.service';
import { ThemeService } from '../../theme/services/theme.service';
import { LayoutStore } from '../../../core/stores/layout.store';
import { ThemeItemService } from '../../theme/services';

@Injectable()
export class HeaderStore {
  readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);
  readonly shareTagService = inject(ShareTagService);
  readonly translateService = inject(TranslateService);
  readonly layoutStore = inject(LayoutStore);
  readonly themeItemService = inject(ThemeItemService);

  readonly RANDOM_KEY = '__random';

  themeHeaderType = toSignal(
    this.route.data.pipe(map(x => x['type'] ?? ThemeHeaderType.imageList)),
    { initialValue: ThemeHeaderType.imageList }
  );

  listName = toSignal(this.route.params.pipe(map(x => x['name'])));
  listVersion = toSignal(this.route.params.pipe(map(x => x['version'])));

  headerId = computed(() => {
    const name = this.listName();
    const version = this.listVersion();
    if (isBlank(name) || isBlank(version)) return '';
    return getHeaderId(name, version, this.themeHeaderType());
  });

  themeHeader = rxResource({
    params: () => this.headerId(),
    stream: ({ params }) =>
      this.themeService.getByHeaderId(params).pipe(
        filter(res => !!res),
        tap(res => {
          document.title = res.title;
          this.layoutStore.updateTitle(res.title);
        })
      ),
    defaultValue: {} as ThemeHeader,
  });

  themeItems = rxResource({
    params: () => this.headerId(),
    stream: ({ params }) => this.themeItemService.getItemsByHeaderId(params),
    defaultValue: [] as ThemeItem[],
  });

  themeImage = computed(() => {
    if (
      this.themeItems.isLoading() ||
      this.themeHeaderType() !== ThemeHeaderType.imageList
    ) {
      return undefined;
    }

    return this.themeItems.value().find(x => x.type === ThemeItemType.IMAGE)
      ?.json;
  });

  themeOtherSetting = computed<ThemeOtherSetting | undefined>(() => {
    if (this.themeItems.isLoading()) return undefined;
    return this.themeItems
      .value()
      .find(x => x.type === ThemeItemType.OTHERSETTING)?.json;
  });

  visibleLabelList = computed<ThemeLabel[]>(() => {
    if (this.themeItems.isLoading()) return [];

    const labelList = this.themeItems
      .value()
      .find(x => x.type === ThemeItemType.LABEL)?.json;
    return Array.isArray(labelList)
      ? labelList
          .slice()
          .sort(sortSeq)
          .filter(x => x.isVisible)
      : [];
  });
  defaultSortLabel = computed(() => {
    return this.visibleLabelList().find(x => x.isSort)?.byKey ?? '';
  });

  displayedColumns = computed<string[]>(() => [
    ...this.visibleLabelList().map(x => x.byKey),
    'other',
  ]);

  // 是否有使用序列號有的話key值為何
  seqKey = computed(
    () => this.visibleLabelList().find(x => x.type === 'seq')?.byKey ?? ''
  );
  defaultKey = computed(
    () => this.visibleLabelList().find(x => x.isDefaultKey)?.byKey ?? ''
  );

  themeDatasetList = computed<ThemeDataset[]>(() => {
    if (this.themeItems.isLoading()) return [];
    return (
      this.themeItems
        .value()
        .find(x => x.type === ThemeItemType.DATASET)
        ?.json?.slice()
        .sort(sortSeq) ?? []
    );
  });
  defaultDataset = computed(
    () =>
      this.themeDatasetList().find(x => x.isDefault)?.seq ??
      this.themeDatasetList()[0].seq
  );

  themeTagList = computed<ThemeTag[]>(() => {
    if (this.themeItems.isLoading()) return [];
    return (
      this.themeItems.value().find(x => x.type === ThemeItemType.TAG)?.json ??
      []
    )
      .map(x => ({ ...x, seq: parseInt(x.seq + '') }))
      .sort(sortSeq);
  });

  topCustomValueMap = rxResource({
    params: () => this.headerId(),
    stream: ({ params }) => this.themeService.findTopCustomValue(params),
    defaultValue: {},
  });

  themeTopCustomList = computed<ThemeTopCustom[]>(
    () =>
      this.themeItems
        .value()
        .find(x => x.type === ThemeItemType.TOPCUSTOM)
        ?.json?.slice()
        .sort(sortSeq) ?? []
  );

  themeCustomList = computed<ThemeCustom[]>(
    () =>
      this.themeItems
        .value()
        .find(x => x.type === ThemeItemType.CUSTOM)
        ?.json?.slice()
        .sort(sortSeq) ?? []
  );

  rowColor = computed<string[]>(() => {
    return this.themeOtherSetting()?.rowColor ?? DEFAULT_ROW_COLOR;
  });
}
