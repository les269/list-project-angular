import { Component, input, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { form, FormField } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { ChipInputComponent } from './chip-input.component';
import { ChipInputColorComponent } from '../chip-input-color/chip-input-color.component';
import { ChipInputMapComponent } from '../chip-input-map/chip-input-map.component';

@Component({
  imports: [FormField, ChipInputComponent, ChipInputColorComponent],
  template: `
    @if (color()) {
      <app-chip-input-color
        [formField]="field"
        [allowDuplicates]="true"
        [canUpdate]="validator()" />
    } @else {
      <app-chip-input
        [formField]="field"
        [allowDuplicates]="true"
        [canUpdate]="validator()" />
    }
  `,
})
class ChipInputHost {
  readonly color = input(false);
  readonly value = signal(['#112233', '#445566']);
  readonly field = form(this.value);
  readonly validator = signal<(value: string, index?: number) => boolean>(
    () => true
  );
}

@Component({
  imports: [FormField, ChipInputMapComponent],
  template: `<app-chip-input-map [formField]="field" />`,
})
class ChipMapHost {
  readonly value = signal([{ key: 'key', value: 'original' }]);
  readonly field = form(this.value);
  readonly chip = viewChild.required(ChipInputMapComponent);
}

describe.each([false, true])('chip input editing (color=%s)', color => {
  let fixture: ComponentFixture<ChipInputHost>;
  let host: ChipInputHost;
  let chip: ChipInputComponent | ChipInputColorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipInputHost],
    }).compileComponents();
    fixture = TestBed.createComponent(ChipInputHost);
    fixture.componentRef.setInput('color', color);
    host = fixture.componentInstance;
    await fixture.whenStable();
    chip = fixture.debugElement.query(
      By.directive(color ? ChipInputColorComponent : ChipInputComponent)
    ).componentInstance;
  });

  it('keeps the array reference and parent pristine when the edited value is unchanged', async () => {
    const original = host.value();
    chip.editChip(0, ' #112233 ');
    await fixture.whenStable();
    expect(host.value()).toBe(original);
    expect(host.field().dirty()).toBe(false);
    expect(host.field().touched()).toBe(true);
  });

  it('passes the edited index to the validator and respects rejection', async () => {
    const validator = vi.fn((value: string, index?: number) => index === 1);
    host.validator.set(validator);
    await fixture.whenStable();
    chip.editChip(0, '#abcdef');
    expect(validator).toHaveBeenCalledWith('#abcdef', 0);
    expect(host.value()[0]).toBe('#112233');
    chip.editChip(1, '#abcdef');
    await fixture.whenStable();
    expect(validator).toHaveBeenCalledWith('#abcdef', 1);
    expect(host.value()[1]).toBe('#abcdef');
    expect(host.field().dirty()).toBe(true);
  });

  it('renders duplicate values and edits or removes only the chosen occurrence', async () => {
    host.value.set(['#112233', '#112233']);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('mat-chip-row')).toHaveLength(
      2
    );
    chip.editChip(1, '#445566');
    await fixture.whenStable();
    expect(host.value()).toEqual(['#112233', '#445566']);
    chip.removeChip(0);
    await fixture.whenStable();
    expect(host.value()).toEqual(['#445566']);
    expect(fixture.nativeElement.querySelectorAll('mat-chip-row')).toHaveLength(
      1
    );
  });
});

describe('chip map unchanged edits', () => {
  it('closes the editor without changing the array or marking the parent dirty', async () => {
    await TestBed.configureTestingModule({
      imports: [ChipMapHost, TranslateModule.forRoot()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ChipMapHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const original = host.value();
    host.chip().draftKey.set('key');
    host.chip().draftValue.set(' original ');
    host.chip().onUpdate();
    await fixture.whenStable();
    expect(host.value()).toBe(original);
    expect(host.field().dirty()).toBe(false);
    expect(host.chip().draftValue()).toBe('');
    expect(host.chip().overlayOpen()).toBe(false);
  });
});
