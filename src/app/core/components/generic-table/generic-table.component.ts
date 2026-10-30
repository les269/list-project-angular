import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  TemplateRef,
  untracked,
} from '@angular/core';
import { FormField, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getWidth } from '../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../shared/util/util.directive';
import {
  GenericColumnType,
  GenericTableCellContext,
  GenericTableColumn,
  GenericTableFields,
  GenericTableRow,
  GenericTableRowContext,
  GenericTableRowFactory,
  GenericTableRowField,
} from '../../model/generic-table';
import { ChipSelectButtonComponent } from '../chip-select-button/chip-select-button.component';
import { ChipSelectMultipleButtonComponent } from '../chip-select-multiple-button/chip-select-multiple-button.component';

@Component({
  selector: 'app-generic-table',
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatIcon,
    FormField,
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
  readonly translate = inject(TranslateService);
  // inputs
  readonly fields = input.required<GenericTableFields>();
  readonly cols = input.required<GenericTableColumn[]>();
  readonly displayedColumns = input.required<string[]>();
  readonly createRow = input.required<GenericTableRowFactory>();
  // TODO deprecated
  readonly initData = input<readonly object[]>();
  readonly customColTmpls =
    input<Record<string, TemplateRef<GenericTableCellContext>>>();
  readonly expandedTmpl = input<TemplateRef<GenericTableRowContext>>();
  // signals
  readonly rows = computed(() => Array.from(this.fields()));
  readonly selectOptions = computed(
    () =>
      new Map(
        this.cols()
          .filter(col => col.columnType === GenericColumnType.select)
          .map(col => [
            col.key,
            col.data.map(option => ({
              value: option[col.dataValue],
              label: col.dataLabel(option),
            })),
          ])
      )
  );
  readonly displayedColumnsWith = computed(() => [
    'seq',
    ...this.displayedColumns(),
    'other',
  ]);

  readonly eGenericColumnType = GenericColumnType;
  readonly getWidth = getWidth;

  constructor() {
    // TODO deprecated
    effect(() => {
      const data = this.initData();
      if (!data) return;
      untracked(() => {
        this.setData(data);
      });
    });
  }
  // TODO deprecated
  setData(data: readonly object[]) {
    this.fields()().reset(data.map(item => this.createRow()(item)));
  }

  private updateRows(update: (rows: GenericTableRow[]) => GenericTableRow[]) {
    const state = this.fields()();
    if (state.disabled()) return;
    state.value.update(rows =>
      update(rows).map((row, index) =>
        row.seq === index + 1 ? row : { ...row, seq: index + 1 }
      )
    );
    state.markAsDirty();
  }

  onAdd() {
    this.updateRows(rows => [...rows, this.createRow()()]);
  }

  onDelete(index: number) {
    this.updateRows(rows => rows.filter((_, i) => i !== index));
  }

  drop(event: CdkDragDrop<GenericTableRowField[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.updateRows(rows => {
      const reordered = [...rows];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
  }

  onRadioChange(rowIndex: number, key: string) {
    if (this.fields()().disabled()) return;
    const values: GenericTableRow[] = this.fields()().value();
    if (values.some(row => typeof row[key] !== 'boolean')) return;
    const rows = this.rows();
    const selectedField = rows[rowIndex]?.[key];
    if (!selectedField || selectedField().disabled()) return;
    const states = rows.map(row => row[key]());
    // 保留停用欄位的值，並維持跨列單選互斥。
    if (
      states.some(
        (state, index) =>
          state.disabled() && state.value() !== (index === rowIndex)
      )
    )
      return;

    selectedField().markAsTouched();
    for (const [index, state] of states.entries()) {
      const selected = index === rowIndex;
      if (state.value() !== selected) {
        state.value.set(selected);
        state.markAsDirty();
      }
    }
  }

  requireError(col: GenericTableColumn, errors: readonly ValidationError[]) {
    const name = this.translate.instant(col.label);
    for (const error of errors) {
      if (error.message) return error.message;
      if (error.kind === 'required') {
        return this.translate.instant('msg.blank', { name });
      }
      if (
        error.kind === 'minLength' &&
        'minLength' in error &&
        typeof error.minLength === 'number'
      ) {
        return this.translate.instant('msg.formMinLengthError', {
          name,
          length: error.minLength,
        });
      }
      const custom = col.error?.find(item => item.name === error.kind);
      if (custom) return this.translate.instant(custom.msg);
    }
    return '';
  }
}
