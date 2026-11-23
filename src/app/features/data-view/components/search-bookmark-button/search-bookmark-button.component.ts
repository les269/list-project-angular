import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { take } from 'rxjs';
import { SearchBookmarkSnackbarComponent } from '../search-bookmark-snackbar/search-bookmark-snackbar.component';

@Component({
  imports: [MatIconModule, MatSnackBarModule, MatTooltipModule, TranslatePipe],
  selector: 'app-search-bookmark-button',
  styleUrl: './search-bookmark-button.component.scss',
  templateUrl: './search-bookmark-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class SearchBookmarkButtonComponent {
  private readonly snackbar = inject(MatSnackBar);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private snackbarRef?: MatSnackBarRef<SearchBookmarkSnackbarComponent>;
  readonly bookmarkId = input('');
  readonly searchValue = input('');
  readonly search = output<string>();
  readonly isOpen = signal(false);

  constructor() {
    effect(() => {
      this.bookmarkId();
      this.snackbarRef?.dismiss();
    });
    this.destroyRef.onDestroy(() => this.snackbarRef?.dismiss());
  }

  toggle() {
    const id = this.bookmarkId().trim();
    if (!id) return;
    if (this.isOpen()) {
      this.snackbarRef?.dismiss();
      return;
    }
    const ref = this.snackbar.openFromComponent(
      SearchBookmarkSnackbarComponent,
      {
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: 'search-bookmark-panel',
        duration: 0,
        viewContainerRef: this.viewContainerRef,
        data: {
          id,
          getSearchValue: () => this.searchValue(),
          onSelect: (value: string) => {
            if (this.bookmarkId().trim() === id) this.search.emit(value);
            ref.dismiss();
          },
        },
      }
    );
    this.snackbarRef = ref;
    this.isOpen.set(true);
    ref
      .afterDismissed()
      .pipe(take(1))
      .subscribe(() => {
        if (this.snackbarRef === ref) {
          this.snackbarRef = undefined;
          this.isOpen.set(false);
        }
      });
  }

  closeOnOutsideClick(event: MouseEvent) {
    if (!this.isOpen()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (this.elementRef.nativeElement.contains(target)) return;
    if (
      target.closest(
        '.search-bookmark-panel, .mat-mdc-dialog-container, .cdk-overlay-backdrop'
      )
    )
      return;
    this.snackbarRef?.dismiss();
  }
}
