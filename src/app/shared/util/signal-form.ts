import { FieldState } from '@angular/forms/signals';

/** Merge API data into a signal form while preserving defaults for omitted fields. */
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

export function hasFieldError(
  field: () => FieldState<any>,
  kind: string
): boolean {
  return field()
    .errors()
    .some(error => error.kind === kind);
}
