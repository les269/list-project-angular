export interface ReplaceValueMap {
  name: string;
  map: { [key: string]: string };
  createdTime?: Date;
  updatedTime?: Date;
}

export interface ReplaceValueList {
  match: string;
  replaceValue: string;
}
