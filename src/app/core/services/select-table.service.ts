import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiConfig } from '../../features/api-config/model';
import {
  BaseSelectTableData,
  SelectTableDialog,
} from '../components/select-table/select-table.dialog';
import { ScrapyConfig } from '../../features/scrapy/model';
import { DatePipe } from '@angular/common';
import {
  Dataset,
  GroupDataset,
  GroupDatasetData,
} from '../../features/dataset/model';
import { ThemeTag } from '../../features/theme/models';
import { ReplaceValueMap } from '../../features/replace-value-map/model';

@Injectable({ providedIn: 'root' })
export class SelectTableService {
  constructor(private matDialog: MatDialog) {}

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
    return this.matDialog
      .open<
        SelectTableDialog<ApiConfig, BaseSelectTableData<ApiConfig>>,
        BaseSelectTableData<ApiConfig>,
        ApiConfig
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectSingleScrapy(dataSource: ScrapyConfig[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<ScrapyConfig> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['scrapy.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
    };
    return this.matDialog
      .open<
        SelectTableDialog<ScrapyConfig, BaseSelectTableData<ScrapyConfig>>,
        BaseSelectTableData<ScrapyConfig>,
        ScrapyConfig
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectSingleDataset(dataSource: Dataset[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<Dataset> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
    };
    return this.matDialog
      .open<
        SelectTableDialog<Dataset, BaseSelectTableData<Dataset>>,
        BaseSelectTableData<Dataset>,
        Dataset
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectMultipleDataset(dataSource: Dataset[], selected: Dataset[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<Dataset> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'multiple',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
      selected,
    };
    return this.matDialog
      .open<
        SelectTableDialog<Dataset, BaseSelectTableData<Dataset>>,
        BaseSelectTableData<Dataset>,
        Dataset[]
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectSingleGroupDataset(dataSource: GroupDataset[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<GroupDataset> = {
      displayedColumns: ['groupName', 'createdTime', 'updatedTime'],
      labels: ['dataset.groupName', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
    };
    return this.matDialog
      .open<
        SelectTableDialog<GroupDataset, BaseSelectTableData<GroupDataset>>,
        BaseSelectTableData<GroupDataset>,
        GroupDataset
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectSingleGroupDatasetData(dataSource: GroupDatasetData[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<GroupDatasetData> = {
      displayedColumns: ['primeValue', 'createdTime', 'updatedTime'],
      labels: ['dataset.primeValue', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
      columnSorts: {
        primeValue: true,
        createdTime: true,
        updatedTime: true,
      },
      enableFilter: true,
    };
    return this.matDialog
      .open<
        SelectTableDialog<
          GroupDatasetData,
          BaseSelectTableData<GroupDatasetData>
        >,
        BaseSelectTableData<GroupDatasetData>,
        GroupDatasetData
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectMutipleTag(dataSource: ThemeTag[], selected: ThemeTag[]) {
    const data: BaseSelectTableData<ThemeTag> = {
      displayedColumns: ['tag'],
      labels: ['themeTag.tag'],
      dataSource,
      selectType: 'multiple',
      selected,
      showTitle: false,
    };
    return this.matDialog
      .open<
        SelectTableDialog<ThemeTag, BaseSelectTableData<ThemeTag>>,
        BaseSelectTableData<ThemeTag>,
        ThemeTag[]
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }

  selectSingleReplaceValueMap(dataSource: ReplaceValueMap[]) {
    const datePipe = new DatePipe('en-US');
    const data: BaseSelectTableData<ReplaceValueMap> = {
      displayedColumns: ['name', 'createdTime', 'updatedTime'],
      labels: ['dataset.name', 'g.createdTime', 'g.updatedTime'],
      dataSource,
      selectType: 'single',
      columnFormats: {
        createdTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
        updatedTime: (value: any) =>
          datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss') || '',
      },
      columnSorts: {
        primeValue: true,
        createdTime: true,
        updatedTime: true,
      },
      enableFilter: true,
    };
    return this.matDialog
      .open<
        SelectTableDialog<
          ReplaceValueMap,
          BaseSelectTableData<ReplaceValueMap>
        >,
        BaseSelectTableData<ReplaceValueMap>,
        ReplaceValueMap
      >(SelectTableDialog, {
        data,
      })
      .afterClosed();
  }
}
