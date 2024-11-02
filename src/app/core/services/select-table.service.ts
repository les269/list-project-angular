import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiConfig } from '../../features/api-config/model';
import {
  BaseSelectTableData,
  SelectTableDialog,
} from '../components/select-table/select-table.dialog';
import { ScrapyConfig } from '../../features/scrapy/model';
import { DatePipe } from '@angular/common';

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
}
