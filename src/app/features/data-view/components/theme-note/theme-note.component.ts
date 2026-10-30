import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-theme-note',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    NgxEditorModule,
    MatIcon,
  ],
  templateUrl: './theme-note.component.html',
  styleUrl: './theme-note.component.scss',
})
export class ThemeNoteComponent implements OnInit, OnDestroy {
  readonly dialogRef = inject(MatDialogRef<ThemeNoteComponent>);
  readonly data = inject<{
    value: string;
    title: string;
    disabled: boolean;
    save: (text: string) => void;
  }>(MAT_DIALOG_DATA);
  readonly valueModel = signal(this.data.value);
  readonly valueForm = form(this.valueModel, p => {
    disabled(p, { when: () => this.disabledModel() });
  });
  get value() {
    return this.valueModel();
  }
  set value(value) {
    this.valueModel.set(value);
  }
  readonly disabledModel = signal(this.data.disabled);
  readonly disabledForm = form(this.disabledModel);
  get disabled() {
    return this.disabledModel();
  }
  set disabled(value) {
    this.disabledModel.set(value);
  }
  editor: Editor = new Editor({ history: true });
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['text_color', 'background_color'],
    ['link', 'image'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  ngOnInit(): void {
    this.editor.setContent(this.value);
  }
  onChange(html: string) {
    this.value = html;
  }
  onOK() {
    this.dialogRef.close(this.value === '<p></p>' ? '' : this.value);
  }
  onSave() {
    this.data.save(this.value === '<p></p>' ? '' : this.value);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
