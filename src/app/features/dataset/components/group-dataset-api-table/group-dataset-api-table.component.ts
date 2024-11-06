import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { GroupDatasetApi } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ApiConfig } from '../../../api-config/model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-group-dataset-api-table',
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
  templateUrl: './group-dataset-api-table.component.html',
})
export class GroupDatasetApiTableComponent implements OnInit {
  displayedColumns = ['seq', 'apiName', 'label', 'other'];
  @Input({ required: true }) apiList!: GroupDatasetApi[];
  @Output() apiListChange = new EventEmitter<GroupDatasetApi[]>();
  apiConfigList: ApiConfig[] = [];

  constructor(
    private selectTableService: SelectTableService,
    private apiConfigService: ApiConfigService
  ) {}
  ngOnInit(): void {
    this.apiConfigService.getAll().subscribe(res => (this.apiConfigList = res));
  }

  selectApi(e: GroupDatasetApi) {
    this.selectTableService
      .selectSingleApi(this.apiConfigList)
      .pipe(filter(res => res !== undefined))
      .subscribe(x => {
        e.apiName = x.apiName;
      });
  }

  onAdd() {
    this.apiList = [
      ...this.apiList,
      {
        seq: this.apiList.length + 1,
        apiName: '',
        label: '',
      },
    ];
    this.apiListChange.emit(this.apiList);
  }

  onDelete(index: number) {
    this.apiList = this.apiList.filter((x, i) => i !== index);
    this.apiListChange.emit(this.apiList);
  }
  //資料來源的上下移動
  onUpDown(index: number, type: 'up' | 'down') {
    let data: GroupDatasetApi[] = JSON.parse(JSON.stringify(this.apiList));
    let source = data[index];
    let target = data.splice(index + (type === 'up' ? -1 : 1), 1, source);
    data.splice(index, 1, target[0]);
    this.apiList = data.map((x, i) => {
      x.seq = i + 1;
      return x;
    });
    this.apiListChange.emit(this.apiList);
  }
}
