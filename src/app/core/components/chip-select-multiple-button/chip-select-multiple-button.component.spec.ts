import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { of } from 'rxjs';
import { ChipSelectMultipleButtonComponent } from './chip-select-multiple-button.component';

interface Option {
  id: string | number;
  name: string;
}

@Component({
  imports: [ChipSelectMultipleButtonComponent, FormField],
  template: `<app-chip-select-multiple-button
    [formField]="field"
    valueKey="id"
    [labelKey]="label"
    [options]="options"
    [selectTable]="select" />`,
})
class Host {
  readonly value = signal<Array<string | number>>([1, '2']);
  readonly field = form(this.value);
  readonly options = signal<Option[]>([
    { id: '1', name: 'First' },
    { id: 2, name: 'Second' },
  ]);
  result: Option[] = [];
  readonly select = vi.fn(() => of(this.result));
  readonly label = (item: Option) => item.name.toUpperCase();
  readonly chip = viewChild.required(ChipSelectMultipleButtonComponent);
}

describe('ChipSelectMultipleButtonComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Host],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance };
  }

  it('preserves the original IDs and pristine state when confirming the same selection', async () => {
    const { fixture, host } = await setup();
    const original = host.value();
    host.result = [
      { id: '1', name: 'Dialog first' },
      { id: 2, name: 'Dialog second' },
    ];
    host.chip().openSelectTable();
    await fixture.whenStable();
    expect(host.select).toHaveBeenCalledWith(host.options());
    expect(host.value()).toBe(original);
    expect(host.field().dirty()).toBe(false);
    expect(host.field().touched()).toBe(true);
    expect(host.chip().displayLabel(host.chip().selectedData()[0])).toBe(
      'FIRST'
    );
  });

  it('updates the form when selection order changes and preserves returned ID types', async () => {
    const { fixture, host } = await setup();
    host.result = [
      { id: 2, name: 'Second' },
      { id: '1', name: 'First' },
    ];
    host.chip().openSelectTable();
    await fixture.whenStable();
    expect(host.value()).toEqual([2, '1']);
    expect(host.field().dirty()).toBe(true);
  });

  it('uses dialog data until options load and falls back to unknown IDs safely', async () => {
    const { fixture, host } = await setup();
    host.options.set([]);
    host.result = [{ id: 3, name: 'Dialog third' }];
    host.chip().openSelectTable();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('DIALOG THIRD');
    host.options.set([{ id: '3', name: 'Updated third' }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('UPDATED THIRD');
    host.value.set(['unknown']);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('unknown');
    host.field().reset([]);
    await fixture.whenStable();
    expect(host.chip().selectedData()).toEqual([]);
  });
});
