import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import {
  applyEach,
  disabled,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../model/generic-table';
import { GenericTableComponent } from './generic-table.component';

type Row = { seq: number; name: string; selected: boolean; note: string };

@Component({
  imports: [GenericTableComponent, FormField, CdkDrag, CdkDragHandle],
  template: `
    <div cdkDrag>
      <span cdkDragHandle class="outer-handle">reorder</span>
      <app-generic-table
        [fields]="fields"
        [cols]="cols()"
        [displayedColumns]="displayedColumns()"
        [createRow]="createRow"
        [expandedTmpl]="detail"
        [customColTmpls]="{ custom: custom }" />
    </div>
    <ng-template #detail let-row>
      <input class="note" [formField]="row.note" />
    </ng-template>
    <ng-template #custom let-row let-col="col" let-index="index">
      <span class="custom-cell"
        >{{ row.name().value() }}:{{ col.key }}:{{ index }}</span
      >
    </ng-template>
  `,
})
class TableHost {
  readonly createRow = (data: Partial<Row> = {}): Row => ({
    seq: 0,
    name: '',
    selected: false,
    note: '',
    ...data,
  });
  readonly model = signal<Row[]>(
    ['first', 'second'].map(name => this.createRow({ name }))
  );
  readonly locked = signal(false);
  readonly lockedRadioName = signal<string | undefined>(undefined);
  readonly fields = form(this.model, p => {
    disabled(p, { when: () => this.locked() });
    applyEach(p, row => {
      required(row.name);
      disabled(row.selected, {
        when: ({ valueOf }) => valueOf(row.name) === this.lockedRadioName(),
      });
    });
  });
  readonly displayedColumns = signal(['name', 'selected']);
  readonly cols = signal<GenericTableColumn[]>([
    { key: 'name', label: 'Name', columnType: GenericColumnType.input },
    { key: 'selected', label: 'Selected', columnType: GenericColumnType.radio },
  ]);
  readonly table = viewChild.required(GenericTableComponent);
}

describe('GenericTableComponent with Signal Forms', () => {
  let fixture: ComponentFixture<TableHost>;
  let host: TableHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHost, TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(TableHost);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('直接使用父層表單資料，主列與詳細列編輯皆回寫父層 signal', async () => {
    expect(host.model().map(row => row.name)).toEqual(['first', 'second']);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input.form-control');
    input.value = 'edited';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const note: HTMLInputElement =
      fixture.nativeElement.querySelector('input.note');
    note.value = 'detail';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.model()[0]).toMatchObject({ name: 'edited', note: 'detail' });
    expect(host.fields().dirty()).toBe(true);
  });

  it('keeps values, sequence, radio exclusivity and validation correct after add, move and delete', async () => {
    host.table().onAdd();
    await fixture.whenStable();
    expect(host.fields().invalid()).toBe(true);
    host.fields[2].name().value.set('third');
    host.table().onRadioChange(2, 'selected');
    host.fields[2].name().markAsTouched();
    host
      .table()
      .drop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<any>);
    await fixture.whenStable();
    expect(host.model().map(row => row.name)).toEqual([
      'third',
      'first',
      'second',
    ]);
    expect(host.fields[0].name().touched()).toBe(true);
    expect(host.model().map(row => row.seq)).toEqual([1, 2, 3]);
    host.table().onRadioChange(1, 'selected');
    expect(host.model().map(row => row.selected)).toEqual([false, true, false]);
    host.table().onDelete(0);
    await fixture.whenStable();
    expect(host.model().map(row => row.seq)).toEqual([1, 2]);
    expect(host.fields().valid()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('input.note')).toHaveLength(
      2
    );
  });

  it('父層重設資料時同步清除互動狀態，並依 schema 停用編輯', async () => {
    host.fields[0].name().markAsTouched();
    host.table().onAdd();
    host.fields().reset([host.createRow({ name: 'replacement' })]);
    await fixture.whenStable();
    expect(host.model()).toMatchObject([
      { seq: 0, name: 'replacement', selected: false, note: '' },
    ]);
    expect(host.fields().dirty()).toBe(false);
    expect(host.fields().touched()).toBe(false);
    host.locked.set(true);
    await fixture.whenStable();
    expect(
      (
        fixture.nativeElement.querySelector(
          'input.form-control'
        ) as HTMLInputElement
      ).disabled
    ).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          'button[mat-button]'
        ) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it('registers a drag handle on each reorder icon and disables dragging with the form', async () => {
    const table = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    );
    const handles = table.queryAll(By.directive(CdkDragHandle));
    const drags = table.queryAll(By.directive(CdkDrag));
    expect(handles).toHaveLength(2);
    expect(drags).toHaveLength(2);
    for (const drag of drags) {
      expect(drag.queryAll(By.directive(CdkDragHandle))).toHaveLength(1);
      expect(drag.injector.get(CdkDrag).disabled).toBe(false);
      const handle = drag
        .query(By.directive(CdkDragHandle))
        .injector.get(CdkDragHandle);
      expect(handle['_parentDrag']).toBe(drag.injector.get(CdkDrag));
    }
    host.locked.set(true);
    await fixture.whenStable();
    expect(drags.every(drag => drag.injector.get(CdkDrag).disabled)).toBe(true);
  });

  it('preserves existing row references when adding or deleting the last row', async () => {
    host
      .fields()
      .reset([
        host.createRow({ seq: 1, name: 'first' }),
        host.createRow({ seq: 2, name: 'second' }),
      ]);
    await fixture.whenStable();
    const [first, second] = host.model();
    host.table().onAdd();
    expect(host.model()[0]).toBe(first);
    expect(host.model()[1]).toBe(second);
    host.table().onDelete(2);
    expect(host.model()[0]).toBe(first);
    expect(host.model()[1]).toBe(second);
  });

  it('marks the selected radio touched and dirty and respects disabled radio values', async () => {
    host.table().onRadioChange(0, 'selected');
    expect(host.fields[0].selected().touched()).toBe(true);
    expect(host.fields[0].selected().dirty()).toBe(true);
    host.lockedRadioName.set('first');
    host.table().onRadioChange(1, 'selected');
    expect(host.model().map(row => row.selected)).toEqual([true, false]);
    expect(host.fields[1].selected().touched()).toBe(false);
    host.lockedRadioName.set(undefined);
    host.table().onRadioChange(1, 'selected');
    expect(host.model().map(row => row.selected)).toEqual([false, true]);
    host.locked.set(true);
    host.table().onRadioChange(0, 'selected');
    expect(host.model().map(row => row.selected)).toEqual([false, true]);
    await fixture.whenStable();
  });

  it('does not overwrite non-boolean values when a radio column key is misconfigured', () => {
    host.table().onRadioChange(0, 'name');
    host.table().onRadioChange(0, 'missing');
    expect(host.model().map(row => row.name)).toEqual(['first', 'second']);
    expect(host.fields().dirty()).toBe(false);
    expect(host.fields().touched()).toBe(false);
  });

  it('renders a custom template without requiring a matching form field', async () => {
    host.cols.update(cols => [
      ...cols,
      { key: 'custom', label: 'Custom', columnType: GenericColumnType.custom },
    ]);
    host.displayedColumns.update(columns => [...columns, 'custom']);
    await fixture.whenStable();
    const cells: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.custom-cell');
    expect(Array.from(cells, cell => cell.textContent?.trim())).toEqual([
      'first:custom:0',
      'second:custom:1',
    ]);
  });

  it('preserves option elements by value and keeps widths optional', async () => {
    const options = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ];
    const column = {
      key: 'note',
      label: 'Note',
      columnType: GenericColumnType.select,
      data: options,
      dataValue: 'id',
      dataLabel: (item: { id: string; label: string }) => item.label,
      width: '180px',
    } satisfies GenericTableColumn;
    host.cols.update(cols => [...cols, column]);
    host.displayedColumns.update(columns => [...columns, 'note']);
    await fixture.whenStable();
    const option = fixture.nativeElement.querySelector('select option');
    expect(
      fixture.nativeElement.querySelector('th.mat-column-note').style.width
    ).toBe('180px');
    host.cols.update(cols =>
      cols.map(col =>
        col.key === 'note'
          ? {
              ...column,
              width: undefined,
              data: [{ id: 'a', label: 'Updated' }, { ...options[1] }],
            }
          : col
      )
    );
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('select option')).toBe(option);
    expect(option.textContent.trim()).toBe('Updated');
    expect(
      fixture.nativeElement.querySelector('th.mat-column-note').style.width
    ).toBe('auto');
    expect(
      fixture.nativeElement
        .querySelector('input.form-control')
        .getAttribute('aria-label')
    ).toContain('Name');
    expect(
      fixture.nativeElement
        .querySelector('button[mat-button]')
        .hasAttribute('aria-label')
    ).toBe(true);
  });
});
