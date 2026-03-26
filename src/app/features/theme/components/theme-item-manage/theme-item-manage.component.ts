import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ThemeItem,
  ThemeItemType,
  ThemeMapTO,
  ThemeTableEditMode,
} from '../../models';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { switchMap, EMPTY } from 'rxjs';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ThemeItemService, ThemeMapService } from '../../services';
import { MatDialog } from '@angular/material/dialog';
import { CopyThemeItemComponent } from '../copy-theme-item/copy-theme-item.component';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-theme-item-manage',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, TrimOnBlurDirective],
  templateUrl: './theme-item-manage.component.html',
})
export class ThemeItemManageComponent {
  readonly messageBoxService = inject(MessageBoxService);
  readonly selectTableService = inject(SelectTableService);
  readonly themeItemService = inject(ThemeItemService);
  readonly themeMapService = inject(ThemeMapService);
  readonly snackbarService = inject(SnackbarService);
  readonly fb = inject(FormBuilder);
  readonly dialog = inject(MatDialog);
  readonly translate = inject(TranslateService);

  //inputs
  readonly headerId = input<string>();
  readonly type = input.required<ThemeItemType>();
  readonly form = input.required<FormGroup>();
  readonly defaultBinding = input<boolean>(false);
  //outputs
  readonly jsonReset = output<ThemeItem>();

  // signals
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
  readonly itemIdControl = computed(
    () => this.form().get('itemId') as FormControl<string>
  );
  readonly descriptionControl = computed(
    () => this.form().get('description') as FormControl<string>
  );

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

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.itemIdControl().disable();
      } else {
        this.itemIdControl().enable();
      }
    });
  }

  openItemSelector() {
    const type = this.type();
    this.themeItemService
      .getAllItems(type)
      .pipe(
        switchMap(data =>
          this.selectTableService.selectSingleThemeItemSummary(
            data,
            this.itemIdLabelKey()
          )
        ),
        switchMap(item => this.themeItemService.getThemeItem(type, item.itemId))
      )
      .subscribe(x => {
        this.form().patchValue(x);
        this.jsonReset.emit(x);
        this.mode.set(ThemeTableEditMode.EDIT);
      });
  }
  addItem() {
    const raw = this.form().getRawValue();
    const itemId = raw.itemId?.trim() ?? '';
    this.themeItemService.getThemeItem(this.type(), itemId).subscribe(x => {
      if (x) {
        this.messageBoxService.openI18N('msg.itemIdExist', {
          params: { text: this.translate.instant(this.itemIdLabelKey()) },
          onlyOk: true,
        });
        return;
      }
      this.saveItem();
    });
  }
  saveItem() {
    this.form().markAllAsTouched();
    if (this.form().invalid) {
      this.snackbarService.isBlankMessage(this.itemIdLabelKey());
      return;
    }
    const raw = this.form().getRawValue();
    const itemId = raw.itemId?.trim() ?? '';
    const description = raw.description?.trim() ?? '';
    const json = raw.json;

    const req = {
      itemId,
      description,
      type: this.type(),
      json,
    };

    this.themeItemService.updateThemeItem(req).subscribe(() => {
      this.mode.set(ThemeTableEditMode.EDIT);
      this.snackbarService.openI18N('msg.saveSuccess');
    });
  }

  onClear() {
    this.messageBoxService.openI18N('msg.sureClear').subscribe(result => {
      if (!result) {
        return;
      }
      this.mode.set(ThemeTableEditMode.NEW);
      const form = this.form();
      form.reset();
      const jsonControl = form.get('json');
      if (jsonControl instanceof FormArray) {
        jsonControl.clear();
        this.jsonReset.emit({
          ...form.getRawValue(),
          type: this.type(),
        } as ThemeItem);
      }
    });
  }

  toggleBind() {
    const itemId = this.itemIdControl().getRawValue()?.trim() ?? '';
    const headerId = this.headerId()?.trim() ?? '';
    const type = this.type();

    if (this.isBinding()) {
      this.themeMapService
        .deleteItemMap(type, itemId, headerId)
        .subscribe(() => {
          this.isBinding.set(false);
          this.snackbarService.openI18N('msg.unbindSuccess');
        });
    } else {
      const req: ThemeMapTO = { itemId, headerId, type };
      this.themeMapService.updateItemMap(req).subscribe(() => {
        this.isBinding.set(true);
        this.snackbarService.openI18N('msg.bindSuccess');
      });
    }
  }

  deleteItem() {
    const itemId = this.itemIdControl().getRawValue()?.trim() ?? '';
    if (isBlank(itemId)) {
      this.snackbarService.isBlankMessage(this.itemIdLabelKey());
      return;
    }
    const type = this.type();

    this.themeMapService
      .itemMapInUse(type, itemId)
      .pipe(
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
      )
      .subscribe(() => {
        this.itemIdControl().setValue('');
        this.descriptionControl().setValue('');
        this.mode.set(ThemeTableEditMode.NEW);
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  copyItem() {
    const itemId = this.itemIdControl().getRawValue()?.trim() ?? '';
    this.dialog.open(CopyThemeItemComponent, {
      data: {
        sourceItemId: itemId,
        type: this.type(),
      },
    });
  }
}
