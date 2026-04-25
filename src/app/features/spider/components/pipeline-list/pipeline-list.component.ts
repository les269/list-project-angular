import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ValuePipeline, ValuePipelineType } from '../../model';
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
import { rxResource } from '@angular/core/rxjs-interop';
import { ReplaceValueMap } from '../../../replace-value-map/model';

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
  ],
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.scss'],
})
export class PipelineListComponent {
  readonly fb = inject(FormBuilder);
  readonly selectTableService = inject(SelectTableService);
  readonly replaceValueMapService = inject(ReplaceValueMapService);

  readonly formArray = input.required<FormArray<FormGroup>>();

  readonly eValuePipelineType = ValuePipelineType;

  readonly replaceValueMap = rxResource({
    stream: () => this.replaceValueMapService.getNameList(),
    defaultValue: [],
  });

  onAdd() {
    const arr = this.formArray();
    const nextSeq = arr.length;
    arr.push(this.createPipelineGroup({ seq: nextSeq }));
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

  createPipelineGroup(data?: Partial<ValuePipeline>) {
    return this.fb.nonNullable.group({
      seq: [data?.seq ?? 0],
      type: [data?.type ?? ValuePipelineType.SPLIT_TEXT],
      enabled: [data?.enabled ?? true],
      attributeName: [data?.attributeName ?? ''],
      pattern: [data?.pattern ?? ''],
      replacement: [data?.replacement ?? ''],
      separator: [data?.separator ?? ''],
      combineToString: [data?.combineToString ?? ''],
      combineByKey: [data?.combineByKey ?? ''],
      useReplaceValueMap: [data?.useReplaceValueMap ?? ''],
    });
  }

  readonly selectReplaceValueMap = () =>
    this.selectTableService.selectSingleReplaceValueMap(
      this.replaceValueMap.value()
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
