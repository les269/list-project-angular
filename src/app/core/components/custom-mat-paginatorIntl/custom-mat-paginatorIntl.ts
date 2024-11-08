import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.getTranslations();
  }
  getTranslations() {
    this.translate.get('g.everyPage').subscribe(res => {
      this.itemsPerPageLabel = res;
    });
    this.translate.get('g.nextPage').subscribe(res => {
      this.nextPageLabel = res;
    });
    this.translate.get('g.prePage').subscribe(res => {
      this.previousPageLabel = res;
    });
    this.translate.get('g.firstPage').subscribe(res => {
      this.firstPageLabel = res;
    });
    this.translate.get('g.lastPage').subscribe(res => {
      this.lastPageLabel = res;
    });

    this.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return this.translate.instant('g.noData');
      }
      const start = page * pageSize + 1;
      const end = Math.min((page + 1) * pageSize, length);
      return this.translate.instant('g.rangeLabel', { start, end, length });
    };
  }
}
