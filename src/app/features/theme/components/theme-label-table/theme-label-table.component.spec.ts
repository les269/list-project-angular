import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { ThemeHeaderType, ThemeItemType, ThemeLabelItem } from '../../models';
import { ThemeItemMapService, ThemeItemService } from '../../services';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { ThemeLabelTableComponent } from './theme-label-table.component';

describe('ThemeLabelTableComponent loading', () => {
  // 模擬舊資料未提供完整列欄位的情況。
  const storedItem = (itemId: string): ThemeLabelItem => ({
    type: ThemeItemType.LABEL,
    itemId,
    description: itemId,
    json: [{ seq: 1, byKey: itemId, label: itemId }] as ThemeLabelItem['json'],
  });

  async function setup(item?: ThemeLabelItem) {
    const service = {
      getAllItems: vi.fn(() => of([])),
      getThemeItem: vi.fn(() => of(storedItem('selected'))),
    };
    await TestBed.configureTestingModule({
      imports: [ThemeLabelTableComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ThemeItemService, useValue: service },
        { provide: ThemeItemMapService, useValue: {} },
        { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
        {
          provide: SelectTableService,
          useValue: {
            selectSingleThemeItemSummary: () => of({ itemId: 'selected' }),
          },
        },
        {
          provide: SnackbarService,
          useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
        },
        { provide: MatDialog, useValue: {} },
        {
          provide: LayoutStore,
          useValue: {
            loadThemeLabelItemList: vi.fn(),
            loadThemeLabelItemMapList: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ThemeLabelTableComponent);
    fixture.componentRef.setInput('themeHeaderType', ThemeHeaderType.table);
    if (item) fixture.componentRef.setInput('labelItem', item);
    await fixture.whenStable();
    const manager: ThemeItemManageComponent = fixture.debugElement.query(
      By.directive(ThemeItemManageComponent)
    ).componentInstance;
    const table: GenericTableComponent = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance;
    return {
      fixture,
      component: fixture.componentInstance,
      manager,
      table,
      service,
    };
  }

  it('補齊載入列的欄位，且編輯與新增不會被初始化流程覆寫', async () => {
    const item = storedItem('bound');
    const { fixture, component, table } = await setup(item);
    expect(component.fields[0].type().value()).toBe('string');
    expect(component.fields[0].visibleDatasetNameList().value()).toEqual([]);
    expect(component.form().valid()).toBe(true);

    component.fields[0].label().value.set('Edited');
    table.onAdd();
    await fixture.whenStable();
    expect(component.fields.length).toBe(2);
    expect(table.rows().length).toBe(2);
    expect(component.fields[0].label().value()).toBe('Edited');
    expect(item.json[0].label).toBe('bound');
  });

  it('讀取、清除後能再次讀取，並清除上一份資料的互動狀態', async () => {
    const { fixture, component, manager, table, service } = await setup();
    manager.openItemSelector();
    await fixture.whenStable();
    expect(component.form.itemId().value()).toBe('selected');
    expect(component.fields[0].width().value()).toBe('');

    component.fields[0].label().value.set('Edited');
    component.fields[0].label().markAsTouched();
    component.fields[0].label().markAsDirty();
    manager.onClear();
    await fixture.whenStable();
    expect(component.form.itemId().value()).toBe('');
    expect(table.rows()).toHaveLength(0);

    service.getThemeItem.mockReturnValue(of(storedItem('next')));
    manager.openItemSelector();
    await fixture.whenStable();
    expect(component.form.itemId().value()).toBe('next');
    expect(table.rows()).toHaveLength(1);
    expect(component.fields[0].label().value()).toBe('next');
    expect(component.fields[0].label().touched()).toBe(false);
    expect(component.fields[0].label().dirty()).toBe(false);
  });

  it('切換預設列只修改原預設欄位，並保留其他欄位與未變更列的狀態', async () => {
    const { fixture, component } = await setup();
    component
      .fields()
      .reset([
        component.createRow({ isDefaultKey: true }),
        component.createRow({ isDefaultKey: true }),
        component.createRow(),
      ]);
    const list = component.fields[0].visibleDatasetNameList().value();
    component.changeDefaultKey(1);
    await fixture.whenStable();
    expect(
      component
        .fields()
        .value()
        .map(row => row.isDefaultKey)
    ).toEqual([false, true, false]);
    expect(component.fields[0].isDefaultKey().dirty()).toBe(true);
    expect(component.fields[2].isDefaultKey().dirty()).toBe(false);
    expect(component.fields[0].visibleDatasetNameList().value()).toBe(list);
  });

  it('切換語言後更新重複欄位的錯誤提示', async () => {
    const { fixture, component } = await setup();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-test', {
      msg: { duplicateColumn: '重複：{{text}}' },
      themeLabel: { byKey: '欄位' },
    });
    translate.setTranslation('en-test', {
      msg: { duplicateColumn: 'Duplicate: {{text}}' },
      themeLabel: { byKey: 'Key' },
    });
    await firstValueFrom(translate.use('zh-test'));
    await fixture.whenStable();
    expect(component.formAlerts()[0].msg).toBe('重複：欄位');
    await firstValueFrom(translate.use('en-test'));
    await fixture.whenStable();
    expect(component.formAlerts()[0].msg).toBe('Duplicate: Key');
  });
});
