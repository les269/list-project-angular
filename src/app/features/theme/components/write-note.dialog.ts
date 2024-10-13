import { Component, inject, model, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    NgxEditorModule,
  ],
  selector: 'app-button-input-url',
  template: `
    <h2 mat-dialog-title>{{ 'title.writeEditor' | translate }}</h2>
    <mat-dialog-content class="scrollbar-primary">
      <div>
        <ngx-editor-menu class="toolbar" [editor]="editor" [toolbar]="toolbar">
        </ngx-editor-menu>
        <ngx-editor
          [editor]="editor"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          [disabled]="false"></ngx-editor>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onNoClick()">
        {{ 'g.no' | translate }}
      </button>
      <button mat-button cdkFocusInitial [mat-dialog-close]="value">
        {{ 'g.ok' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .scrollbar-primary::-webkit-scrollbar {
      width: 10px;
    }

    .scrollbar-primary::-webkit-scrollbar-track-piece {
      background: none;
    }

    .scrollbar-primary::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.3);
    }
  `,
})
export class WriteNoteDialog implements OnInit, OnDestroy {
  readonly dialogRef = inject(MatDialogRef<WriteNoteDialog>);
  readonly data = inject<string>(MAT_DIALOG_DATA);
  value = this.data;
  editor: Editor = new Editor({ history: true });
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  ngOnInit(): void {
    this.editor.setContent(this.value);
  }
  onChange(html: string) {
    this.value = html;
  }
  onOK() {
    this.dialogRef.close(this.value);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
