import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';
import { TrimOnBlurDirective } from './util.directive';

@Component({
  standalone: true,
  imports: [FormField, TrimOnBlurDirective],
  template: `
    <input [formField]="form.id" trimOnBlur />
    @if (form.id().touched() && form.id().invalid()) {
      <span class="validation-error">Required</span>
    }
  `,
})
class SignalFormHostComponent {
  readonly model = signal({ id: '' });
  readonly form = form(this.model, path => required(path.id));
}

describe('TrimOnBlurDirective', () => {
  it('updates a signal form when trimming makes a touched field invalid', async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SignalFormHostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = '   ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(fixture.componentInstance.form.id().value()).toBe('');
    expect(fixture.componentInstance.form.id().touched()).toBe(true);
    expect(fixture.componentInstance.form.id().invalid()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.validation-error')
    ).not.toBeNull();
  });
});
