import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ScrapyConfig } from '../../../scrapy/model';
import { SelectTableService } from '../../../../core/services/select-table.service';

@Component({
  selector: 'app-group-dataset-scrapy-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  templateUrl: './group-dataset-scrapy-table.component.html',
})
export class GroupDatasetScrapyTableComponent implements OnInit {
  displayedColumns = [
    'seq',
    'name',
    'label',
    'isDefault',
    'visibleJson',
    'visibleUrl',
    'other',
  ];
  @Input({ required: true }) scrapyList!: GroupDatasetScrapy[];
  @Output() scrapyListChange = new EventEmitter<GroupDatasetScrapy[]>();
  scrapyConfigList: ScrapyConfig[] = [];

  constructor(
    private scrapyService: ScrapyService,
    private selectTableService: SelectTableService
  ) {}
  ngOnInit(): void {
    this.scrapyService.getAllConfig().subscribe(res => {
      this.scrapyConfigList = res;
    });
  }

  onAdd() {
    this.scrapyList = [
      ...this.scrapyList,
      {
        seq: this.scrapyList.length + 1,
        name: '',
        isDefault: false,
        label: '',
        visibleJson: false,
        visibleUrl: false,
      },
    ];
    this.scrapyListChange.emit(this.scrapyList);
  }

  onDelete(index: number) {
    this.scrapyList = this.scrapyList.filter((x, i) => i !== index);
    this.scrapyListChange.emit(this.scrapyList);
  }
  //資料來源的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: GroupDatasetScrapy[] = JSON.parse(
      JSON.stringify(this.scrapyList)
    );
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.scrapyList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.scrapyListChange.emit(this.scrapyList);
  }
  //改變資料欄位的預設欄位,只能有一筆或無
  changeDefaultKey(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      this.scrapyList.map((x, i) => {
        if (i !== index) {
          x.isDefault = false;
        }
        return x;
      });
    }
    this.scrapyListChange.emit(this.scrapyList);
  }
  selectScrapy(e: GroupDatasetScrapy) {
    this.selectTableService
      .selectSingleScrapy(this.scrapyConfigList)
      .subscribe(res => {
        if (res) {
          e.name = res.name;
        }
      });
  }
}
