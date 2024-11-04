import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../components/message-box.component';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class MessageBoxService {
  constructor(
    private matDialog: MatDialog,
    private translateService: TranslateService
  ) {}

  openI18N(msg: string, obj?: Object) {
    return this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant(msg, obj),
        },
      })
      .afterClosed();
  }
}
