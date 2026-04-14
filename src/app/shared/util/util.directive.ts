import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { SnackbarService } from '../../core/services/snackbar.service';
import { isNotBlank } from './helper';
import { NgControl, NgModel } from '@angular/forms';

@Directive({ selector: '[ngCopy]', standalone: true })
export class CopyDirective {
  @Input() enableCopy: boolean = true; // 新增 Input 用於控制複製功能
  @Input('ngCopy') copyValue: string = '';
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private snackbarService: SnackbarService
  ) {}
  @HostListener('click')
  onClick() {
    if (!this.enableCopy) {
      return;
    }
    const text = isNotBlank(this.copyValue)
      ? this.copyValue
      : this.el.nativeElement.innerText;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = this.renderer.createElement('textarea');
      this.renderer.setStyle(textarea, 'position', 'fixed');
      this.renderer.setStyle(textarea, 'opacity', '0');
      this.renderer.appendChild(document.body, textarea);
      textarea.value = text;
      textarea.select();
      document.execCommand('copy');
      this.renderer.removeChild(document.body, textarea);
    }
    this.snackbarService.openI18N('msg.copyText', { text });
  }
}

@Directive({
  selector: '[trimOnBlur]',
  standalone: true,
})
export class TrimOnBlurDirective {
  private readonly elementRef = inject(
    ElementRef<HTMLInputElement | HTMLTextAreaElement>
  );
  private readonly control = inject(NgControl, { optional: true, self: true });

  @HostListener('blur')
  onBlur() {
    const value = this.elementRef.nativeElement.value;
    if (typeof value !== 'string') {
      return;
    }

    const trimmedValue = value.trim();
    if (value === trimmedValue) {
      return;
    }

    this.elementRef.nativeElement.value = trimmedValue;

    if (this.control?.control) {
      this.control.control.setValue(trimmedValue);

      if (this.control instanceof NgModel) {
        this.control.viewToModelUpdate(trimmedValue);
      }
    } else {
      this.elementRef.nativeElement.dispatchEvent(
        new Event('input', { bubbles: true })
      );
    }
  }
}
