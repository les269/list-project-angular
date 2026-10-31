import { CodeEditor } from '@acrodata/code-editor';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, readonly } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { SignalCodeEditorComponent } from './signal-code-editor.component';

@Component({
  imports: [SignalCodeEditorComponent, FormField],
  template: `<app-signal-code-editor [formField]="field" />`,
})
class TestHost {
  readonly value = signal('initial');
  readonly isDisabled = signal(true);
  readonly isReadonly = signal(false);
  readonly field = form(this.value, p => {
    disabled(p, { when: () => this.isDisabled() });
    readonly(p, { when: () => this.isReadonly() });
  });
}

it('真正的 CodeEditor 能初始化、載入表單與切換停用狀態，不呼叫 CVA', async () => {
  const cva = vi.spyOn(CodeEditor.prototype, 'setDisabledState');
  await TestBed.configureTestingModule({
    imports: [TestHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(TestHost);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  const editor: CodeEditor = fixture.debugElement.query(
    By.directive(CodeEditor)
  ).componentInstance;
  expect(editor.view.state.doc.toString()).toBe('initial');
  expect(editor.disabled).toBe(true);
  component.field().reset('loaded');
  component.isDisabled.set(false);
  await fixture.whenStable();
  expect(editor.view.state.doc.toString()).toBe('loaded');
  expect(editor.disabled).toBe(false);
  component.isReadonly.set(true);
  await fixture.whenStable();
  expect(editor.view.state.readOnly).toBe(true);
  component.isReadonly.set(false);
  await fixture.whenStable();
  editor.view.dispatch({
    changes: { from: 0, to: editor.view.state.doc.length, insert: 'edited' },
  });
  await fixture.whenStable();
  expect(component.value()).toBe('edited');
  expect(cva).not.toHaveBeenCalled();
});
