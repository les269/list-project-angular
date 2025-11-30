import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { GroupDatasetScrapy } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { ScrapyService } from '../../../scrapy/services/scrapy.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { switchMap } from 'rxjs';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-group-dataset-scrapy-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    CdkDropList,
    CdkDrag
],
  templateUrl: './group-dataset-scrapy-table.component.html',
})
export class GroupDatasetScrapyTableComponent extends GenericTableComponent<GroupDatasetScrapy> {
  displayedColumns = [
    'seq',
    'name',
    'label',
    'isDefault',
    'visibleJson',
    'visibleUrl',
    'other',
  ];

  override item: GroupDatasetScrapy = {
    seq: 0,
    name: '',
    label: '',
    isDefault: false,
    visibleJson: false,
    visibleUrl: false,
  };

  scrapyService: ScrapyService;

  constructor(injector: Injector) {
    super(injector);
    this.scrapyService = this.injector.get(ScrapyService);
  }

  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.list.map((x, i) => {
        if (i !== index) {
          x.isDefault = false;
        }
        return x;
      });
    }
    this.listChange.emit(this.list);
  }

  selectScrapy(e: GroupDatasetScrapy) {
    this.scrapyService
      .getAllConfig()
      .pipe(switchMap(x => this.selectTableService.selectSingleScrapy(x)))
      .subscribe(res => {
        e.name = res.name;
      });
  }
}
