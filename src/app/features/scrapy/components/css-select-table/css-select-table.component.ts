import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-css-select-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatChipsModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './css-select-table.component.html',
})
export class CssSelectTableComponent extends GenericTableComponent<CssSelect> {
  displayedColumns = ['seq', 'key', 'value', 'other'];
  override item: CssSelect = {
    seq: 0,
    key: '',
    value: '',
    replaceString: '',
    attr: '',
    convertToArray: false,
    onlyOwn: false,
    replaceRegular: '',
    replaceRegularTo: '',
    replaceValueMapName: '',
    splitText: '',
  };
  replaceValueMapService: ReplaceValueMapService;

  constructor(injector: Injector) {
    super(injector);
    this.replaceValueMapService = this.injector.get(ReplaceValueMapService);
  }

  selectReplaceValueMap(element: CssSelect) {
    this.replaceValueMapService
      .getNameList()
      .pipe(
        switchMap(res =>
          this.selectTableService.selectSingleReplaceValueMap(res)
        )
      )
      .subscribe(res => {
        element.replaceValueMapName = res.name;
      });
  }
}
