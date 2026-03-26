import {
  Component,
  EventEmitter,
  inject,
  Injector,
  input,
  Input,
  Output,
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormsModule,
  FormControl,
  FormArray,
  FormBuilder,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CssSelect } from '../../model';
import { MatChipsModule } from '@angular/material/chips';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { filter, switchMap } from 'rxjs';
import { isNotNull } from '../../../../shared/util/helper';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';

@Component({
  selector: 'app-css-select-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatChipsModule,
    GenericTableComponent,
  ],
  templateUrl: './css-select-table.component.html',
})
export class CssSelectTableComponent {
  displayedColumns = ['key', 'value'];
  readonly fb = inject(FormBuilder);
  replaceValueMapService = inject(ReplaceValueMapService);
  selectTableService = inject(SelectTableService);
  nameList = rxResource({
    stream: () => this.replaceValueMapService.getNameList(),
    defaultValue: [],
  });
  formArray = input.required<ToFormArray<CssSelect>>();
  cols: GenericTableColumn[] = [
    { key: 'key', label: 'g.key', columnType: GenericColumnType.input },
    {
      key: 'value',
      label: 'scrapy.cssSelect',
      columnType: GenericColumnType.textarea,
    },
  ];

  createGroup() {
    return this.fb.group({
      seq: [0],
      key: [''],
      value: [''],
      replaceString: [''],
      attr: [''],
      convertToArray: [false],
      onlyOwn: [false],
      replaceRegular: [''],
      replaceRegularTo: [''],
      replaceValueMapName: [''],
      splitText: [''],
    });
  }

  selectReplaceValueMap(element: CssSelect) {
    this.selectTableService
      .selectSingleReplaceValueMap(this.nameList.value())
      .subscribe(res => {
        element.replaceValueMapName = res.name;
      });
  }
}
