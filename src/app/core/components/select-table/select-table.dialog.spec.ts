import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { BaseSelectTableData } from '../../model';
import { SelectTableDialog } from './select-table.dialog';

type Row = { name: string };

async function setup(options: Partial<BaseSelectTableData<Row>> = {}) {
  const data: BaseSelectTableData<Row> = {
    displayedColumns: ['name'],
    labels: ['g.name'],
    dataSource: [{ name: 'alpha' }, { name: 'beta' }],
    selectType: 'single',
    enableFilter: true,
    ...options,
  };
  const dialog = { close: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SelectTableDialog],
    providers: [
      provideTranslateService(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialog },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(
    SelectTableDialog<Row, BaseSelectTableData<Row>>
  );
  await fixture.whenStable();
  const page: HTMLElement = fixture.nativeElement;
  return { fixture, page, dialog };
}

it('貼上文字會過濾、重設頁碼，無結果時顯示提示，單選回傳原資料', async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    name: `row-${index}`,
  }));
  const { fixture, page, dialog } = await setup({ dataSource: rows });
  const paginator = fixture.componentInstance.paginator()!;
  paginator.lastPage();
  await fixture.whenStable();
  expect(paginator.pageIndex).toBe(1);
  const input = page.querySelector<HTMLInputElement>('input[type="search"]')!;
  input.value = 'not-found';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  expect(paginator.pageIndex).toBe(0);
  expect(page.querySelectorAll('tr.select-row')).toHaveLength(0);
  expect(page.querySelector('.empty-row')?.textContent).toContain('g.noData');

  input.value = '  ROW-100  ';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  expect(page.querySelectorAll('tr.select-row')).toHaveLength(1);
  page.querySelector<HTMLTableRowElement>('tr.select-row')!.click();
  expect(dialog.close).toHaveBeenCalledWith(rows[100]);
});

it('多選保留預選資料，勾選其他項目後確認會回傳完整選取結果', async () => {
  const rows = [{ name: 'alpha' }, { name: 'beta' }];
  const { fixture, page, dialog } = await setup({
    dataSource: rows,
    selectType: 'multiple',
    selected: [rows[1]],
    showTitle: false,
  });
  const checkboxes = page.querySelectorAll<HTMLInputElement>(
    'tr.select-row input[type="checkbox"]'
  );
  expect(checkboxes[0].checked).toBe(true);
  checkboxes[1].click();
  await fixture.whenStable();
  page.querySelector<HTMLButtonElement>('.dialog-button-primary')!.click();
  expect(dialog.close).toHaveBeenCalledWith([rows[1], rows[0]]);
});

it('三萬筆資料首次只繪製第一頁，換頁仍可選取原資料', async () => {
  const rows = Array.from({ length: 30000 }, (_, index) => ({
    name: `row-${index}`,
  }));
  const formatName = vi.fn((value: string) => value);
  const { fixture, page, dialog } = await setup({
    dataSource: rows,
    columnFormats: { name: formatName },
  });

  expect(page.querySelectorAll('tr.select-row')).toHaveLength(100);
  expect(formatName).toHaveBeenCalled();
  const firstPageNames = new Set(rows.slice(0, 100).map(row => row.name));
  expect(
    formatName.mock.calls.every(([value]) => firstPageNames.has(value))
  ).toBe(true);

  fixture.componentInstance.paginator()!.lastPage();
  await fixture.whenStable();
  expect(page.querySelectorAll('tr.select-row')).toHaveLength(100);
  page.querySelector<HTMLTableRowElement>('tr.select-row')!.click();
  expect(dialog.close).toHaveBeenCalledWith(rows[29900]);
});
