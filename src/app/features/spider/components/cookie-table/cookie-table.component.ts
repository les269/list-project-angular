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

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cookie, CookieListMapType, CookieListTO } from '../../model';
import { MatButtonModule } from '@angular/material/button';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { CookieListService } from '../../services/cookie-list.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { EMPTY, switchMap } from 'rxjs';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-cookie-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    GenericTableComponent,
    TrimOnBlurDirective,
  ],
  templateUrl: './cookie-table.component.html',
})
export class CookieTableComponent {
  readonly cookieListService = inject(CookieListService);
  readonly selectTableService = inject(SelectTableService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly snackbarService = inject(SnackbarService);
  displayedColumns = ['name', 'value'];

  formArray = input.required<ToFormArray<Cookie>>();
  initData = input<Cookie[]>();
  refId = input<string>();
  mapType = input<CookieListMapType>();
  defaultBinding = input<boolean>(false);

  readonly bindingChange = output<boolean>();
  readonly afterSave = output<CookieListTO>();

  cols: GenericTableColumn[] = [
    { key: 'name', label: 'g.name', columnType: GenericColumnType.input },
    { key: 'value', label: 'g.value', columnType: GenericColumnType.input },
  ];

  readonly mode = signal<'new' | 'edit'>('new');
  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly isBinding = linkedSignal<boolean>(() => this.defaultBinding());
  readonly showBindButton = computed(
    () =>
      this.isEditMode() && isNotBlank(this.refId() ?? '') && !!this.mapType()
  );
  readonly showDeleteButton = computed(
    () => this.isEditMode() && !this.isBinding()
  );

  readonly fb = inject(FormBuilder);
  readonly manageForm = this.fb.nonNullable.group({
    cookieId: ['', [Validators.required]],
    description: [''],
  });

  get cookieIdControl() {
    return this.manageForm.controls.cookieId;
  }

  get descriptionControl() {
    return this.manageForm.controls.description;
  }

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.cookieIdControl.disable({ emitEvent: false });
      } else {
        this.cookieIdControl.enable({ emitEvent: false });
      }
    });
  }

  openItemSelector() {
    this.cookieListService
      .getAll()
      .pipe(
        switchMap(data => this.selectTableService.selectSingleCookieList(data)),
        switchMap(item => this.cookieListService.getByCookieId(item.cookieId))
      )
      .subscribe(item => {
        this.manageForm.patchValue({
          cookieId: item.cookieId,
          description: item.description ?? '',
        });
        this.setCookieList(item.list ?? []);
        this.mode.set('edit');
      });
  }

  addItem() {
    this.cookieIdControl.markAsTouched();
    if (this.manageForm.invalid) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    const cookieId = this.cookieIdControl.getRawValue().trim();
    this.cookieListService.getAll().subscribe(list => {
      const exist = list.some(x => x.cookieId === cookieId);
      if (exist) {
        this.messageBoxService.openI18N('msg.itemIdExist', {
          params: { text: 'Cookie ID' },
          onlyOk: true,
        });
        return;
      }
      this.saveItem();
    });
  }

  saveItem() {
    this.cookieIdControl.markAsTouched();
    if (this.manageForm.invalid) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    const req: CookieListTO = {
      cookieId: this.cookieIdControl.getRawValue().trim(),
      description: this.descriptionControl.getRawValue().trim(),
      list: this.formArray().getRawValue() as Cookie[],
    };
    this.cookieListService.update(req).subscribe(() => {
      this.mode.set('edit');
      this.afterSave.emit(req);
      this.snackbarService.openI18N('msg.saveSuccess');
    });
  }

  onClear() {
    this.messageBoxService.openI18N('msg.sureClear').subscribe(result => {
      if (!result) return;
      this.mode.set('new');
      this.manageForm.reset({ cookieId: '', description: '' });
      this.setCookieList([]);
    });
  }

  toggleBind() {
    const refId = this.refId()?.trim() ?? '';
    const mapType = this.mapType();
    const cookieId = this.cookieIdControl.getRawValue().trim();
    if (isBlank(refId) || !mapType || isBlank(cookieId)) {
      return;
    }

    if (this.isBinding()) {
      this.cookieListService.deleteMap(refId, mapType).subscribe(() => {
        this.isBinding.set(false);
        this.bindingChange.emit(false);
        this.snackbarService.openI18N('msg.unbindSuccess');
      });
      return;
    }

    this.cookieListService
      .updateMap({ refId, type: mapType, cookieId })
      .subscribe(() => {
        this.isBinding.set(true);
        this.bindingChange.emit(true);
        this.snackbarService.openI18N('msg.bindSuccess');
      });
  }

  deleteItem() {
    const cookieId = this.cookieIdControl.getRawValue().trim();
    if (isBlank(cookieId)) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    this.cookieListService
      .isInUse(cookieId)
      .pipe(
        switchMap(inUse => {
          if (inUse) {
            this.messageBoxService.openI18N('msg.cookieListInUse', {
              onlyOk: true,
            });
            return EMPTY;
          }
          return this.messageBoxService.openI18N('msg.sureDeleteCookieList');
        }),
        switchMap(result => {
          if (!result) return EMPTY;
          return this.cookieListService.delete(cookieId);
        })
      )
      .subscribe(() => {
        this.mode.set('new');
        this.manageForm.reset({ cookieId: '', description: '' });
        this.setCookieList([]);
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  private setCookieList(list: Cookie[]) {
    const formArray = this.formArray();
    formArray.clear();
    for (const item of list) {
      const group = this.createGroup();
      group.patchValue(item);
      formArray.push(group);
    }
  }

  createGroup() {
    return this.fb.nonNullable.group({
      seq: [0],
      name: ['', [Validators.required]],
      value: ['', [Validators.required]],
    });
  }
}
