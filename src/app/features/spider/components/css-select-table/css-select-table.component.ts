import { Component, inject, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { CssSelect } from '../../model';
import { createCssSelect } from '../../util/css-select';

@Component({
  selector: 'app-css-select-table',

  imports: [
    MatTableModule,
    FormField,
    TranslatePipe,
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
  replaceValueMapService = inject(ReplaceValueMapService);
  selectTableService = inject(SelectTableService);
  nameList = rxResource({
    stream: () => this.replaceValueMapService.getNameList(),
    defaultValue: [],
  });
  readonly fields = input.required<FieldTree<CssSelect[]>>();
  cols: GenericTableColumn[] = [
    { key: 'key', label: 'g.key', columnType: GenericColumnType.input },
    {
      key: 'value',
      label: 'scrapy.cssSelect',
      columnType: GenericColumnType.textarea,
    },
  ];

  readonly createRow = createCssSelect;

  selectReplaceValueMap(
    element: FieldTree<ReturnType<CssSelectTableComponent['createRow']>>
  ) {
    this.selectTableService
      .selectSingleReplaceValueMap(this.nameList.value())
      .subscribe(res => {
        element.replaceValueMapName().value.set(res.name);
      });
  }
}
