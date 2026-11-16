import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { EditMode } from '../../../../core/model/global.model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { ThemeCustomTableComponent } from '../../components/theme-custom-table/theme-custom-table.component';
import { ThemeDatasetTableComponent } from '../../components/theme-dataset-table/theme-dataset-table.component';
import { ThemeImageComponent } from '../../components/theme-image/theme-image.component';
import { ThemeLabelTableComponent } from '../../components/theme-label-table/theme-label-table.component';
import { ThemeOtherSettingComponent } from '../../components/theme-other-setting/theme-other-setting.component';
import { ThemeTagTableComponent } from '../../components/theme-tag-table/theme-tag-table.component';
import { ThemeTopCustomTableComponent } from '../../components/theme-top-custom-table/theme-top-custom-table.component';
import { ThemeItemService } from '../../services';
import { ThemeService } from '../../services/theme.service';
import { ThemeEditComponent } from './theme-edit.component';

describe('ThemeEditComponent saving', () => {
  async function setup() {
    const service = {
      existTheme: vi.fn(() => of(true)),
      updateTheme: vi.fn(() => of(undefined)),
    };
    const items = { getItemsByHeaderId: vi.fn(() => of([])) };
    await TestBed.configureTestingModule({
      imports: [ThemeEditComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: ThemeService, useValue: service },
        { provide: ThemeItemService, useValue: items },
        { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
        { provide: LayoutStore, useValue: { loadThemeList: vi.fn() } },
      ],
    })
      .overrideComponent(ThemeEditComponent, {
        remove: {
          imports: [
            ThemeCustomTableComponent,
            ThemeDatasetTableComponent,
            ThemeImageComponent,
            ThemeLabelTableComponent,
            ThemeOtherSettingComponent,
            ThemeTagTableComponent,
            ThemeTopCustomTableComponent,
          ],
        },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh-tw', {
      msg: {
        required: '此欄位為必填',
        integer: '需要為整數',
        nonNegative: '不可為負數',
      },
    });
    translate.use('zh-tw');
    const fixture = TestBed.createComponent(ThemeEditComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.formModel.update(value => ({
      ...value,
      name: 'Test',
      version: '1',
      title: 'Test',
    }));
    return { fixture, component, service, items };
  }

  it('skips item loading without a header ID and releases saving state after a duplicate', async () => {
    const { component, service, items } = await setup();
    expect(items.getItemsByHeaderId).not.toHaveBeenCalled();
    component.update(false, 'save');
    expect(service.updateTheme).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(false);
  });

  it('blocks repeated submissions and releases saving state after success', async () => {
    const { component, service } = await setup();
    service.existTheme.mockReturnValue(of(false));
    const pending = new Subject<undefined>();
    service.updateTheme.mockReturnValue(pending);
    component.update(false, 'save');
    component.update(false, 'save');
    expect(service.existTheme).toHaveBeenCalledTimes(1);
    expect(component.isSaving()).toBe(true);
    pending.next(undefined);
    pending.complete();
    expect(component.isSaving()).toBe(false);
  });

  it('共用欄位在失焦後移除前後空白並顯示必填訊息', async () => {
    const { fixture, component } = await setup();
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const name = page.querySelector<HTMLInputElement>(
      'app-signal-field[label="themeHeader.name"] input'
    )!;
    const label = page.querySelector<HTMLLabelElement>(
      'app-signal-field[label="themeHeader.name"] label'
    )!;
    expect(label.htmlFor).toBe(name.id);

    name.value = '  Trimmed name  ';
    name.dispatchEvent(new Event('input'));
    name.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(component.formModel().name).toBe('Trimmed name');

    name.value = '   ';
    name.dispatchEvent(new Event('input'));
    name.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(page.textContent).toContain('此欄位為必填');
    expect(
      page.querySelector<HTMLButtonElement>('.form-actions button')!.disabled
    ).toBe(true);
  });

  it('順序保留整數與非負驗證訊息', async () => {
    const { fixture, component } = await setup();
    const page: HTMLElement = fixture.nativeElement;
    component.form.seq().markAsTouched();
    component.form.seq().value.set(1.5);
    await fixture.whenStable();
    expect(page.textContent).toContain('需要為整數');

    component.form.seq().value.set(-1);
    await fixture.whenStable();
    expect(page.textContent).toContain('不可為負數');

    component.form.seq().value.set(0);
    await fixture.whenStable();
    expect(component.form().valid()).toBe(true);
    expect(
      page.querySelector<HTMLButtonElement>('.form-actions button')!.disabled
    ).toBe(false);
  });

  it('編輯模式鎖定識別欄位並提供保存與提交操作', async () => {
    const { fixture, component } = await setup();
    component.status.set(EditMode.EDIT);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    for (const key of ['name', 'version', 'type']) {
      const control = page.querySelector<HTMLInputElement | HTMLSelectElement>(
        `app-signal-field[label="themeHeader.${key}"] input, app-signal-field[label="themeHeader.${key}"] select`
      )!;
      expect(control.disabled).toBe(true);
    }
    expect(
      page.querySelector<HTMLInputElement>('input[type="number"]')!.disabled
    ).toBe(false);
    expect(page.querySelectorAll('.form-actions button')).toHaveLength(2);
    expect(
      page.querySelectorAll('.form-grid app-signal-field label.require')
    ).toHaveLength(5);
  });
});
