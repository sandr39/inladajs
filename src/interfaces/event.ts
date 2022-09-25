import { IEventResult, IRawAction } from './base';
import { IErrorThrower } from '../errors';
import { IStorageClient, IStorageClientFactory } from './storage';
import { IResultError, IError } from './error';

import { AUTH_FIELDS } from '../defaults';
import { IObjectInfo } from './objectInfo';

export interface IMeInfo<TOBJECT_NAMES extends string> {
  name: TOBJECT_NAMES,
  type?: IObjectInfo<TOBJECT_NAMES>,
  id: number[],
}

export interface IEvent<TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery
  > {
  actionName: TACTION_NAMES
  me: IMeInfo<TOBJECT_NAMES>
  parent: IMeInfo<TOBJECT_NAMES>[]

  result: IEventResult
  parentEvent?: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  childrenEvents: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>[]

  query?: IQuery
  error?: IResultError<TERROR_NAMES>
  errorThrower: IErrorThrower<TERROR_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>>
  storageClientFactory: IStorageClientFactory
  storageClient: IStorageClient

  uid: string

  init: () => Promise<void>

  add: (fieldName: string | TOPTION_NAMES, value: any) => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  addOption: (fieldName: TOPTION_NAMES, value?: unknown) => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  get:(fieldName?: string) => any | Record<string, unknown>,
  remove:(fieldName: string)=> IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  useSecret: () => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  getSecret: () => { [k in AUTH_FIELDS]?: number },
  getOptions: (optionName?: TOPTION_NAMES) => Partial<Record<TOPTION_NAMES, any>> | unknown | undefined, // todo split this func into two different

  getMeId: () => number, // fails if not the only id
  getGeneralIdentity: () => number[], // return all ids or []

  reParseIds: () => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  addCreated: (obj: { [k in TOBJECT_NAMES]?: number }) => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  getCreated: () => { [k in TOBJECT_NAMES]?: number },

  reParseAction: (newAction?: TACTION_NAMES, result?: any) =>
    IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  reParseMe: (objectName: TOBJECT_NAMES) => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,

  getPluginData:(pluginName: TPLUGIN_NAMES) => any,
  setPluginData: (pluginName: TPLUGIN_NAMES, data: any) => IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>;

  setError: (
    errorName: TERROR_NAMES,
    error: IError<TERROR_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>>,
    details?: any
  ) =>
    IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>

  getEventPart: () => any, // todo make only one
  mainInfo: () => any, // todo make only one
  essentials: () => any, // todo make only one

  processNewEvent: (newEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>) => any,
}

export type IAnyEvent = IEvent<any, any, any, any, any, any>;
