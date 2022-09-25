import { IEventFactory } from '../interfaces/factories';
import { IRawAction } from '../interfaces/base';
import { IErrorThrower } from '../errors';
import { IEvent } from '../interfaces/event';
import { IEntityRelation, IStorageClientFactory } from '../interfaces/storage';
import { IEventApi } from '../interfaces/api';
import { IObjectInfo } from '../interfaces/objectInfo';

export const eventFactoryFactory = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery, // todo some interface
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(
    errorThrower: IErrorThrower<TERROR_NAMES, TEvent>,
    fullObjectsInfo: Partial<Record<TOBJECT_NAMES, IObjectInfo<TOBJECT_NAMES>>>,
    relations: IEntityRelation<TOBJECT_NAMES>[],
    storageFactory: IStorageClientFactory,
    EventConstructor: any, // todo type
  ): IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent> => async (
    sourceEvent: Record<string, unknown>,
    actionParams: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): Promise<TEvent> => {
    const resultEvent = new EventConstructor(
      sourceEvent, actionParams.actionName, actionParams.objectName, errorThrower, fullObjectsInfo, relations, api, storageFactory,
    );

    await resultEvent.init();

    return resultEvent;
  };
