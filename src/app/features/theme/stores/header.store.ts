import { computed, inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { map, filter, tap } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ShareTagService } from '../services/share-tag.service';
import {
  ThemeHeader,
  ThemeHeaderType,
  ThemeLabel,
  ThemeDataset,
  ThemeTag,
  ThemeTopCustom,
  ThemeOtherSetting,
  ThemeCustom,
} from '../models';
import { getHeaderId, isBlank, sortSeq } from '../../../shared/util/helper';
import { Store } from '@ngrx/store';
import { updateTitle } from '../../../shared/state/layout.actions';
import { TranslateService } from '@ngx-translate/core';
import { RouteStore } from './route.store';

@Injectable()
export class HeaderStore {
  readonly route = inject(RouteStore).route;
  readonly themeService = inject(ThemeService);
  readonly shareTagService = inject(ShareTagService);
  readonly store = inject(Store);
  readonly translateService = inject(TranslateService);

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
          this.store.dispatch(updateTitle({ title: res.title }));
        })
      ),
    defaultValue: {} as ThemeHeader,
  });

  themeImage = computed(() => {
    if (this.themeHeader.isLoading()) return undefined;
    return this.themeHeader.value()?.themeImage;
  });

  themeOtherSetting = computed<ThemeOtherSetting | undefined>(() => {
    if (this.themeHeader.status() !== 'resolved') return undefined;
    return this.themeHeader.value()?.themeOtherSetting;
  });

  visibleLabelList = computed<ThemeLabel[]>(() => {
    const labelList = this.themeHeader.value()?.themeLabelList;
    return Array.isArray(labelList)
      ? labelList
          .slice()
          .sort(sortSeq)
          .filter(x => x.isVisible)
      : [];
  });

  // 是否有使用序列號有的話key值為何
  seqKey = computed(
    () => this.visibleLabelList().find(x => x.type === 'seq')?.byKey ?? ''
  );
  defaultKey = computed(
    () => this.visibleLabelList().find(x => x.isDefaultKey)?.byKey ?? ''
  );

  themeDatasetList = computed<ThemeDataset[]>(() => {
    if (this.themeHeader.status() !== 'resolved') return [];
    return this.themeHeader.value().themeDatasetList.slice().sort(sortSeq);
  });

  themeTagList = computed<ThemeTag[]>(() => {
    return (this.themeHeader.value()?.themeTagList ?? [])
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
      this.themeHeader
        .value()
        ?.themeOtherSetting?.themeTopCustomList?.slice()
        .sort(sortSeq) ?? []
  );

  themeCustomList = computed<ThemeCustom[]>(
    () => this.themeHeader.value()?.themeCustomList?.slice().sort(sortSeq) ?? []
  );
}
