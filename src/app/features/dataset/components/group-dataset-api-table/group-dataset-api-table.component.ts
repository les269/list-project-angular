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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { GroupDatasetApi } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ApiConfig } from '../../../api-config/model';
import { filter, switchMap } from 'rxjs';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-group-dataset-api-table',
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
  templateUrl: './group-dataset-api-table.component.html',
})
export class GroupDatasetApiTableComponent extends GenericTableComponent<GroupDatasetApi> {
  displayedColumns = ['seq', 'apiName', 'label', 'other'];
  override item: GroupDatasetApi = {
    seq: 0,
    apiName: '',
    label: '',
  };
  apiConfigService: ApiConfigService;
  constructor(injector: Injector) {
    super(injector);
    this.apiConfigService = this.injector.get(ApiConfigService);
  }

  selectApi(e: GroupDatasetApi) {
    this.apiConfigService
      .getAll()
      .pipe(switchMap(x => this.selectTableService.selectSingleApi(x)))
      .subscribe(x => {
        e.apiName = x.apiName;
      });
  }
}
