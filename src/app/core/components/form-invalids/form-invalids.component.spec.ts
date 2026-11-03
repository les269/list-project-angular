import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required, validate } from '@angular/forms/signals';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormInvalid } from '../../model/form-invalids.model';
import { FormInvalidsComponent } from './form-invalids.component';

@Component({
  imports: [FormInvalidsComponent],
  template:
    '<app-form-invalids [control]="form.name" [formAlerts]="custom()" />',
})
class TestHost {
  readonly model = signal({ name: '' });
  readonly custom = signal<readonly FormInvalid[] | undefined>(undefined);
  readonly form = form(this.model, p => {
    required(p.name);
    validate(p.name, ({ value }) =>
      value() === 'taken'
        ? { kind: 'unavailable', message: 'test.unavailable' }
        : undefined
    );
  });
}

async function setup() {
  await TestBed.configureTestingModule({
    imports: [TestHost, TranslateModule.forRoot()],
  }).compileComponents();
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('zh-tw', {
    formField: { validation: { required: '請填寫必填欄位' } },
    test: { unavailable: '此名稱已被使用' },
  });
  translate.use('zh-tw');
  const fixture = TestBed.createComponent(TestHost);
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance };
}

describe('FormInvalidsComponent', () => {
  it('欄位 touched 後自動顯示驗證訊息，修正後清除', async () => {
    const { fixture, host } = await setup();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    host.form.name().markAsTouched();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('請填寫必填欄位');
    host.form.name().value.set('valid');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
  });

  it('自動模式優先使用 validator 提供的翻譯訊息', async () => {
    const { fixture, host } = await setup();
    host.form.name().value.set('taken');
    host.form.name().markAsTouched();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('此名稱已被使用');
  });

  it('既有 formAlerts 保留文案、順序與 icon，不再次翻譯', async () => {
    const { fixture, host } = await setup();
    host.custom.set([
      { errorId: 'required', msg: '自訂 {{name}}' },
      { errorId: 'required', msg: '第二則文案' },
    ]);
    host.form.name().markAsTouched();
    await fixture.whenStable();
    const alerts = fixture.nativeElement.querySelectorAll(
      '[role=alert]'
    ) as NodeListOf<HTMLElement>;
    expect(alerts).toHaveLength(2);
    expect(alerts[0].textContent).toContain('自訂 {{name}}');
    expect(alerts[1].textContent).toContain('第二則文案');
    expect(alerts[0].querySelector('mat-icon')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('請填寫必填欄位');
  });

  it('明確提供空白清單或未符合的 errorId 時保留既有篩選行為', async () => {
    const { fixture, host } = await setup();
    host.form.name().markAsTouched();
    host.custom.set([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    host.custom.set([{ errorId: 'unavailable', msg: '不應顯示' }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    host.custom.set(undefined);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('請填寫必填欄位');
  });
});
