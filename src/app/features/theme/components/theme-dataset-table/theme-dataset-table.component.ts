import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { isNull } from '../../../../shared/util/helper';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { Dataset } from '../../../dataset/model';
import { ThemeDataset } from '../../models';
import { switchMap } from 'rxjs';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslateModule,
    MatChipsModule,
    CdkDropList,
    CdkDrag,
  ],
  selector: 'app-theme-dataset-table',
  templateUrl: 'theme-dataset-table.component.html',
})
export class ThemeDatasetTableComponent extends GenericTableComponent<ThemeDataset> {
  displayedColumns: string[] = ['order', 'dataset', 'label', 'other'];
  override item: ThemeDataset = {
    seq: 0,
    datasetList: [],
    label: '',
    isDefault: false,
  };
  datasetService: DatasetService;
  constructor(injector: Injector) {
    super(injector);
    this.datasetService = this.injector.get(DatasetService);
  }

  //改變清單預設使用的資料來源
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
  selectDataset(element: ThemeDataset) {
    this.datasetService
      .getAllDataset()
      .pipe(
        switchMap(res => {
          const selected = res.filter(x =>
            element.datasetList.includes(x.name)
          );
          return this.selectTableService.selectMultipleDataset(res, selected);
        })
      )
      .subscribe(x => {
        if (x) {
          element.datasetList = x.map(x => x.name);
        }
      });
  }

  removeChip(element: ThemeDataset, dataset: string) {
    element.datasetList = element.datasetList.filter(x => x !== dataset);
  }
}
