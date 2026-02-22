import { Component, input, linkedSignal, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-img-content',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './img-content.component.html',
  styleUrl: './img-content.component.scss',
})
export class ImgContentComponent {
  url = input.required<string>();
  priority = input.required<boolean>();
  ctrlPressed = input.required<boolean>();
  refreshDate = input.required<Date>();
  hiddenFixedImage = output<void>();
  visibleFixedImage = output<void>();
  changeFixedImagePath = output<string>();
  delayViewImg = output<{ event: MouseEvent; url: string }>();
  fallbackSrc: string = 'assets/img/img-not-found.jpg';

  displaySrc = linkedSignal(
    () =>
      this.url() +
      (this.refreshDate() ? `&t=${this.refreshDate().getTime()}` : '')
  );

  onError(): void {
    this.displaySrc.set(this.fallbackSrc);
  }

  hiddenFixedImageHandle() {
    this.hiddenFixedImage.emit();
  }

  clickImg(event: MouseEvent) {
    if (event.ctrlKey) {
      return;
    }
    this.visibleFixedImage.emit();
    this.changeFixedImagePath.emit(this.displaySrc());
  }

  delayViewImgHandle(event: MouseEvent) {
    this.delayViewImg.emit({ event, url: this.displaySrc() });
  }

  refreshImage(event: MouseEvent) {
    if (event.ctrlKey) {
      event.stopPropagation(); // 防止事件冒泡
      this.displaySrc.update(() => this.url() + '&t=' + Date.now());
    }
  }
}
