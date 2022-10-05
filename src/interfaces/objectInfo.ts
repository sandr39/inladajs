export interface IObjectInfo<TOBJECT_NAMES extends string> {
  table: string,
  fields?: Record<string, {
    type?: any,
    alias?: string,
    outer?: boolean,
  }>,
  fieldsToGet?: string[],
  addWhere?:string[],

  socketMessage?: {
    all?: string[],
    notMe?: string[],
    specificUser?: string[],
  },
  archive?: boolean,
  parentEntity?: TOBJECT_NAMES[] | TOBJECT_NAMES,
  where?: Record<string, string>,
  fieldsToExtend?: string[],
  fieldsToUpdate?: string[],
  fieldsToInsert?: string[],
  parentFields?: Record<string, string>,

  createDefaults?: Record<any, any | (() => any)>,
  notification?: Record<any, any>,
  processRecursively?: TOBJECT_NAMES[],
  usersField?: string,
  noNeedToReturn?:boolean,
  name?:string,
}
