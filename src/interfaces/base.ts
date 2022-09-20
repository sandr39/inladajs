export interface IAction<TACTION_NAMES extends string, TPLUGIN_NAMES extends string> {
  name: TACTION_NAMES,
  plugin?: TPLUGIN_NAMES
}

export type IActionRedirect<TACTION_NAMES extends string, TOBJECT_NAMES extends string> =
  [string, string, TOBJECT_NAMES, TACTION_NAMES][];

export interface IRawAction<TACTION_NAMES extends string, TOBJECT_NAMES extends string> {
  actionName: TACTION_NAMES,
  objectName: TOBJECT_NAMES
}

export type IIdObject = Record<string | 'id', unknown>

export type IEventResult = boolean | IIdObject | IIdObject[] | null | number;

export type IServiceFn = (uid: string) => Promise<void>;
