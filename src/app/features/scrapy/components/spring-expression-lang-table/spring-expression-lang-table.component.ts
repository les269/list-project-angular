import { Component, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { SpringExpressionLang } from '../../model';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-spring-expression-lang-table',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    MatTableModule,
    MatIconModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
  ],
  templateUrl: './spring-expression-lang-table.component.html',
})
export class SpringExpressionLangTableComponent extends GenericTableComponent<SpringExpressionLang> {
  displayedColumns = ['seq', 'key', 'expression', 'other'];
  override item: SpringExpressionLang = {
    seq: 0,
    key: '',
    expression: '',
  };

  constructor(injector: Injector) {
    super(injector);
  }
}
