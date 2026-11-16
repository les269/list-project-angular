import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ReplaceValueMapService } from '../../service/replace-value-map.service';
import { ReplaceValueMapComponent } from './replace-value-map.component';

async function setup() {
  const service = {
    getByName: vi.fn(() =>
      of({ name: 'test', map: { z: 'last', a: 'first', m: 'middle' } })
    ),
    update: vi.fn(() => of(undefined)),
  };
  await TestBed.configureTestingModule({
    imports: [ReplaceValueMapComponent],
    providers: [
      provideTranslateService(),
      { provide: ReplaceValueMapService, useValue: service },
      { provide: SelectTableService, useValue: {} },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
      { provide: MessageBoxService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReplaceValueMapComponent);
  const component = fixture.componentInstance;
  await fixture.whenStable();
  const searchInput = fixture.nativeElement.querySelector(
    '#replace-map-name'
  ) as HTMLInputElement;
  searchInput.value = 'test';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  searchInput.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  );
  await fixture.whenStable();
  return { fixture, component, service };
}

it('表格可載入與編輯，儲存立即讀取最新欄位值', async () => {
  const { fixture, component, service } = await setup();
  expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(
    3
  );
  const input = fixture.nativeElement.querySelector(
    'td.mat-column-replaceValue input'
  ) as HTMLInputElement;
  input.value = 'changed';
  input.dispatchEvent(new Event('input'));
  component.update();
  expect(service.update).toHaveBeenCalledWith({
    name: 'test',
    map: { z: 'changed', a: 'first', m: 'middle' },
  });
  component.add();
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(
    4
  );
});

it('排序、分頁及篩選後，編輯與刪除仍對應原始列', async () => {
  const { fixture, component } = await setup();
  const sort = component.sort()!;
  const paginator = component.paginator()!;
  expect(component.dataSource.sort).toBe(sort);
  expect(component.dataSource.paginator).toBe(paginator);
  sort.active = 'match';
  sort.direction = 'asc';
  sort.sortChange.emit({ active: 'match', direction: 'asc' });
  paginator.pageSize = 1;
  paginator.pageIndex = 1;
  paginator.page.emit({ pageIndex: 1, pageSize: 1, length: 3 });
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    'td.mat-column-replaceValue input'
  ) as HTMLInputElement;
  expect(input.value).toBe('middle');
  input.value = 'edited';
  input.dispatchEvent(new Event('input'));
  expect(component.dataSource.data[2].replaceValue).toBe('edited');
  component.applyFilter({ target: { value: 'edited' } } as unknown as Event);
  await fixture.whenStable();
  fixture.nativeElement.querySelector('td.mat-column-other button').click();
  expect(component.dataSource.data.map(row => row.match)).toEqual(['z', 'a']);
  component.search();
  await fixture.whenStable();
  expect(component.dataSource.data[2].replaceValue).toBe('middle');
});

it('篩選輸入及清除會回到第一頁，並保留完整的編輯資料', async () => {
  const { fixture, component, service } = await setup();
  const input: HTMLInputElement = fixture.nativeElement.querySelector(
    '#replace-row-filter'
  );
  const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
    '.filter-controls button'
  );
  const paginator = component.paginator()!;
  expect(clear.disabled).toBe(true);
  paginator.pageSize = 1;
  paginator.pageIndex = 2;
  paginator.page.emit({ pageIndex: 2, pageSize: 1, length: 3 });
  await fixture.whenStable();

  input.value = ' LAST ';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  expect(component.dataSource.filteredData).toEqual([
    { match: 'z', replaceValue: 'last' },
  ]);
  expect(paginator.pageIndex).toBe(0);
  expect(clear.disabled).toBe(false);

  input.value = 'missing';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  expect(component.dataSource.filteredData).toEqual([]);
  expect(
    fixture.nativeElement.querySelector('.empty-state')?.textContent
  ).toContain('g.noData');

  clear.click();
  await fixture.whenStable();
  expect(input.value).toBe('');
  expect(clear.disabled).toBe(true);
  expect(component.dataSource.filteredData).toHaveLength(3);
  expect(component.dataSource.data).toHaveLength(3);
  expect(paginator.pageIndex).toBe(0);
  expect(service.getByName).toHaveBeenCalledTimes(1);
});
