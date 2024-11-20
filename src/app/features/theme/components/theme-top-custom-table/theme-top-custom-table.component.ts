import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeTopCustom, ThemeTopCustomType } from '../../models';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { isNull } from '../../../../shared/util/helper';
import { switchMap } from 'rxjs';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
  selector: 'app-theme-top-custom-table',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './theme-top-custom-table.component.html',
})
export class ThemeTopCustomTableComponent extends GenericTableComponent<ThemeTopCustom> {
  displayedColumns = ['order', 'type', 'byKey', 'label', 'other'];
  eThemeTopCustomType = ThemeTopCustomType;
  override item: ThemeTopCustom = {
    type: ThemeTopCustomType.openUrl,
    label: '',
    byKey: '',
    seq: 0,
    openUrl: '',
    apiName: '',
  };
  apiConfigService: ApiConfigService;
  constructor(injector: Injector) {
    super(injector);
    this.apiConfigService = this.injector.get(ApiConfigService);
  }

  selectApi(element: ThemeTopCustom) {
    this.apiConfigService
      .getAll()
      .pipe(switchMap(res => this.selectTableService.selectSingleApi(res)))
      .subscribe(res => {
        element.apiConfig = res;
      });
  }

  removeApi(element: ThemeTopCustom) {
    element.apiConfig = undefined;
  }
}
