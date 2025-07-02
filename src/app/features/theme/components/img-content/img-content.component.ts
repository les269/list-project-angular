import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-img-content',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './img-content.component.html',
  styleUrl: './img-content.component.scss',
})
export class ImgContentComponent implements OnInit, OnChanges {
  @Input({ required: true }) url = '';
  @Input({ required: true }) priority = false;
  @Output() hiddenFixedImage = new EventEmitter<void>();
  @Output() visibleFixedImage = new EventEmitter<void>();
  @Output() changeFixedImagePath = new EventEmitter<string>();
  @Output() delayViewImg = new EventEmitter<{
    event: MouseEvent;
    url: string;
  }>();
  displaySrc: string = '';
  fallbackSrc: string = 'assets/img/img-not-found.jpg';
  showRefresh = false;
  ctrlPressed = false;

  ngOnInit() {
    this.displaySrc = this.url;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url']) {
      this.displaySrc = this.url;
    }
  }

  onError(): void {
    this.displaySrc = this.fallbackSrc;
  }

  hiddenFixedImageHandle() {
    this.hiddenFixedImage.emit();
  }

  clickImg(event: MouseEvent) {
    if (event.ctrlKey) {
      return;
    }
    this.visibleFixedImage.emit();
    this.changeFixedImagePath.emit(this.displaySrc);
  }

  delayViewImgHandle(event: MouseEvent) {
    this.delayViewImg.emit({ event, url: this.displaySrc });
  }

  refreshImage(event: MouseEvent) {
    if (event.ctrlKey) {
      event.stopPropagation(); // 防止事件冒泡
      this.displaySrc = this.url + '&t=' + Date.now();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.showRefresh = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.showRefresh = false; // 當放開 Ctrl 時隱藏
    }
  }
}
