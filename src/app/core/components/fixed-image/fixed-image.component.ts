import {
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-fixed-image',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './fixed-image.component.html',
  styleUrl: './fixed-image.component.scss',
})
export class FixedImageComponent {
  fixedImagePath = input.required<string>();
  imageEl = viewChild<ElementRef>('imageEl');

  isVisible = signal<boolean>(false);
  zoomLevel = signal(1);

  constructor() {
    effect(() => {
      const visible = this.isVisible();
      if (visible) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  show() {
    this.isVisible.set(true);
    this.zoomLevel.set(1);
  }

  closeModal(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.isVisible.set(false);
  }

  openNewWindow() {
    window.open(this.fixedImagePath(), '_blank');
  }

  downloadImage() {
    const imageUrl = this.fixedImagePath();

    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = imageUrl.split('/').pop() || 'image.jpg';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('下載失敗', err);
      });
  }
}
