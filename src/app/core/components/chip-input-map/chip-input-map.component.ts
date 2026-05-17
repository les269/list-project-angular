import { Component, forwardRef, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ChipsMapValue } from '../../model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-chip-input-map',
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './chip-input-map.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputMapComponent),
      multi: true,
    },
  ],
})
export class ChipInputMapComponent {
  readonly translateService = inject(TranslateService);
  readonly chipList = model<ChipsMapValue[]>([]);

  readonly type = signal<'add' | 'edit'>('add');
  readonly overlayOpen = signal(false);
  readonly draftKey = signal('');
  readonly draftValue = signal('');
  readonly errorMessage = signal('');
  readonly activeOrigin = signal<CdkOverlayOrigin | undefined>(undefined);

  addChip(origin: CdkOverlayOrigin): void {
    this.type.set('add');
    this.activeOrigin.set(origin);
    this.overlayOpen.set(true);
  }

  editChip(item: ChipsMapValue, origin: CdkOverlayOrigin): void {
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

    this.chipList.update(list => [...list, { key, value }]);
    this.onChange(this.chipList());
    this.closeOverlay();
  }

  onUpdate(): void {
    const key = this.draftKey().trim();
    const value = this.draftValue().trim();
    if (!key || !value) {
      this.errorMessage.set(
        this.translateService.instant('msg.keyAndValueRequired')
      );
      return;
    }
    this.chipList.update(list => [
      ...list.map(item => (item.key === key ? { key, value } : item)),
    ]);
    this.onChange(this.chipList());
    this.closeOverlay();
  }

  removeChip(index: number): void {
    this.chipList.update(list => {
      const next = [...list];
      next.splice(index, 1);
      return next;
    });
    this.onChange(this.chipList());
  }

  private hasKey(key: string): boolean {
    return this.chipList().some(item => item.key === key);
  }

  private resetDraft(): void {
    this.draftKey.set('');
    this.draftValue.set('');
    this.errorMessage.set('');
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: ChipsMapValue[] | null): void {
    this.chipList.set(value || []);
    this.onChange(this.chipList());
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handle disabled state if needed
  }
}
