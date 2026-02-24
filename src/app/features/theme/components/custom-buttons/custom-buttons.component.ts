import {
  Component,
  computed,
  inject,
  input,
  signal,
  effect,
  linkedSignal,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import {
  OpenWindowTargetType,
  ThemeCustom,
  ThemeCustomValue,
  ThemeCustomValueResponse,
  ThemeHeaderType,
} from '../../models';
import {
  isBlank,
  isNotBlank,
  isNotNull,
  replaceValue,
} from '../../../../shared/util/helper';
import { ThemeService } from '../../services/theme.service';
import { ButtonInputUrlDialog } from '../button-input-url.dialog';
import { MatDialog } from '@angular/material/dialog';
import { ThemeNoteComponent } from '../theme-note/theme-note.component';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { CopyDirective } from '../../../../shared/util/util.directive';
import { FileService } from '../../../../core/services/file.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-custom-buttons',
  standalone: true,
  imports: [MatIconModule, CopyDirective],
  templateUrl: './custom-buttons.component.html',
  styleUrl: './custom-buttons.component.scss',
})
export class CustomButtonsComponent {
  private readonly themeService = inject(ThemeService);
  private readonly matDialog = inject(MatDialog);
  private readonly apiConfigService = inject(ApiConfigService);
  private readonly fileService = inject(FileService);
  private readonly snackbarService = inject(SnackbarService);

  themeCustomList = input.required<ThemeCustom[]>();
  data = input.required<any>();
  headerId = input.required<string>();
  defaultKey = input.required<string>();
  customValueMap = input.required<ThemeCustomValueResponse>();
  currentDatasetName = input<string>('');
  fileExist = input<Record<string, boolean>>({});
  fileExistSync = linkedSignal(() => ({ ...this.fileExist() }));
  replaceValue = replaceValue;

  customValueCache = computed(() => {
    const map = this.customValueMap();
    const dataKey = this.data()[this.defaultKey()];
    return map[dataKey] ?? {};
  });

  fileExistForCurrentData = computed(() => {
    return this.fileExistSync()[this.data()[this.defaultKey()]] ?? false;
  });

  getCustomValue(custom: ThemeCustom): string {
    return this.customValueCache()[custom.byKey] ?? '';
  }

  /**
   * 取得UI要使用的自定義資料的字串
   */
  getCustomValueForUI(custom: ThemeCustom): any {
    const value = this.getCustomValue(custom);

    switch (custom.type) {
      case 'buttonIconBoolean':
        return isBlank(value) || value === 'true'
          ? custom.buttonIconTrue
          : custom.buttonIconFalse;
      case 'buttonIconFill':
        return value === 'true';
      default:
        return '';
    }
  }

  /**
   * 執行更新自定義字串
   */
  changeCustomValue(
    custom: ThemeCustom,
    value?: any,
    options?: { isDialogSave?: boolean }
  ) {
    const currentValue = this.getCustomValue(custom);
    let newValue = value;

    switch (custom.type) {
      case 'buttonIconBoolean':
        newValue =
          isBlank(currentValue) || currentValue === 'true' ? 'false' : 'true';
        break;
      case 'buttonIconFill':
        newValue = !(currentValue === 'true') + '';
        break;
      case 'buttonInputUrl':
        newValue = value;
        break;
    }

    const req: ThemeCustomValue = {
      headerId: this.headerId(),
      byKey: custom.byKey,
      correspondDataValue: this.data()[this.defaultKey()],
      customValue: newValue,
    };

    this.themeService.updateCustomValue(req).subscribe(() => {
      this.customValueMap()[req.correspondDataValue][req.byKey] =
        req.customValue;
      if (options?.isDialogSave) {
        this.snackbarService.openI18N('msg.saveSuccess');
      }
    });
  }

  openButtonInputUrlDialog(custom: ThemeCustom) {
    const dialogRef = this.matDialog.open(ButtonInputUrlDialog, {
      width: '600px',
      data: this.getCustomValue(custom),
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isNotNull(result)) {
        this.changeCustomValue(custom, result);
      }
    });
  }

  openNewPage(text: string, target: OpenWindowTargetType) {
    if (isBlank(text)) {
      this.snackbarService.openI18N('msg.urlEmpty');
      return;
    }
    window.open(text, target);
  }

  openNoteDialog(custom: ThemeCustom, type: 'read' | 'write') {
    this.matDialog
      .open(ThemeNoteComponent, {
        data: {
          title: custom.label,
          value: this.getCustomValue(custom) ?? '',
          disabled: type === 'read',
          save: (result: string) => {
            if (isNotNull(result)) {
              this.changeCustomValue(custom, result, {
                isDialogSave: true,
              });
            }
          },
        },
        panelClass: 'dialog-responsive',
        height: '80vh',
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotNull(result)) {
          this.changeCustomValue(custom, result);
        }
      });
  }

  callApi(custom: ThemeCustom) {
    if (custom.apiConfig) {
      this.apiConfigService.callSingleApi(custom.apiConfig, this.data());
    }
  }

  deleteFile(custom: ThemeCustom) {
    if (isNotBlank(custom.deleteFile)) {
      this.fileService
        .delete({ path: replaceValue(custom.deleteFile, this.data()) })
        .subscribe(x => {
          const currentKey = this.data()[this.defaultKey()];
          this.fileExistSync.update(map => ({
            ...map,
            [currentKey]: !x,
          }));
          this.snackbarService.openI18N(
            x ? 'msg.deleteFileSuccess' : 'msg.deleteFail'
          );
        });
    }
  }

  moveTo(custom: ThemeCustom) {
    if (isNotBlank(custom.moveTo) && isNotBlank(custom.filePathForMoveTo)) {
      this.fileService
        .moveTo({
          path: replaceValue(custom.filePathForMoveTo, this.data()),
          moveTo: replaceValue(custom.moveTo, this.data()),
        })
        .subscribe(x => {
          const currentKey = this.data()[this.defaultKey()];
          this.fileExistSync.update(map => ({
            ...map,
            [currentKey]: !x,
          }));
          this.snackbarService.openI18N(
            x ? 'msg.moveToFileSuccess' : 'msg.moveToFileFail'
          );
        });
    }
  }

  openFolder(custom: ThemeCustom) {
    if (isNotBlank(custom.openFolder)) {
      this.fileService
        .openFolder({ path: replaceValue(custom.openFolder, this.data()) })
        .subscribe(x => {
          this.snackbarService.openI18N(
            x ? 'msg.openFolderSuccess' : 'msg.openFolderFail'
          );
        });
    }
  }

  visibleByDatasetName(custom: ThemeCustom): boolean {
    if (
      Array.isArray(custom.visibleDatasetNameList) &&
      custom.visibleDatasetNameList.length > 0 &&
      !custom.visibleDatasetNameList.includes(this.currentDatasetName())
    ) {
      return false;
    }
    return true;
  }
}
