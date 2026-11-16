import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, required } from '@angular/forms/signals';
import { provideTranslateService } from '@ngx-translate/core';
import { SignalFieldComponent } from './signal-field.component';

@Component({
  imports: [SignalFieldComponent],
  template: `
    <app-signal-field [field]="fields.name" label="name" />
    <app-signal-field [field]="fields.optional" label="optional" />
    <app-signal-field
      [field]="fields.conditional"
      label="conditional"
      [inline]="true" />
  `,
})
class FieldHost {
  readonly model = signal({
    name: 'filled',
    optional: '',
    conditional: 'filled',
  });
  readonly condition = signal(false);
  readonly locked = signal(false);
  readonly fields = form(this.model, p => {
    required(p.name);
    disabled(p.name, { when: () => this.locked() });
    required(p.conditional, { when: () => this.condition() });
  });
}

it('必填標示依欄位規則切換，填入值或停用後仍保留標示', async () => {
  await TestBed.configureTestingModule({
    imports: [FieldHost],
    providers: [provideTranslateService()],
  }).compileComponents();
  const fixture = TestBed.createComponent(FieldHost);
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const page: HTMLElement = fixture.nativeElement;
  const label = (name: string) =>
    page.querySelector<HTMLLabelElement>(
      `app-signal-field[label="${name}"] label`
    )!;

  expect(host.fields().valid()).toBe(true);
  expect(label('name').classList.contains('require')).toBe(true);
  expect(label('optional').classList.contains('require')).toBe(false);
  expect(label('conditional').classList.contains('require')).toBe(false);

  host.condition.set(true);
  host.locked.set(true);
  await fixture.whenStable();
  expect(host.fields().valid()).toBe(true);
  expect(
    page.querySelector<HTMLInputElement>(
      'app-signal-field[label="name"] input'
    )!.disabled
  ).toBe(true);
  expect(label('name').classList.contains('require')).toBe(true);
  expect(label('conditional').classList.contains('require')).toBe(true);

  host.condition.set(false);
  await fixture.whenStable();
  expect(label('conditional').classList.contains('require')).toBe(false);
});
