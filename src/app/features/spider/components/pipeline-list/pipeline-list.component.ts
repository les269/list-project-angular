import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { languages } from '@codemirror/language-data';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { ChipInputMapComponent } from '../../../../core/components';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { EnumKeysPipe } from '../../../../shared/util/util.pipe';
import { ReplaceValueMap } from '../../../replace-value-map/model';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import {
  ChineseConvertType,
  ConvertToCaseType,
  PositionType,
  Timezones,
  ValuePipeline,
  ValuePipelineType,
  ZhConverterUtilType,
} from '../../model';
import { ValuePipelineFormService } from '../../services';

@Component({
  selector: 'app-pipeline-list',

  imports: [
    CommonModule,
    FormField,
    TranslateModule,
    DragDropModule,
    MatIconModule,
    TrimOnBlurDirective,
    MatButtonModule,
    MatTooltipModule,
    EnumKeysPipe,
    ChipInputComponent,
    SignalCodeEditorComponent,
    MatTooltipModule,
    ChipInputMapComponent,
  ],
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.scss'],
})
export class PipelineListComponent {
  readonly selectTableService = inject(SelectTableService);
  readonly replaceValueMapService = inject(ReplaceValueMapService);
  readonly valuePipelineFormService = inject(ValuePipelineFormService);

  readonly fields = input.required<FieldTree<ValuePipeline[]>>();
  readonly replaceValueMapList = input<ReplaceValueMap[]>([]);

  readonly rows = computed(() => Array.from(this.fields()));
  readonly CodeEditorLanguages = languages;
  readonly eValuePipelineType = ValuePipelineType;
  readonly eConvertToCaseType = ConvertToCaseType;
  readonly eTimezones = Timezones;
  readonly eChineseConvertType = ChineseConvertType;
  readonly eZhConverterUtilType = ZhConverterUtilType;
  readonly ePositionType = PositionType;
  private updateRows(update: (rows: ValuePipeline[]) => ValuePipeline[]) {
    const state = this.fields()();
    if (state.disabled()) return;
    state.value.update(rows =>
      update(rows).map((row, seq) => ({ ...row, seq }))
    );
    state.markAsDirty();
  }
  onAdd() {
    this.updateRows(rows => [
      ...rows,
      this.valuePipelineFormService.createValuePipeline(),
    ]);
  }
  onDelete(index: number) {
    this.updateRows(rows => rows.filter((_, i) => i !== index));
  }
  dropPipeline(
    event: CdkDragDrop<FieldTree<ValuePipeline, number, 'writable'>[]>
  ) {
    if (event.previousIndex === event.currentIndex) return;
    this.updateRows(rows => {
      const next = [...rows];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  selectReplaceValueMap = () =>
    this.replaceValueMapService
      .getNameList()
      .pipe(
        switchMap(list =>
          this.selectTableService.selectSingleReplaceValueMap(list)
        )
      );

  getReplaceValueMapLabel(item: ReplaceValueMap) {
    return item.name;
  }
}
