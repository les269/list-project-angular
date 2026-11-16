import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ThemeItemType } from '../../models';
import { ThemeItemMapService, ThemeItemService } from '../../services';
import { ThemeItemManageComponent } from './theme-item-manage.component';

describe('ThemeItemManageComponent operations', () => {
  async function setup() {
    const service = {
      getThemeItem: vi.fn(() => of(undefined)),
      updateThemeItem: vi.fn(() => of(undefined)),
      deleteThemeItem: vi.fn(() => of(undefined)),
    };
    const messages = { openI18N: vi.fn(() => of(true)) };
    const maps = {
      itemMapInUse: () => of(false),
      deleteItemMap: vi.fn(() => of(undefined)),
      updateItemMap: vi.fn(() => of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [ThemeItemManageComponent],
      providers: [
        provideTranslateService(),
        { provide: ThemeItemService, useValue: service },
        {
          provide: ThemeItemMapService,
          useValue: maps,
        },
        { provide: MessageBoxService, useValue: messages },
        { provide: SelectTableService, useValue: {} },
        {
          provide: SnackbarService,
          useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
        },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
    const model = signal({
      type: ThemeItemType.CUSTOM,
      itemId: '',
      description: '',
      json: [{ key: 'kept' }],
    });
    const fields = TestBed.runInInjectionContext(() =>
      form(model, p => required(p.itemId))
    );
    const fixture = TestBed.createComponent(ThemeItemManageComponent);
    fixture.componentRef.setInput('form', fields);

    fixture.componentRef.setInput('resetValue', {
      type: ThemeItemType.CUSTOM,
      itemId: '',
      description: '',
      json: [],
    });
    await fixture.whenStable();
    return {
      fixture,
      component: fixture.componentInstance,
      service,
      messages,
      model,
      fields,
      maps,
    };
  }

  it('validates before checking whether the ID exists', async () => {
    const { component, service, fields } = await setup();
    component.addItem();
    expect(service.getThemeItem).not.toHaveBeenCalled();
    expect(fields().touched()).toBe(true);
    expect(component.isProcessing()).toBe(false);
  });

  it('blocks duplicate saving and clearing while a request is pending, then unlocks on error', async () => {
    const { fixture, component, service, messages, model } = await setup();
    model.update(value => ({ ...value, itemId: 'test' }));
    const pending = new Subject<undefined>();
    service.updateThemeItem.mockReturnValue(pending);
    component.addItem();
    component.saveItem();
    component.onClear();
    await fixture.whenStable();
    expect(service.updateThemeItem).toHaveBeenCalledTimes(1);
    expect(messages.openI18N).not.toHaveBeenCalled();
    expect(component.isProcessing()).toBe(true);
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].every(
        (button: HTMLButtonElement) => button.disabled
      )
    ).toBe(true);
    pending.error(new Error('Save failed'));
    expect(component.isProcessing()).toBe(false);
  });

  it('刪除後保留 JSON 資料', async () => {
    const { component, model } = await setup();
    model.update(value => ({
      ...value,
      itemId: 'test',
      description: 'Description',
    }));
    const originalJson = model().json;
    component.deleteItem();
    expect(model().itemId).toBe('');
    expect(model().description).toBe('');
    expect(model().json).toBe(originalJson);
    expect(component.isProcessing()).toBe(false);
  });

  it('已綁定項目保留保存與解除綁定，解除後才顯示刪除', async () => {
    const { fixture, component, model, maps } = await setup();
    model.update(value => ({ ...value, itemId: 'bound' }));
    fixture.componentRef.setInput('headerId', 'header');
    fixture.componentRef.setInput('defaultBinding', true);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const labels = () =>
      [...page.querySelectorAll('button')].map(button =>
        button.textContent?.trim()
      );
    expect(labels()).toContain('g.save');
    expect(labels()).toContain('g.unbind');
    expect(labels()).not.toContain('g.delete');
    page.querySelectorAll('button').forEach(button => {
      if (button.textContent?.trim() === 'g.unbind') button.click();
    });
    await fixture.whenStable();
    expect(maps.deleteItemMap).toHaveBeenCalledWith(
      ThemeItemType.CUSTOM,
      'bound',
      'header'
    );
    expect(component.isBinding()).toBe(false);
    expect(labels()).toContain('g.bind');
    expect(labels()).toContain('g.delete');
  });
});
