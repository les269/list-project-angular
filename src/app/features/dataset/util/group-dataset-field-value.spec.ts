import { parseGroupDatasetNumber } from './group-dataset-field-value';

it.each([
  [0, 0],
  [-1.25, -1.25],
  [' 12.5 ', 12.5],
  ['-3', -3],
  ['1e3', 1000],
])('數值 %s 轉為 JSON number', (input, expected) => {
  expect(parseGroupDatasetNumber(input)).toBe(expected);
});

it.each([
  '',
  ' ',
  'abc',
  '0x10',
  'Infinity',
  '1e309',
  null,
  undefined,
  NaN,
  Infinity,
  [],
  {},
])('拒絕無效或非有限數字 %s', value => {
  expect(parseGroupDatasetNumber(value)).toBeUndefined();
});
