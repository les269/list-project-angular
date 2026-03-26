import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  Output,
} from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
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
import {
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';

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
    GenericTableComponent,
  ],
  templateUrl: './cookie-table.component.html',
})
export class CookieTableComponent {
  displayedColumns = ['name', 'value'];
  formArray = input.required<ToFormArray<Cookie>>();
  cols: GenericTableColumn[] = [
    { key: 'name', label: 'g.name', columnType: GenericColumnType.input },
    { key: 'value', label: 'g.value', columnType: GenericColumnType.input },
  ];
  readonly fb = inject(FormBuilder);
  createGroup() {
    return this.fb.group({
      seq: [0],
      name: ['', [Validators.required]],
      value: ['', [Validators.required]],
    });
  }
}
