import { Component, computed, inject } from '@angular/core';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import {
  getQueryParamsByHeader,
  isNotBlank,
} from '../../../../shared/util/helper';
import { ThemeVisibleComponent } from '../../components/theme-visible/theme-visible.component';
import { ShareTagListComponent } from '../../components/share-tag-list/share-tag-list.component';
import { CopyThemeComponent } from '../../components/copy-theme/copy-theme.component';
import { LayoutStore } from '../../../../core/stores/layout.store';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'app-theme-list',
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
  readonly list = computed(() => this.layoutStore.visibleList());

  eThemeHeaderType = ThemeHeaderType;

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
        data: { themeHeader: item },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.snackbarService.openI18N('msg.copySuccess');
          this.layoutStore.loadList();
        }
      });
  }
  onDelete(item: ThemeHeader) {
    this.messageBoxService.openI18N('msg.sureDeleteTheme').subscribe(result => {
      if (isNotBlank(result)) {
        this.themeService.deleteTheme(item).subscribe(() => {
          this.snackbarService.openI18N('msg.deleteSuccess');
          this.layoutStore.loadList();
        });
      }
    });
  }

  navigateList(item: ThemeHeader) {
    this.router.navigate([item.type, item.name, item.version], {
      queryParams: getQueryParamsByHeader(item),
    });
  }

  onOpenVisible() {
    this.matDialog.open(ThemeVisibleComponent);
  }

  onShareTagConfig() {
    this.matDialog.open(ShareTagListComponent, {
      width: '800px',
      maxWidth: '800px',
      height: '600px',
    });
  }
}
