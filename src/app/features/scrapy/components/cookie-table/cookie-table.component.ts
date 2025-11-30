import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cookie, ScrapyData } from '../../model';
import { MatButtonModule } from '@angular/material/button';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-cookie-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    CdkDropList,
    CdkDrag
],
  templateUrl: './cookie-table.component.html',
})
export class CookieTableComponent extends GenericTableComponent<Cookie> {
  displayedColumns = ['seq', 'name', 'value', 'other'];
  override item: Cookie = {
    seq: 0,
    name: '',
    value: '',
  };
}
