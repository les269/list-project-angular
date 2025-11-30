import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-theme-note',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
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
    disabled: boolean;
    save: (text: string) => void;
  }>(MAT_DIALOG_DATA);
  value = this.data.value;
  disabled = this.data.disabled;
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
