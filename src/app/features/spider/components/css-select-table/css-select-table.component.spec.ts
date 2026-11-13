import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { CssSelect } from '../../model';
import { createCssSelect } from '../../util/css-select';
import { CssSelectTableComponent } from './css-select-table.component';

@Component({
  imports: [CssSelectTableComponent],
  template: `<app-css-select-table [fields]="form.rows" />`,
})
class TestHost {
  readonly model = signal({ rows: [] as CssSelect[] });
  readonly form = form(this.model);
}

it('CssSelect 直接顯示表單資料，補齊欄位後可編輯、新增與重新載入', async () => {
  await TestBed.configureTestingModule({
    imports: [TestHost],
    providers: [
      provideTranslateService(),
      { provide: SelectTableService, useValue: {} },
      {
        provide: ReplaceValueMapService,
        useValue: { getNameList: () => of([]) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(TestHost);
  const host = fixture.componentInstance;
  host.form.rows().reset([createCssSelect({ key: 'loaded', value: '.item' })]);
  await fixture.whenStable();
  const table: GenericTableComponent = fixture.debugElement.query(
    By.directive(GenericTableComponent)
  ).componentInstance;
  expect(table.rows()).toHaveLength(1);
  expect(host.form.rows[0].convertToArray().value()).toBe(false);
  expect(host.form.rows[0].attr().value()).toBe('');
  host.form.rows[0].key().value.set('edited');
  table.onAdd();
  await fixture.whenStable();
  expect(table.rows()).toHaveLength(2);
  expect(host.form.rows[0].key().value()).toBe('edited');
  expect(host.form.rows[1].onlyOwn().value()).toBe(false);
  host.form.rows().reset([createCssSelect({ key: 'next' })]);
  await fixture.whenStable();
  expect(table.rows()).toHaveLength(1);
  expect(host.form.rows[0].key().value()).toBe('next');
  expect(host.form.rows().dirty()).toBe(false);
});
