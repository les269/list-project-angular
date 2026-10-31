import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
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
    imports: [ReplaceValueMapComponent, TranslateModule.forRoot()],
    providers: [
      { provide: ReplaceValueMapService, useValue: service },
      { provide: SelectTableService, useValue: {} },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
      { provide: MessageBoxService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReplaceValueMapComponent);
  const component = fixture.componentInstance;
  component.searchName = 'test';
  component.search();
  fixture.detectChanges();
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
  fixture.detectChanges();
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
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    'td.mat-column-replaceValue input'
  ) as HTMLInputElement;
  expect(input.value).toBe('middle');
  input.value = 'edited';
  input.dispatchEvent(new Event('input'));
  expect(component.dataSource.data[2].replaceValue).toBe('edited');
  component.applyFilter({ target: { value: 'edited' } } as unknown as Event);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.nativeElement.querySelector('td.mat-column-other button').click();
  expect(component.dataSource.data.map(row => row.match)).toEqual(['z', 'a']);
  component.search();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.dataSource.data[2].replaceValue).toBe('middle');
});
