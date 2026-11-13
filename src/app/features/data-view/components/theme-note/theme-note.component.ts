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
import { TranslatePipe } from '@ngx-translate/core';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-theme-note',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
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
  readonly disabledModel = signal(this.data.disabled);
  readonly valueForm = form(this.valueModel, p => {
    disabled(p, { when: () => this.disabledModel() });
  });
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
    this.editor.setContent(this.valueModel());
  }
  onOK() {
    const value = this.valueModel();
    this.dialogRef.close(value === '<p></p>' ? '' : value);
  }
  onSave() {
    const value = this.valueModel();
    this.data.save(value === '<p></p>' ? '' : value);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
