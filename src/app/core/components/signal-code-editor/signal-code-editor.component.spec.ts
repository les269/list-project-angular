import { CodeEditor } from '@acrodata/code-editor';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, readonly } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { redo, undo } from '@codemirror/commands';
import { SignalCodeEditorComponent } from './signal-code-editor.component';

const addedRangeMethods: string[] = [];
beforeAll(() => {
  // jsdom 沒有文字範圍的幾何 API；此處只驗證文件、游標與表單同步。
  const geometry = {
    getClientRects: () => [],
    getBoundingClientRect: () => new DOMRect(),
  };
  for (const [name, value] of Object.entries(geometry)) {
    if (!(name in Range.prototype)) {
      Object.defineProperty(Range.prototype, name, {
        configurable: true,
        value,
      });
      addedRangeMethods.push(name);
    }
  }
});
afterAll(() => {
  for (const name of addedRangeMethods)
    Reflect.deleteProperty(Range.prototype, name);
});

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

it('連續編輯多行 JSON 時保留游標與復原紀錄，並能由表單重設內容', async () => {
  await TestBed.configureTestingModule({
    imports: [TestHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(TestHost);
  const host = fixture.componentInstance;
  const initial = '{\n  "id": 1\n}';
  host.field().reset(initial);
  host.isDisabled.set(false);
  await fixture.whenStable();
  const editor: CodeEditor = fixture.debugElement.query(
    By.directive(CodeEditor)
  ).componentInstance;
  const view = editor.view;
  let cursor = initial.indexOf('1');
  for (const character of '23') {
    view.dispatch({
      changes: { from: cursor, insert: character },
      selection: { anchor: ++cursor },
      userEvent: 'input.type',
    });
    await fixture.whenStable();
    expect(view.state.selection.main.head).toBe(cursor);
    expect(host.value()).toBe(view.state.doc.toString());
  }
  expect(host.value()).toBe('{\n  "id": 231\n}');
  expect(undo(view)).toBe(true);
  await fixture.whenStable();
  expect(host.value()).toBe(initial);
  expect(redo(view)).toBe(true);
  await fixture.whenStable();
  expect(host.value()).toBe('{\n  "id": 231\n}');
  host.field().reset(initial);
  await fixture.whenStable();
  expect(view.state.doc.toString()).toBe(initial);
});

it('唯讀回應內容可由外部更新及清空', async () => {
  await TestBed.configureTestingModule({
    imports: [SignalCodeEditorComponent],
  }).compileComponents();
  const fixture = TestBed.createComponent(SignalCodeEditorComponent);
  fixture.componentRef.setInput('readonly', true);
  fixture.componentRef.setInput('value', '{"status":"initial"}');
  await fixture.whenStable();
  const editor: CodeEditor = fixture.debugElement.query(
    By.directive(CodeEditor)
  ).componentInstance;
  expect(editor.view.state.doc.toString()).toBe('{"status":"initial"}');
  expect(editor.view.state.readOnly).toBe(true);
  fixture.componentRef.setInput('value', '{"status":"updated"}');
  await fixture.whenStable();
  expect(editor.view.state.doc.toString()).toBe('{"status":"updated"}');
  fixture.componentRef.setInput('value', '');
  await fixture.whenStable();
  expect(editor.view.state.doc.toString()).toBe('');
});
