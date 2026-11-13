import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
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
      .overrideComponent(ThemeEditComponent, { set: { template: '' } })
      .compileComponents();
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
});
