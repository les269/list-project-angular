import { Component, ElementRef, Input, ViewChild } from '@angular/core';


@Component({
  selector: 'app-fixed-image',
  standalone: true,
  imports: [],
  templateUrl: './fixed-image.component.html',
  styleUrl: './fixed-image.component.scss',
})
export class FixedImageComponent {
  @Input() fixedImagePath = '';
  @ViewChild('fixedImage') fixedImage!: ElementRef;

  hidden() {
    this.fixedImage.nativeElement.style.visibility = 'hidden';
  }

  visible() {
    this.fixedImage.nativeElement.style.visibility = 'visible';
  }
}
