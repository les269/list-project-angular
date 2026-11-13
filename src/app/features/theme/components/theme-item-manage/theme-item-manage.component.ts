import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, finalize, Observable, switchMap, tap } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import {
  ThemeItem,
  ThemeItemMap,
  ThemeItemType,
  ThemeTableEditMode,
} from '../../models';
import { ThemeItemMapService, ThemeItemService } from '../../services';
import { normalizeThemeItem } from '../../util/theme-item-form';
import { CopyThemeItemComponent } from '../copy-theme-item/copy-theme-item.component';

@Component({
  selector: 'app-theme-item-manage',
  imports: [TranslatePipe, TrimOnBlurDirective, FormField],
  templateUrl: './theme-item-manage.component.html',
})
export class ThemeItemManageComponent {
  readonly messageBoxService = inject(MessageBoxService);
  readonly selectTableService = inject(SelectTableService);
  readonly themeItemService = inject(ThemeItemService);
  readonly themeItemMapService = inject(ThemeItemMapService);
  readonly snackbarService = inject(SnackbarService);
  readonly dialog = inject(MatDialog);
  readonly translate = inject(TranslateService);

  // 輸入參數
  readonly headerId = input<string>();
  readonly form = input.required<FieldTree<ThemeItem>>();
  readonly resetValue = input.required<ThemeItem>();
  readonly defaultBinding = input<boolean>(false);
  // 輸出事件
  readonly bindingChange = output<boolean>();
  readonly afterSave = output<ThemeItem>();

  // 元件狀態
  readonly mode = linkedSignal(() =>
    this.defaultBinding() ? ThemeTableEditMode.EDIT : ThemeTableEditMode.NEW
  );
  readonly isEditMode = computed(() => this.mode() === ThemeTableEditMode.EDIT);
  readonly isBinding = linkedSignal<boolean>(() => this.defaultBinding());
  readonly showBindButton = computed(
    () => this.isEditMode() && isNotBlank(this.headerId() ?? '')
  );
  readonly showDeleteButton = computed(
    () => this.isEditMode() && !this.isBinding()
  );
  readonly isProcessing = signal(false);
  readonly type = computed(() => this.form()().value().type);

  readonly eThemeItemType = ThemeItemType;

  readonly itemIdLabelKey = computed(() => {
    switch (this.type()) {
      case this.eThemeItemType.IMAGE:
        return 'themeImage.imageId';
      case this.eThemeItemType.LABEL:
        return 'themeLabel.labelId';
      case this.eThemeItemType.DATASET:
        return 'themeDataset.datasetId';
      case this.eThemeItemType.CUSTOM:
        return 'themeCustom.customId';
      case this.eThemeItemType.TAG:
        return 'themeTag.tagId';
      case this.eThemeItemType.OTHERSETTING:
        return 'otherSetting.settingId';
      case this.eThemeItemType.TOPCUSTOM:
        return 'themeTopCustom.topCustomId';
    }
  });

  private runOperation<T>(
    operation: () => Observable<T>,
    onSuccess?: (value: T) => void
  ) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    operation()
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({ next: onSuccess, error: () => {} });
  }

  private validateForm(): boolean {
    const fields = this.form();
    fields().markAsTouched();
    if (fields().valid()) return true;
    this.snackbarService.isBlankMessage(this.itemIdLabelKey());
    return false;
  }

  openItemSelector() {
    const type = this.type();
    this.runOperation(
      () =>
        this.themeItemService.getAllItems(type).pipe(
          switchMap(data =>
            this.selectTableService.selectSingleThemeItemSummary(
              data,
              this.itemIdLabelKey()
            )
          ),
          switchMap(item =>
            this.themeItemService.getThemeItem(type, item.itemId)
          )
        ),
      item => {
        this.form()().reset(normalizeThemeItem(item, this.resetValue()));
        this.mode.set(ThemeTableEditMode.EDIT);
      }
    );
  }

  addItem() {
    if (this.isProcessing() || !this.validateForm()) return;
    const fields = this.form();
    const raw = fields().value();
    const req = {
      ...raw,
      itemId: raw.itemId.trim(),
      description: raw.description?.trim() ?? '',
    };
    this.runOperation(() =>
      this.themeItemService.getThemeItem(req.type, req.itemId).pipe(
        switchMap(item => {
          if (item) {
            this.messageBoxService.openI18N('msg.itemIdExist', {
              params: { text: this.translate.instant(this.itemIdLabelKey()) },
              onlyOk: true,
            });
            return EMPTY;
          }
          return this.persistItem(req);
        })
      )
    );
  }

  saveItem() {
    if (this.isProcessing() || !this.validateForm()) return;
    const fields = this.form();
    const raw = fields().value();
    const req = {
      ...raw,
      itemId: raw.itemId.trim(),
      description: raw.description?.trim() ?? '',
    };
    this.runOperation(() => this.persistItem(req));
  }

  private persistItem(req: ThemeItem) {
    return this.themeItemService.updateThemeItem(req).pipe(
      tap(() => {
        this.afterSave.emit(req);
        this.mode.set(ThemeTableEditMode.EDIT);
        this.snackbarService.openI18N('msg.saveSuccess');
      })
    );
  }

  onClear() {
    this.runOperation(
      () => this.messageBoxService.openI18N('msg.sureClear'),
      result => {
        if (!result) {
          return;
        }
        this.mode.set(ThemeTableEditMode.NEW);
        const form = this.form();
        form().reset(structuredClone(this.resetValue()));
      }
    );
  }

  toggleBind() {
    const fields = this.form();
    const itemId = fields.itemId().value().trim();
    const headerId = this.headerId()?.trim() ?? '';
    const type = this.type();

    const wasBinding = this.isBinding();
    const req: ThemeItemMap = { itemId, headerId, type };
    this.runOperation(
      () =>
        wasBinding
          ? this.themeItemMapService.deleteItemMap(type, itemId, headerId)
          : this.themeItemMapService.updateItemMap(req),
      () => {
        this.isBinding.set(!wasBinding);
        this.snackbarService.openI18N(
          wasBinding ? 'msg.unbindSuccess' : 'msg.bindSuccess'
        );
        this.bindingChange.emit(!wasBinding);
      }
    );
  }

  deleteItem() {
    const fields = this.form();
    const itemId = fields.itemId().value().trim();
    if (isBlank(itemId)) {
      this.snackbarService.isBlankMessage(this.itemIdLabelKey());
      return;
    }
    const type = this.type();

    this.runOperation(
      () =>
        this.themeItemMapService.itemMapInUse(type, itemId).pipe(
          switchMap(inUse => {
            if (inUse) {
              this.messageBoxService.openI18N('msg.labelTableInUse', {
                onlyOk: true,
              });
              return EMPTY;
            }
            return this.messageBoxService.openI18N('msg.sureDeleteLabelTable');
          }),
          switchMap(result => {
            if (!result) {
              return EMPTY;
            }
            return this.themeItemService.deleteThemeItem(type, itemId);
          })
        ),
      () => {
        fields.itemId().value.set('');
        fields.description().value.set('');
        this.mode.set(ThemeTableEditMode.NEW);
        this.snackbarService.openI18N('msg.deleteSuccess');
      }
    );
  }

  copyItem() {
    if (this.isProcessing()) return;
    const fields = this.form();
    const itemId = fields.itemId().value().trim();
    this.dialog.open(CopyThemeItemComponent, {
      data: {
        sourceItemId: itemId,
        type: this.type(),
      },
    });
  }
}
