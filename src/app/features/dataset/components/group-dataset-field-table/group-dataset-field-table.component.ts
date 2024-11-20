import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDatasetField, GroupDatasetFieldType } from '../../model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap, filter } from 'rxjs';
import { isNotNull } from '../../../../shared/util/helper';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-group-dataset-field-table',
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
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './group-dataset-field-table.component.html',
})
export class GroupDatasetFieldTableComponent extends GenericTableComponent<GroupDatasetField> {
  eDatasetFieldType = GroupDatasetFieldType;
  displayedColumns = ['seq', 'key', 'label', 'type', 'other'];
  override item: GroupDatasetField = {
    seq: 0,
    type: GroupDatasetFieldType.string,
    key: '',
    label: '',
    replaceValueMapName: '',
  };
  replaceValueMapService: ReplaceValueMapService;

  constructor(injector: Injector) {
    super(injector);
    this.replaceValueMapService = this.injector.get(ReplaceValueMapService);
  }

  selectReplaceValueMap(element: GroupDatasetField) {
    this.replaceValueMapService
      .getNameList()
      .pipe(
        switchMap(res =>
          this.selectTableService.selectSingleReplaceValueMap(res)
        ),
        filter(x => x !== undefined)
      )
      .subscribe(res => {
        element.replaceValueMapName = res.name;
      });
  }
}
