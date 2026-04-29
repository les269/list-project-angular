import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTable, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ControlsOf,
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../model/generic-table';
import { MatButtonModule } from '@angular/material/button';
import { ChipSelectButtonComponent } from '../chip-select-button/chip-select-button.component';
import { ChipSelectMultipleButtonComponent } from '../chip-select-multiple-button/chip-select-multiple-button.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { getWidth, trimControl } from '../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../shared/util/util.directive';

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    CdkDropList,
    CdkDrag,
    MatIcon,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    ChipSelectButtonComponent,
    ChipSelectMultipleButtonComponent,
    MatRadioModule,
    MatCheckboxModule,
    TrimOnBlurDirective,
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
})
export class GenericTableComponent {
  // inject
  readonly fb = inject(FormBuilder);
  readonly translate = inject(TranslateService);
  // input
  readonly formArray = input.required<ToFormArray<any>>();
  readonly cols = input.required<GenericTableColumn[]>();
  readonly displayedColumns = input.required<string[]>();
  readonly createGroup = input.required<(a?: any) => FormGroup>();
  readonly initData = input<any[]>();
  readonly customColTmpls = input<Record<string, TemplateRef<any>>>();
  readonly expandedTmpl = input<TemplateRef<any>>();

  readonly displayedColumnsWith = computed(() => [
    'seq',
    ...this.displayedColumns(),
    'other',
  ]);

  readonly eGenericColumnType = GenericColumnType;

  readonly dragDisabled = signal(true);

  readonly table = viewChild(MatTable);
  readonly getWidth = getWidth;
  readonly trimControl = trimControl;

  constructor() {
    effect(() => {
      const data = this.initData();
      if (!data) return;
      untracked(() => {
        this.setFormArrayData(data);
      });
    });
  }

  setFormArrayData(data: any[]) {
    const array = this.formArray();
    array.clear();
    for (const item of data.slice()) {
      const group = this.createGroup()(item);
      group.patchValue(item);
      array.push(group);
    }
    this.table()?.renderRows();
  }

  private updateSequenceFromFormArray() {
    this.formArray().controls.forEach((ctrl, index) => {
      const seqControl = ctrl.get('seq') as FormControl<number> | null;
      if (seqControl) {
        // 現在 TS 知道這是一個接收 number 的 FormControl 了
        seqControl.patchValue(index + 1, { emitEvent: false });
      }
    });
    this.table()?.renderRows();
  }

  onAdd() {
    // 取得目前的 FormArray 實例
    const arr = this.formArray();
    // 1. 建立 Non-nullable 的 Control
    const group = this.createGroup()!();
    // 2. 標記狀態
    group.markAsDirty();
    // 3. 直接對該實例進行 push (物件參考不變，所以不違反 Signal 唯讀原則)
    arr.push(group);
    // 4. 更新排序與發出事件
    this.updateSequenceFromFormArray();
  }

  onDelete(index: number) {
    this.formArray().removeAt(index);
    this.updateSequenceFromFormArray();
  }

  drop(event: CdkDragDrop<FormGroup<ControlsOf<any>>[]>) {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.updateSequenceFromFormArray();
    this.formArray().updateValueAndValidity();
  }

  onRadioChange(rowIndex: number, key: string) {
    const arr = this.formArray();

    arr.controls.forEach((group, i) => {
      const control = group.get(key);
      if (!control) return;
      const newValue = i === rowIndex;
      if (control.value !== newValue) {
        (control as FormControl).setValue(newValue, { emitEvent: false });
        control.markAsDirty();
      }
    });
    arr.updateValueAndValidity();
  }
  print(element: FormControl, ctrl: any) {
    console.log(element, element.get('seq'));
    console.log(ctrl);
  }
  requireError(col: GenericTableColumn, ctrl: AbstractControl | null) {
    if (!ctrl) return '';
    const name = this.translate.instant(col.label);
    if (ctrl.hasError('required')) {
      return this.translate.instant('msg.blank', { name });
    }
    if (ctrl.hasError('minlength')) {
      const error = ctrl.getError('minlength');
      return this.translate.instant('msg.formMinLengthError', {
        name,
        length: error.requiredLength,
      });
    }
    return '';
  }
}
