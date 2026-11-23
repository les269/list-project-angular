import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import {
  DEFAULT_ROW_COLOR,
  ThemeHeaderType,
  ThemeItemType,
} from '../../models';
import { SearchBookmarkService } from '../../services/search-bookmark.service';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { ThemeOtherSettingComponent } from './theme-other-setting.component';

describe('ThemeOtherSettingComponent 設定欄位', () => {
  async function setup(type = ThemeHeaderType.imageList) {
    const selector = {
      selectSingleScrapy: vi.fn(() => of({ name: 'selected-spider' })),
    };
    await TestBed.configureTestingModule({
      imports: [ThemeOtherSettingComponent],
      providers: [
        provideTranslateService(),
        { provide: ScrapyService, useValue: { getAllConfig: () => of([]) } },
        { provide: SelectTableService, useValue: selector },
        {
          provide: SearchBookmarkService,
          useValue: {
            getAll: () => of([{ id: 'shared-search', name: '共用搜尋紀錄' }]),
          },
        },
      ],
    })
      .overrideComponent(ThemeOtherSettingComponent, {
        remove: { imports: [ThemeItemManageComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-test', {
      otherSetting: { listPageSizeMin: '每頁顯示數量至少為 1' },
    });
    translate.use('zh-test');
    const fixture = TestBed.createComponent(ThemeOtherSettingComponent);
    fixture.componentRef.setInput('themeHeaderType', type);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    return { fixture, page, component: fixture.componentInstance, selector };
  }

  it('共用數字欄位保留最小值驗證並顯示錯誤訊息', async () => {
    const { fixture, page, component } = await setup();
    const size = page.querySelector<HTMLInputElement>('input[type="number"]')!;
    size.value = '0';
    size.dispatchEvent(new Event('input'));
    size.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(component.listPageSize().invalid()).toBe(true);
    expect(page.textContent).toContain('每頁顯示數量至少為 1');
    size.value = '1';
    size.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.listPageSize().valid()).toBe(true);
  });

  it.each([ThemeHeaderType.table, ThemeHeaderType.imageList])(
    '%s 可選擇及清除搜尋書籤，舊資料載入時回復空值',
    async type => {
      const { fixture, page, component } = await setup(type);
      const select = page.querySelector<HTMLSelectElement>(
        'app-signal-field select'
      )!;
      expect(select.textContent).toContain('共用搜尋紀錄');
      select.value = 'shared-search';
      select.dispatchEvent(new Event('input'));
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      expect(component.formModel().json.searchBookmarkId).toBe('shared-search');
      select.value = '';
      select.dispatchEvent(new Event('input'));
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      expect(component.formModel().json.searchBookmarkId).toBe('');

      fixture.componentRef.setInput('otherSettingItem', {
        type: ThemeItemType.OTHERSETTING,
        itemId: 'existing',
        description: '',
        json: { searchBookmarkId: 'missing-bookmark' },
      });
      await fixture.whenStable();
      expect(select.value).toBe('missing-bookmark');
      fixture.componentRef.setInput('otherSettingItem', {
        type: ThemeItemType.OTHERSETTING,
        itemId: 'legacy',
        description: '',
        json: {},
      });
      await fixture.whenStable();
      expect(component.formModel().json.searchBookmarkId).toBe('');
      expect(select.value).toBe('');
    }
  );

  it('快速刷新保留爬蟲選擇、移除、參數切換與條件驗證', async () => {
    const { fixture, page, component, selector } = await setup();
    const enabled = page.querySelector<HTMLInputElement>(
      '.quick-refresh input[type="checkbox"]'
    )!;
    expect(page.querySelector('.refresh-fields')).toBeNull();
    enabled.click();
    await fixture.whenStable();
    expect(component.useQuickRefresh().value()).toBe(true);
    expect(component.useSpiderControl().invalid()).toBe(true);
    page
      .querySelector<HTMLButtonElement>('.spider-selection .setting-button')!
      .click();
    await fixture.whenStable();
    expect(selector.selectSingleScrapy).toHaveBeenCalledTimes(1);
    expect(component.useSpiderControl().value()).toBe('selected-spider');

    const value = page.querySelector<HTMLInputElement>(
      '.refresh-fields app-signal-field input'
    )!;
    value.value = '  id,name  ';
    value.dispatchEvent(new Event('input'));
    value.dispatchEvent(new Event('blur'));
    page
      .querySelector<HTMLInputElement>('.refresh-types input[type="radio"]')!
      .click();
    await fixture.whenStable();
    expect(component.quickRefresh().value()).toBe('id,name');
    expect(component.quickRefreshType().value()).toBe(
      component.eQuickRefreshType.params
    );
    expect(component.group()().valid()).toBe(true);

    page
      .querySelector<HTMLButtonElement>('.spider-selection mat-chip button')!
      .click();
    await fixture.whenStable();
    expect(component.useSpiderControl().value()).toBe('');
    expect(component.useSpiderControl().invalid()).toBe(true);
    enabled.click();
    await fixture.whenStable();
    expect(page.querySelector('.refresh-fields')).toBeNull();
    expect(component.group()().valid()).toBe(true);
    expect(component.quickRefresh().value()).toBe('id,name');
  });

  it('Table 模式保留顏色重設與重複資料按鈕設定', async () => {
    const { fixture, page, component } = await setup(ThemeHeaderType.table);
    expect(page.querySelector('.quick-refresh')).toBeNull();
    component.rowColor().value.set(['#123456']);
    page.querySelector<HTMLButtonElement>('.color-reset')!.click();
    await fixture.whenStable();
    expect(component.rowColor().value()).toEqual(DEFAULT_ROW_COLOR);
    page
      .querySelector<HTMLInputElement>(
        '.table-settings input[type="checkbox"]'
      )!
      .click();
    await fixture.whenStable();
    expect(component.showDuplicate().value()).toBe(true);
  });
});
