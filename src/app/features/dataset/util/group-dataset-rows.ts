import {
  GroupDatasetField,
  GroupDatasetFieldType,
  GroupDatasetApi,
  GroupDatasetScrapy,
} from '../model';

export const createGroupDatasetField = (
  data: Partial<GroupDatasetField> = {}
) => {
  return {
    seq: 0,
    type: GroupDatasetFieldType.string,
    key: '',
    label: '',
    replaceValueMapName: '',
    ...data,
  };
};

export const createGroupDatasetApi = (data: Partial<GroupDatasetApi> = {}) => {
  return {
    seq: 0,
    apiId: '',
    label: '',
    ...data,
  };
};

export const createGroupDatasetScrapy = (
  data: Partial<GroupDatasetScrapy> = {}
) => {
  return {
    seq: 0,
    name: '',
    label: '',
    isDefault: false,
    visibleJson: false,
    visibleUrl: false,
    ...data,
  };
};
