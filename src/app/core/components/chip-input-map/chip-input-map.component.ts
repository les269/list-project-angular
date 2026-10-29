import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject, input, model, output, signal } from '@angular/core';
import {
  FormField,
  FormValueControl,
  disabled,
  form,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChipsMapValue } from '../../model';

@Component({
  selector: 'app-chip-input-map',
  host: { '(focusout)': 'touch.emit()' },

  imports: [
    FormField,
    CommonModule,
    OverlayModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './chip-input-map.component.html',
})
export class ChipInputMapComponent implements FormValueControl<
  ChipsMapValue[]
> {
  readonly translateService = inject(TranslateService);
  readonly value = model<ChipsMapValue[]>([]);
  readonly disabled = input(false);
  readonly touch = output<void>();

  readonly type = signal<'add' | 'edit'>('add');
  readonly overlayOpen = signal(false);
  readonly draftKey = signal('');
  readonly draftValue = signal('');
  readonly errorMessage = signal('');
  readonly activeOrigin = signal<CdkOverlayOrigin | undefined>(undefined);

  readonly draftKeyForm = form(this.draftKey, p => {
    disabled(p, { when: () => this.type() === 'edit' });
  });

  readonly draftValueForm = form(this.draftValue);

  addChip(origin: CdkOverlayOrigin): void {
    if (this.disabled()) return;
    this.type.set('add');
    this.activeOrigin.set(origin);
    this.overlayOpen.set(true);
  }

  editChip(item: ChipsMapValue, origin: CdkOverlayOrigin): void {
    if (this.disabled()) return;
    this.type.set('edit');
    this.draftKey.set(item.key);
    this.draftValue.set(item.value);
    this.activeOrigin.set(origin);
    this.overlayOpen.set(true);
    this.errorMessage.set('');
  }

  closeOverlay(): void {
    this.overlayOpen.set(false);
    this.resetDraft();
  }

  onAdd(): void {
    if (this.disabled()) return;
    const key = this.draftKey().trim();
    const value = this.draftValue().trim();

    if (!key || !value) {
      this.errorMessage.set(
        this.translateService.instant('msg.keyAndValueRequired')
      );
      return;
    }

    if (this.hasKey(key)) {
      this.errorMessage.set(
        this.translateService.instant('msg.keyAlreadyExists')
      );
      return;
    }

    this.touch.emit();
    this.value.update(list => [...list, { key, value }]);
    this.closeOverlay();
  }

  onUpdate(): void {
    if (this.disabled()) return;
    const key = this.draftKey().trim();
    const value = this.draftValue().trim();
    if (!key || !value) {
      this.errorMessage.set(
        this.translateService.instant('msg.keyAndValueRequired')
      );
      return;
    }
    const current = this.value().find(item => item.key === key);
    if (!current || current.value === value) {
      this.touch.emit();
      this.closeOverlay();
      return;
    }
    this.touch.emit();
    this.value.update(list =>
      list.map(item => (item.key === key ? { key, value } : item))
    );
    this.closeOverlay();
  }

  removeChip(index: number): void {
    if (this.disabled()) return;
    this.touch.emit();
    this.value.update(list => {
      const next = [...list];
      next.splice(index, 1);
      return next;
    });
  }

  private hasKey(key: string): boolean {
    return this.value().some(item => item.key === key);
  }

  private resetDraft(): void {
    this.draftKey.set('');
    this.draftValue.set('');
    this.errorMessage.set('');
  }
}
