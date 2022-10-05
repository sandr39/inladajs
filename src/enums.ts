export enum PLUGIN_APPLY_STAGE {
  BEFORE_ALL = 'BEFORE_ALL',
  BEFORE = 'BEFORE',
  BEFORE_ACTION = 'BEFORE_ACTION',
  ACTION = 'ACTION',
  MODIFY_QUERY = 'MODIFY_QUERY',
  FINALIZE_ACTION = 'FINALIZE_ACTION',
  AFTER_ACTION = 'AFTER_ACTION',
  AFTER = 'AFTER',
  AFTER_ALL = 'AFTER_ALL',
  MERGE = 'MERGE',
}

export enum TransformStages {
  transformBefore = 'transformBefore',
  transformAfter = 'transformAfter',
  transformAfterEach = 'transformAfterEach',
}

export enum PLUGIN_INFO_FIELD_NAMES {
  NAME= 'name',
  SECTION_NAME= 'settings',
}

export const AFTER_ACTION_STAGES = [
  PLUGIN_APPLY_STAGE.AFTER_ACTION,
  PLUGIN_APPLY_STAGE.AFTER,
  PLUGIN_APPLY_STAGE.AFTER_ALL,
];
