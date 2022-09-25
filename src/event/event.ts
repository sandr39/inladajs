import { v4 } from 'uuid';
import { IEventResult, IRawAction } from '../interfaces/base';
import { IEvent, IMeInfo } from '../interfaces/event';

import { IErrorThrower } from '../errors';
import { IEntityRelation, IStorageClient, IStorageClientFactory } from '../interfaces/storage';
import { IResultError, IError } from '../interfaces/error';
import { AUTH_FIELDS, OPTION_NAMES_DEFAULT } from '../defaults';
import { IEventApi } from '../interfaces/api';
import { IObjectInfo } from '../interfaces/objectInfo';
import { filterUnique, trimObject } from '../utils';

export class Event
<TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string
  > implements IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES> {
  private readonly source: Record<string, unknown>
  private data: {
    params: Partial<Record<TOPTION_NAMES, unknown>>,
    secret: { userId?: number, companyId?: number },
    data: Record<string, unknown>,
    lower: Record<string, string>,
    prevData: unknown,
    created: Partial<Record<TOBJECT_NAMES, number>>
  } = {
    params: {},
    secret: {},
    data: {},
    lower: {},
    prevData: null,
    created: {},
  }

  errorThrower: IErrorThrower<TERROR_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>>
  storageClient: IStorageClient = {} as unknown as IStorageClient
  storageClientFactory: IStorageClientFactory

  private glob: {
    fullInfo: Partial<Record<TOBJECT_NAMES, IObjectInfo<TOBJECT_NAMES>>>,
    relations: IEntityRelation<TOBJECT_NAMES>[],
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>>,
    tz: number,
  }

  actionName: TACTION_NAMES
  me: IMeInfo<TOBJECT_NAMES>
  parent: IMeInfo<TOBJECT_NAMES>[]

  private pluginData: Partial<Record<TPLUGIN_NAMES, unknown>> = {}

  result: IEventResult = null
  parentEvent?: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES> = undefined
  childrenEvents: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>[] = []

  error?: IResultError<TERROR_NAMES> = undefined

  uid: string

  constructor(
    sourceEvent: Record<string, unknown>,
    actionName: TACTION_NAMES,
    objectName: TOBJECT_NAMES,
    errorThrower: IErrorThrower<TERROR_NAMES, any>,
    fullObjectsInfo: Partial<Record<TOBJECT_NAMES, IObjectInfo<TOBJECT_NAMES>>>,
    relations: IEntityRelation<TOBJECT_NAMES>[],
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>>,
    pgClientFactory: IStorageClientFactory,
  ) {
    this.source = sourceEvent;
    this.actionName = actionName;
    this.uid = v4();

    this.parentEvent = undefined;

    this.errorThrower = errorThrower;

    this.glob = {
      fullInfo: fullObjectsInfo,
      relations,
      api,
      tz: 0,
    };

    this.me = {
      id: filterUnique(['id', 'ids', `${objectName}Id`]
        .map(k => this.get(k))
        .filter(k => typeof k === 'string' || typeof k === 'number' || Array.isArray(k))
        .map(k => (Array.isArray(k) ? k.map(Number) : +k))
        .flat(1)) as number[],
      name: objectName,
      type: this.glob.fullInfo[objectName],
    };

    this.parent = [this.me.type?.parentEntity || []]
      .flat(2)
      .map(e => [e, `${this.glob.fullInfo[e]?.name || e}Id`])
      .map(([e, k]) => [this.get(k) || this.getSecret()[k as AUTH_FIELDS], e])
      .filter(([id]) => id !== undefined)
      .map(([id, e]) => ({
        id,
        name: this.glob.fullInfo[e as TOBJECT_NAMES]?.name || e,
        type: this.glob.fullInfo[e as TOBJECT_NAMES],
      } as IMeInfo<TOBJECT_NAMES>));

    Object.entries(this.source).forEach(([k, v]) => this.add(k, v));

    // todo via params
    this.storageClientFactory = pgClientFactory;
    // this.reParseIds();
    // this.reParseAction();
  }

  async init() {
    this.storageClient = await this.storageClientFactory(this.uid);
  }

  add(fieldName: string | TOPTION_NAMES, value: any) {
    if (fieldName[0] === '$') {
      return this.addOption(fieldName as TOPTION_NAMES, value);
    }
    if (fieldName in AUTH_FIELDS) {
      this.data.secret[fieldName as AUTH_FIELDS] = value;
    }
    if (!(fieldName in AUTH_FIELDS) || this.data.params[OPTION_NAMES_DEFAULT.$useSecretFields as TOPTION_NAMES]) {
      this.data.data[fieldName] = value;
      this.data.lower[fieldName.toLowerCase()] = fieldName;
    }
    return this;
  }

  addOption(fieldName: TOPTION_NAMES, value: unknown = true) {
    // logger.assert(fieldName[0] !== '$', 'Option name should start from $');
    // logger.assert(fieldName === OPTION_NAMES_DEFAULT.$useSecretFields && !value, 'useSecretFields can be used only with true');

    if (fieldName === OPTION_NAMES_DEFAULT.$useSecretFields) {
      this.useSecret();
    } else if (fieldName === OPTION_NAMES_DEFAULT.$parentEvent) {
      this.parentEvent = value as IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>;
      this.uid = (value as IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>).uid;
    } else {
      this.data.params[fieldName] = value;
    }
    return this;
  }

  getOptions(optionName?: TOPTION_NAMES) {
    if (optionName) {
      return this.data.params?.[optionName];
    }
    return this.data.params;
  }

  // todo don't return reference
  get(fieldName?: string): any {
    if (fieldName === undefined) {
      return this.data.data;
    }
    let result = this.data.data[fieldName];
    if (result === undefined && this.data.lower[fieldName.toLowerCase()]) {
      result = this.data.data[this.data.lower[fieldName.toLowerCase()]];
    }

    return result;
  }

  remove(fieldName: string) {
    delete this.data.data[fieldName];
    delete this.data.lower[fieldName.toLowerCase()];
    delete this.data.secret[fieldName as AUTH_FIELDS];

    return this;
  }

  useSecret() {
    this.data.params[OPTION_NAMES_DEFAULT.$useSecretFields as TOPTION_NAMES] = true;
    return Object.values(AUTH_FIELDS)
      .filter(f => this.getSecret()[f] !== undefined)
      .reduce((acc, f) => acc.add(f, acc.getSecret()[f]), this);
  }

  getSecret() { // todo not ref
    return this.data.secret;
  }

  getMeId() {
    if (this.me.id?.length !== 1) {
      //      this.errorProvider.setErrorAndThrow(EErrors.notEnoughParams, ['id', '<entityType Id>']);
    }

    return this.me.id[0];
  }

  getGeneralIdentity() {
    return this.me.id;
  }

  reParseMe(objectName: TOBJECT_NAMES) {
    // logger.assert(!this.glob.fullInfo[objectName], `No such objectName "${objectName}"`);
    this.me = {
      id: this.me.id,
      name: objectName,
      type: this.glob.fullInfo[objectName],
    };
    return this.reParseIds();
  }

  // todo dry
  reParseIds() {
    this.me = {
      id: filterUnique(['id', 'ids', `${this.me.name}Id`]
        .map(k => this.get(k))
        .filter(k => typeof k === 'string' || typeof k === 'number' || Array.isArray(k))
        .map(k => (Array.isArray(k) ? k.map(Number) : +k))
        .flat(1)) as number[],
      name: this.me.name,
      type: this.glob.fullInfo[this.me.name],
    };

    this.parent = [this.me.type?.parentEntity || []]
      .flat(2)
      .map(e => [e, `${this.glob.fullInfo[e]?.name || e}Id`])
      .map(([e, k]) => [this.get(k) || this.getSecret()[k as AUTH_FIELDS], e])
      .filter(([id]) => id !== undefined)
      .map(([id, e]) => ({
        id,
        name: this.glob.fullInfo[e as TOBJECT_NAMES]?.name || e,
        type: this.glob.fullInfo[e as TOBJECT_NAMES],
      } as IMeInfo<TOBJECT_NAMES>));

    return this;
  }

  addCreated(obj: { [k in TOBJECT_NAMES]?: number }) {
    this.data.created = { ...this.data.created, ...obj };
    return this;
  }

  getCreated() {
    return this.data.created;
  }

  reParseAction(newAction?: TACTION_NAMES, result?: any) {
    if (newAction) {
      this.actionName = newAction;
    }

    if (result !== undefined) {
      this.result = result;
    }

    return this;
  }

  async processNewEvent(newEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>) {
    const childEvent = {
      ...this.getSecret(),
      ...(this.getOptions() as Record<TOPTION_NAMES, unknown>),
      ...newEvent,
      [OPTION_NAMES_DEFAULT.$parentEvent]: this,
    };

    const processedChildEvent = await this.glob.api.processSubEvent(childEvent, preAction);

    // wtf?
    this.childrenEvents.push(processedChildEvent.getEventPart());
    this.childrenEvents.push(...processedChildEvent.childrenEvents);

    await this.glob.api.mergeIntoParentEvent(processedChildEvent);

    return processedChildEvent.result;
  }

  getPluginData(pluginName: TPLUGIN_NAMES) {
    return this.pluginData[pluginName];
  }

  setPluginData(pluginName: TPLUGIN_NAMES, data: any) {
    this.pluginData[pluginName] = data;
    return this;
  }

  // get a part of event for storage
  getEventPart() {
    return ({
      action: this.actionName,
      me: { ...this.me, $type: {} },
      parent: this.parent,
      result: this.result,
      data: this.data,
      childrenEvents: this.childrenEvents,
    });
  }

  setError(
    errorName: TERROR_NAMES,
    error: IError<TERROR_NAMES, IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>>,
    details?: any,
  ) {
    this.error = {
      errorId: this.uid,
      type: errorName,
      title: error.title,
      detail: details || '',
      status: error.status,
    };

    return this;
  }

  mainInfo() {
    const res = {
      actionName: this.actionName,
      typeName: this.me.name,
      source: trimObject(JSON.parse(JSON.stringify({ ...this.source, $parentEvent: undefined })), 100),
      uid: this.uid,
    };

    delete res.source.idToken;
    delete res.source.pass;

    return res;
  }

  essentials() {
    return JSON.parse(JSON.stringify({
      $source: { ...this.source, $parentEvent: {} },
      $data: this.data,
      $action: this.actionName,
      me: { ...this.me, $type: {} },
      $parent: { $id: [this.parent].flat(2)?.[0]?.id, $name: [this.parent].flat(2)?.[0]?.name },
      pluginData: this.pluginData,
      result: this.result,
      parentEvent: this.parentEvent ? {
        //        source: { ...this.parentEvent.source, parentEvent: {} },
        //        data: this.parentEvent.data,
        action: this.parentEvent.actionName,
        me: { ...this.parentEvent.me, type: {} },
        parent: { id: [this.parentEvent.parent].flat(2)?.[0]?.id, name: [this.parentEvent.parent].flat(2)?.[0]?.name },
        //        pluginData: this.parentEvent.pluginData,
        result: this.parentEvent.result,
      } : {},
      // $childrenEvents: this.$childrenEvents,
    }));
  }
}
