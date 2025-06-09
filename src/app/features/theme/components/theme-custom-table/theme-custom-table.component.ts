import { Component, Injector, Input, OnInit, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  OpenWindowTargetType,
  ThemeCustom,
  ThemeCustomType,
} from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { isBlank, isNull } from '../../../../shared/util/helper';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { switchMap } from 'rxjs';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';

@Component({
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
  selector: 'app-theme-custom-table',
  templateUrl: 'theme-custom-table.component.html',
})
export class ThemeCustomTableComponent extends GenericTableComponent<ThemeCustom> {
  displayedColumns = ['order', 'type', 'byKey', 'label', 'other'];
  override item: ThemeCustom = {
    type: ThemeCustomType.openUrl,
    byKey: '',
    label: '',
    seq: 0,
    apiName: '',
    openUrl: '',
    copyValue: '',
    buttonIconFill: '',
    buttonIconFillColor: '',
    buttonIconTrue: '',
    buttonIconFalse: '',
    moveTo: '',
    filePathForMoveTo: '',
    deleteFile: '',
    openWindowsTarget: OpenWindowTargetType._self,
    openFolder: '',
    visibleDatasetNameList: [],
  };
  eThemeCustomType = ThemeCustomType;
  eOpenWindowTargetType = OpenWindowTargetType;
  apiConfigService: ApiConfigService;

  constructor(injector: Injector) {
    super(injector);
    this.apiConfigService = this.injector.get(ApiConfigService);
  }

  selectApi(element: ThemeCustom) {
    this.apiConfigService
      .getAll()
      .pipe(switchMap(res => this.selectTableService.selectSingleApi(res)))
      .subscribe(res => {
        element.apiConfig = res;
      });
  }

  removeApi(element: ThemeCustom) {
    element.apiConfig = undefined;
  }
}
