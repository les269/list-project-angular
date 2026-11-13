import {
  CdkDrag,
  CDK_DRAG_PARENT,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { FormField, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
import { TableDragPreviewDirective } from './table-drag-preview.directive';

@Component({
  selector: 'app-generic-table',
  // 表格的 cell template 透過 DOM 尋找所屬列，避免 handle 註冊到外層卡片。
  providers: [{ provide: CDK_DRAG_PARENT, useValue: null }],
  imports: [
    TranslatePipe,
    CommonModule,
    MatTableModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    TableDragPreviewDirective,
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
  readonly customColTmpls =
    input<Record<string, TemplateRef<GenericTableCellContext>>>();
  readonly expandedTmpl = input<TemplateRef<GenericTableRowContext>>();
  /** 新增、刪除或排序完成後，通知呼叫端同步相關資料。 */
  readonly rowsChange = output<void>();
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

  private updateRows(update: (rows: GenericTableRow[]) => GenericTableRow[]) {
    const state = this.fields()();
    if (state.disabled()) return;
    state.value.update(rows =>
      update(rows).map((row, index) =>
        row.seq === index + 1 ? row : { ...row, seq: index + 1 }
      )
    );
    state.markAsDirty();
    this.rowsChange.emit();
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
