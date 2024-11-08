import { animate, style, transition, trigger } from '@angular/animations';
import { Component, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatIconModule],
  selector: 'app-scrollTop',
  templateUrl: 'scroll-top.component.html',
  styleUrl: 'scroll-top.component.scss',
  animations: [
    trigger('fadeInOut', [
      // 當元素顯示時應用的狀態
      transition(':enter', [
        // 進入過渡
        style({ opacity: 0 }), // 初始狀態
        animate('100ms ease-in', style({ opacity: 1 })), // 300ms 內從透明到可見
      ]),
      transition(':leave', [
        // 離開過渡
        animate('100ms ease-out', style({ opacity: 0 })), // 300ms 內從可見到透明
      ]),
    ]),
  ],
})
export class ScrollTopComponent {
  isVisible: boolean = false;

  // 監聽滾動事件
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // 當滾動超過 100px 時顯示圖標
    this.isVisible = window.pageYOffset > 100;
  }

  // 點擊圖標後滾動到頂部
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 滾動時間可在樣式表中設置過渡效果
  }
}
