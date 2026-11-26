import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import { JsonDataFieldComponent } from './json-data-field.component';

async function setup(kind: 'object' | 'array', value: unknown) {
  TestBed.configureTestingModule({
    imports: [JsonDataFieldComponent],
    providers: [provideTranslateService()],
  });
  const fixture = TestBed.createComponent(JsonDataFieldComponent);
  fixture.componentRef.setInput('kind', kind);
  fixture.componentRef.setInput('label', 'Details');
  fixture.componentRef.setInput('value', value);
  await fixture.whenStable();
  const editor = fixture.debugElement.query(
    By.directive(SignalCodeEditorComponent)
  ).componentInstance as SignalCodeEditorComponent;
  return { fixture, component: fixture.componentInstance, editor };
}

it('保留無效草稿與最後有效值，修正後輸出物件並可格式化', async () => {
  const initial = { nested: { items: [1, true, null] } };
  const { fixture, component, editor } = await setup('object', initial);
  editor.value.set('{');
  await fixture.whenStable();
  expect(component.invalid()).toBe(true);
  expect(component.draft()).toBe('{');
  expect(component.value()).toEqual(initial);
  expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  editor.value.set('{ "nested": {"items":[{"id":1},null]} }');
  await fixture.whenStable();
  expect(component.invalid()).toBe(false);
  expect(component.value()).toEqual({ nested: { items: [{ id: 1 }, null] } });
  expect(component.draft()).toBe('{ "nested": {"items":[{"id":1},null]} }');
  fixture.nativeElement.querySelector('button').click();
  await fixture.whenStable();
  expect(component.draft()).toBe(JSON.stringify(component.value(), null, 2));
  expect(initial).toEqual({ nested: { items: [1, true, null] } });
});

it.each(['[]', 'null', '1', '"text"', 'true'])(
  '物件欄位拒絕根型別不符：%s',
  async text => {
    const { fixture, component, editor } = await setup('object', {});
    editor.value.set(text);
    await fixture.whenStable();
    expect(component.invalid()).toBe(true);
    expect(component.value()).toEqual({});
    expect(component.draft()).toBe(text);
  }
);

it('陣列允許巢狀物件與混合值，拒絕物件並可由清除操作重設', async () => {
  const { fixture, component, editor } = await setup('array', []);
  editor.value.set('[{"children":[1]},"text",true,null]');
  await fixture.whenStable();
  expect(component.value()).toEqual([{ children: [1] }, 'text', true, null]);
  editor.value.set('{}');
  await fixture.whenStable();
  expect(component.invalid()).toBe(true);
  fixture.componentRef.setInput('value', []);
  fixture.componentRef.setInput('resetVersion', 1);
  await fixture.whenStable();
  expect(component.invalid()).toBe(false);
  expect(component.draft()).toBe('[]');
});

it('外部查詢回填更新編輯器；正式值未變時也能清除無效草稿', async () => {
  const { fixture, component, editor } = await setup('object', {});
  editor.value.set('{');
  await fixture.whenStable();
  fixture.componentRef.setInput('resetVersion', 1);
  await fixture.whenStable();
  expect(component.draft()).toBe('{}');
  fixture.componentRef.setInput('value', { loaded: [1, 2] });
  await fixture.whenStable();
  expect(JSON.parse(editor.value())).toEqual({ loaded: [1, 2] });
});
