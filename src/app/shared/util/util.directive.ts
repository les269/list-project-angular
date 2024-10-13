import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { SnackbarService } from '../../core/services/snackbar.service';

@Directive({ selector: '[ngCopy]', standalone: true })
export class UtilDirective {
  @Input() enableCopy: boolean = true; // 新增 Input 用於控制複製功能
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private snackbarService: SnackbarService
  ) {}
  @HostListener('click', ['$event'])
  onClick() {
    if (!this.enableCopy) {
      return;
    }
    const text = this.el.nativeElement.innerText;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.snackbarService.openByI18N('msg.copyText', { text });
    } else {
      const textarea = this.renderer.createElement('textarea');
      this.renderer.setStyle(textarea, 'position', 'fixed');
      this.renderer.setStyle(textarea, 'opacity', '0');
      this.renderer.appendChild(document.body, textarea);
      textarea.value = text;
      textarea.select();
      document.execCommand('copy');
      this.renderer.removeChild(document.body, textarea);
      this.snackbarService.openByI18N('msg.copyText', { text: textarea });
    }
  }
}