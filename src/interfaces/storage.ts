export enum JOIN_TYPES {
  inner = 'inner',
  outer = 'outer',
  left = 'left',
  right = 'right',
}

export enum RELATION_TYPE {
  one = 1,
  many = 2,
  self = 3,
  oneToOne = 4,
}

export interface IEntityRelation<OBJECT_NAMES extends string> {
  entities: [OBJECT_NAMES, OBJECT_NAMES]
  type: RELATION_TYPE
  table: OBJECT_NAMES | string
  idFields: string | string[]
  joinType?: JOIN_TYPES
  fieldNameInQuery: string[]
}

export interface IStorageClient {
  query: <T = Record<any, any>>(query: string, params?: any[]) => Promise<{ rows: T[] }>
  begin: () => Promise<void>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  finalize: () => Promise<void>
  getTableColumns: (table: string) => Promise<string[]>
  getTableUniqueKey: (table: string) => Promise<string>
}

export type IStorageClientFactory = (uid: string) => Promise<IStorageClient>;
