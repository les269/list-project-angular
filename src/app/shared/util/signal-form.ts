import { FieldState } from '@angular/forms/signals';

/**
 * 將部分資料合併到表單目前的值，例如載入 API 回傳的設定。
 * 只更新表單已存在的欄位；未提供、null 或 undefined 的欄位保留目前值。
 * 巢狀物件逐層合併，陣列則複製後整份取代。
 */
export function patchField(field: () => FieldState<any>, patch: unknown): void {
  field().value.update(current => mergeValue(current, patch));
}

function mergeValue<T>(current: T, patch: unknown): T {
  if (patch === undefined || patch === null) return current;
  if (Array.isArray(patch)) return structuredClone(patch) as T;
  if (
    typeof current !== 'object' ||
    current === null ||
    typeof patch !== 'object'
  ) {
    return patch as T;
  }
  const result = { ...current };
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (key in patch) result[key] = mergeValue(current[key], (patch as T)[key]);
  }
  return result;
}

/** 檢查欄位本身是否有指定 kind 的驗證錯誤，例如 required；不檢查子欄位。 */
export function hasFieldError(
  field: () => FieldState<any>,
  kind: string
): boolean {
  return field()
    .errors()
    .some(error => error.kind === kind);
}
