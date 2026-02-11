import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiConfig } from '../../features/api-config/model';
import {
  BaseSelectTableData,
  SelectTableDialog,
} from '../components/select-table/select-table.dialog';
import { ScrapyConfig, ScrapyPagination } from '../../features/scrapy/model';
import { DatePipe, formatDate } from '@angular/common';
import {
  Dataset,
  GroupDataset,
  GroupDatasetData,
} from '../../features/dataset/model';
import { ShareTag } from '../../features/theme/models';
import { ReplaceValueMap } from '../../features/replace-value-map/model';
import { TranslateService } from '@ngx-translate/core';
import { isNotBlank } from '../../shared/util/helper';
import { filter } from 'rxjs';
import { DatabaseConfig } from '../../features/setting/model';

@Injectable({ providedIn: 'root' })
export class SelectTableService {
  matDialog = inject(MatDialog);
  translateService = inject(TranslateService);

  selectSingleApi(dataSource: ApiConfig[]) {
    const data: BaseSelectTableData<ApiConfig> = {
      displayedColumns: ['apiName', 'apiLabel', 'httpMethod', 'endpointUrl'],
      labels: [
        'apiConfig.apiName',
        'apiConfig.apiLabel',
        'apiConfig.httpMethod',
        'apiConfig.endpointUrl',
      ],
      dataSource,
      selectType: 'single',
    };
    return this.openSelectDialog(data);
  }

  selectSingleScrapy(dataSource: ScrapyConfig[]) {
    const data: BaseSelectTableData<ScrapyConfig> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['scrapy.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
    };
    return this.openSelectDialog(data);
  }

  selectSingleDataset(dataSource: Dataset[]) {
    const data: BaseSelectTableData<Dataset> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
    };
    return this.openSelectDialog(data);
  }

  selectMultipleDataset(dataSource: Dataset[], selected: Dataset[]) {
    const data: BaseSelectTableData<Dataset> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'multiple',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
      selected,
    };
    return this.openMultipleSelectDialog(data);
  }

  selectSingleGroupDataset(dataSource: GroupDataset[]) {
    const data: BaseSelectTableData<GroupDataset> = {
      displayedColumns: ['groupName', 'createdTime', 'updatedTime'],
      labels: ['dataset.groupName', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
    };
    return this.openSelectDialog(data);
  }

  selectSingleGroupDatasetData(dataSource: GroupDatasetData[]) {
    const data: BaseSelectTableData<GroupDatasetData> = {
      displayedColumns: ['primeValue', 'createdTime', 'updatedTime'],
      labels: ['dataset.primeValue', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
      columnSorts: {
        primeValue: true,
        createdTime: true,
        updatedTime: true,
      },
      enableFilter: true,
    };
    return this.openSelectDialog(data);
  }

  selectMutipleTag(dataSource: ShareTag[], selected: ShareTag[]) {
    const data: BaseSelectTableData<ShareTag> = {
      displayedColumns: ['shareTagId', 'shareTagName'],
      labels: ['themeTag.tag'],
      dataSource,
      selectType: 'multiple',
      selected,
      showTitle: false,
    };
    return this.openMultipleSelectDialog(data);
  }

  selectSingleShareTag(dataSource: ShareTag[]) {
    const data: BaseSelectTableData<ShareTag> = {
      displayedColumns: ['shareTagId', 'shareTagName', 'updatedTime'],
      labels: ['shareTag.tagId', 'shareTag.tagName', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        updatedTime: this.dateTransform,
      },
      showTitle: false,
    };
    return this.openSelectDialog(data);
  }

  selectSingleReplaceValueMap(dataSource: ReplaceValueMap[]) {
    const data: BaseSelectTableData<ReplaceValueMap> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
      columnSorts: {
        primeValue: true,
        createdTime: true,
        updatedTime: true,
      },
      enableFilter: true,
      title: this.translateService.instant('title.selectReplaceValueMap'),
    };
    return this.openSelectDialog(data);
  }

  selectMultipleValue(valueList: string[], selectedValue: string[] | string) {
    const dataSource = valueList.map(x => ({ value: x }));
    let selected: { value: string }[] = [];
    if (Array.isArray(selectedValue)) {
      selected = selectedValue
        .map(x => dataSource.find(y => y.value === x))
        .filter(x => x !== undefined);
    } else if (typeof selectedValue === 'string') {
      selected = selectedValue
        .split(',')
        .filter(x => isNotBlank(x))
        .map(x => dataSource.find(y => y.value === x))
        .filter(x => x !== undefined);
    }
    const data: BaseSelectTableData<{ value: string }> = {
      displayedColumns: ['value'],
      labels: ['g.value'],
      dataSource,
      selectType: 'multiple',
      selected,
      showTitle: false,
      enableFilter: true,
    };
    return this.openMultipleSelectDialog(data);
  }

  selectSingleScrapyPagination(dataSource: ScrapyPagination[]) {
    const data: BaseSelectTableData<ScrapyPagination> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['g.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: this.dateTransform,
        updatedTime: this.dateTransform,
      },
    };
    return this.openSelectDialog(data);
  }

  dateTransform(value: any): string {
    return formatDate(value, 'yyyy-MM-dd HH:mm:ss', 'en-US') || '';
  }

  private openSelectDialog<T>(config: BaseSelectTableData<T>) {
    return this.matDialog
      .open<
        SelectTableDialog<T, BaseSelectTableData<T>>,
        BaseSelectTableData<T>,
        T
      >(SelectTableDialog, { data: config })
      .afterClosed()
      .pipe(filter(x => x !== undefined));
  }
  private openMultipleSelectDialog<T>(config: BaseSelectTableData<T>) {
    return this.matDialog
      .open<
        SelectTableDialog<T, BaseSelectTableData<T>>,
        BaseSelectTableData<T>,
        T[]
      >(SelectTableDialog, { data: config })
      .afterClosed()
      .pipe(filter(res => res !== undefined));
  }
}
