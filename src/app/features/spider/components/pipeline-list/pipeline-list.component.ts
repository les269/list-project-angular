import { CommonModule, KeyValue } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  ChineseConvertType,
  ZhConverterUtilType,
  ConvertToCaseType,
  PositionType,
  Timezones,
  ValuePipelineType,
} from '../../model';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { MatButtonModule } from '@angular/material/button';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { switchMap } from 'rxjs';
import { ChipSelectButtonComponent } from '../../../../core/components/chip-select-button/chip-select-button.component';
import { ReplaceValueMap } from '../../../replace-value-map/model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EnumKeysPipe } from '../../../../shared/util/util.pipe';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { SpiderFormService } from '../../services/spider-form.service';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';
import { ChipInputMapComponent } from '../../../../core/components';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-pipeline-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DragDropModule,
    MatIconModule,
    TrimOnBlurDirective,
    MatButtonModule,
    ChipSelectButtonComponent,
    MatTooltipModule,
    EnumKeysPipe,
    ChipInputComponent,
    CodeEditor,
    MatTooltipModule,
    ChipInputMapComponent,
  ],
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.scss'],
})
export class PipelineListComponent {
  readonly selectTableService = inject(SelectTableService);
  readonly replaceValueMapService = inject(ReplaceValueMapService);
  readonly spiderFormService = inject(SpiderFormService);

  readonly formArray = input.required<FormArray<FormGroup>>();
  readonly replaceValueMapList = input<ReplaceValueMap[]>([]);

  readonly CodeEditorLanguages = languages;
  readonly eValuePipelineType = ValuePipelineType;
  readonly eConvertToCaseType = ConvertToCaseType;
  readonly eTimezones = Timezones;
  readonly eChineseConvertType = ChineseConvertType;
  readonly eZhConverterUtilType = ZhConverterUtilType;
  readonly ePositionType = PositionType;
  onAdd() {
    const arr = this.formArray();
    const nextSeq = arr.length;
    arr.push(this.spiderFormService.createPipelineGroup({ seq: nextSeq }));
  }

  onDelete(index: number) {
    const arr = this.formArray();
    arr.removeAt(index);
    this.updateSeq();
  }

  dropPipeline(event: CdkDragDrop<FormGroup[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const arr = this.formArray();
    const controls = arr.controls;
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    this.updateSeq();
    arr.updateValueAndValidity();
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

  private updateSeq() {
    this.formArray().controls.forEach((ctrl, i) => {
      ctrl.get('seq')?.setValue(i, { emitEvent: false });
    });
  }
}
