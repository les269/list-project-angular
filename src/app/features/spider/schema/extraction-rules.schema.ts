import {
  applyEach,
  PathKind,
  required,
  SchemaPath,
  SchemaPathRules,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
import { ExtractionRule, ExtractionRuleMode } from '../model';
import {
  areNestedPipelinesCompatible,
  isPipelineCompatible,
} from '../model/pipeline-mode';

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
    applyEach(row.pipelines, pipeline => {
      validate(pipeline, ({ value }) =>
        areNestedPipelinesCompatible(value())
          ? undefined
          : {
              kind: 'pipelineMode',
              message: 'pipeline.incompatibleMode',
            }
      );
      validate(pipeline.type, ({ value, valueOf }) =>
        isPipelineCompatible(value(), valueOf(mode))
          ? undefined
          : {
              kind: 'pipelineMode',
              message: 'pipeline.incompatibleMode',
            }
      );
    });
  });
}
