import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appTableDragPreview]',
})
export class TableDragPreviewDirective implements OnInit {
  readonly sourceRow = input.required<HTMLElement>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit() {
    // CDK 建立預覽時原始列仍在表格內，此時才能取得實際欄寬與詳細列。
    const row = this.sourceRow();
    const sourceTable = row.closest('table');
    if (!sourceTable) return;
    const table = sourceTable.cloneNode(false) as HTMLTableElement;
    table.removeAttribute('id');
    table.style.width = `${row.getBoundingClientRect().width}px`;
    table.style.tableLayout = 'fixed';
    table.style.margin = '0';
    const tableStyle =
      row.ownerDocument.defaultView?.getComputedStyle(sourceTable);
    if (tableStyle) {
      table.style.font = tableStyle.font;
      table.style.color = tableStyle.color;
      // 預覽插入全域容器後仍保留表格繼承的 Material theme 變數。
      for (const property of Array.from(tableStyle)) {
        if (property.startsWith('--')) {
          table.style.setProperty(
            property,
            tableStyle.getPropertyValue(property)
          );
        }
      }
    }
    const body = table.createTBody();
    body.appendChild(this.cloneRow(row));
    // 建立中的預覽可能暫時插在主列與詳細列之間。
    let detail = row.nextElementSibling;
    while (detail && detail.tagName !== 'TR') {
      detail = detail.nextElementSibling;
    }
    if (detail?.classList.contains('generic-table-detail-row')) {
      body.appendChild(this.cloneRow(detail as HTMLTableRowElement));
    }
    const preview = this.element.nativeElement;
    preview.inert = true;
    preview.setAttribute('aria-hidden', 'true');
    preview.appendChild(table);
  }

  private cloneRow(row: HTMLElement) {
    // 僅複製 DOM，避免預覽重新註冊 Signal Forms 或初始化巢狀編輯器。
    const clone = row.cloneNode(true) as HTMLTableRowElement;
    clone.removeAttribute('id');
    clone
      .querySelectorAll('[id]')
      .forEach(element => element.removeAttribute('id'));
    const cells = row.querySelectorAll<HTMLTableCellElement>('td, th');
    clone
      .querySelectorAll<HTMLTableCellElement>('td, th')
      .forEach((cell, index) => {
        const width = `${cells[index].getBoundingClientRect().width}px`;
        cell.style.width = width;
        cell.style.minWidth = width;
        cell.style.maxWidth = width;
        cell.style.boxSizing = 'border-box';
      });
    const selector = 'input, textarea, select';
    const controls = row.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(selector);
    clone
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(selector)
      .forEach((control, index) => {
        const source = controls[index];
        control.removeAttribute('name');
        if (control.type !== 'file') control.value = source.value;
        if (
          control instanceof HTMLInputElement &&
          source instanceof HTMLInputElement
        ) {
          control.checked = source.checked;
        }
      });
    return clone;
  }
}
