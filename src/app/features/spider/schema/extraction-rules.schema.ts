import {
  applyEach,
  PathKind,
  required,
  SchemaPath,
  SchemaPathRules,
  SchemaPathTree,
} from '@angular/forms/signals';
import { ExtractionRule, ExtractionRuleMode } from '../model';

export function applyExtractionRulesSchema(
  rules: SchemaPathTree<ExtractionRule[], PathKind.Child>,
  mode: SchemaPath<
    ExtractionRuleMode,
    SchemaPathRules.Supported,
    PathKind.Child
  >
) {
  applyEach(rules, row => {
    required(row.key);
    required(row.selector, {
      when: ({ valueOf }) => valueOf(mode) === ExtractionRuleMode.SELECT,
    });
    required(row.jsonPath, {
      when: ({ valueOf }) => valueOf(mode) === ExtractionRuleMode.JSON_PATH,
    });
  });
}
