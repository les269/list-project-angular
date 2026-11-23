import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { KeyValuePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { ThemeVisibleComponent } from '../../components/theme-visible/theme-visible.component';
import { ShareTagListComponent } from '../../components/share-tag-list/share-tag-list.component';
import { CopyThemeComponent } from '../../components/copy-theme/copy-theme.component';
import { MatIconModule } from '@angular/material/icon';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { SearchBookmarkListComponent } from '../../components/search-bookmark-list/search-bookmark-list.component';

@Component({
  imports: [KeyValuePipe, RouterLink, TranslatePipe, MatIconModule],
  selector: 'app-theme-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'theme-list.component.html',
  styleUrls: ['theme-list.component.scss'],
})
export class ThemeListComponent {
  readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  readonly matDialog = inject(MatDialog);
  readonly messageBoxService = inject(MessageBoxService);
  readonly layoutStore = inject(LayoutStore);

  readonly eThemeHeaderType = ThemeHeaderType;
  readonly list = computed(() => this.layoutStore.visibleList());

  routeCreate() {
    this.router.navigate(['theme-edit']);
  }

  onEdit(item: ThemeHeader) {
    const { name, version, type } = item;
    this.router.navigate(['theme-edit'], {
      queryParams: { name, version, type },
    });
  }
  onCopy(item: ThemeHeader) {
    this.matDialog
      .open(CopyThemeComponent, {
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'input:not([readonly])',
        data: { themeHeader: item },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.snackbarService.openI18N('msg.copySuccess');
          this.layoutStore.loadThemeList();
        }
      });
  }
  onDelete(item: ThemeHeader) {
    this.messageBoxService.openI18N('msg.sureDeleteTheme').subscribe(result => {
      if (isNotBlank(result)) {
        this.themeService.deleteTheme(item).subscribe(() => {
          this.snackbarService.openI18N('msg.deleteSuccess');
          this.layoutStore.loadThemeList();
        });
      }
    });
  }

  onOpenVisible() {
    this.matDialog.open(ThemeVisibleComponent);
  }

  onShareTagConfig() {
    this.matDialog.open(ShareTagListComponent, {
      width: '800px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '92vh',
    });
  }

  onSearchBookmarkConfig() {
    this.matDialog.open(SearchBookmarkListComponent, {
      width: '800px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '92vh',
    });
  }
}
