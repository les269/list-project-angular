import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileService } from '../../../core/services/file.service';
import { FilterStore } from './filter.store';
import { HeaderStore } from './header.store';
import { replaceValue } from '../../../shared/util/helper';
import { ThemeService } from '../../theme/services/theme.service';

interface FileExistReq {
  path: string;
  name: string;
}

@Injectable()
export class ResourceStore {
  readonly themeService = inject(ThemeService);
  readonly fileService = inject(FileService);
  readonly filterStore = inject(FilterStore);
  readonly headerStore = inject(HeaderStore);

  // file existence check request
  fileExistReq = computed(() => {
    const checkFileExist = this.headerStore.themeOtherSetting()?.checkFileExist;
    if (!checkFileExist) return [] as FileExistReq[];
    const key = this.headerStore.defaultKey();
    return this.filterStore.viewData().map(x => ({
      path: replaceValue(checkFileExist, x),
      name: x[key],
    }));
  });

  fileExistResource = rxResource({
    params: () => this.fileExistReq(),
    stream: ({ params }) => {
      if (!params?.length) return of({});
      return this.fileService.fileExist(params);
    },
    defaultValue: {},
  });

  // custom value request
  customValueRequest = computed(() => {
    const headerId = this.headerStore.headerId();
    const key = this.headerStore.defaultKey();
    const data = this.filterStore.viewData();

    return {
      headerId,
      valueList: data.map(x => x[key]),
    };
  });

  // custom value resource from database
  customValueMap = rxResource({
    params: () => this.customValueRequest(),
    stream: ({ params }) =>
      this.themeService.findCustomValue(params).pipe(
        map(res => {
          const valueList = this.customValueRequest().valueList;

          const missing: Record<string, any> = Object.fromEntries(
            valueList.filter(v => !res.hasOwnProperty(v)).map(v => [v, {}])
          );

          return {
            ...res,
            ...missing,
          };
        })
      ),
    defaultValue: {},
  });
}
