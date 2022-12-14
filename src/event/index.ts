import { IEventFactory } from '../interfaces/factories';
import { IRawAction } from '../interfaces/base';
import { IEvent } from '../interfaces/event';
import { IEntityRelation } from '../interfaces/storage';
import { IEventApi } from '../interfaces/api';
import { IObjectInfo } from '../interfaces/objectInfo';
import { IError } from '../interfaces/error';

export const eventFactoryFactory = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  >(
    errors: Record<TERROR_NAMES, IError<TERROR_NAMES, TEvent>>,
    fullObjectsInfo: Partial<Record<TOBJECT_NAMES, IObjectInfo<TOBJECT_NAMES>>>,
    relations: IEntityRelation<TOBJECT_NAMES>[],
    EventConstructor: any, // todo type
  ): IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent> => async (
    sourceEvent: Record<string, unknown>,
    actionParams: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): Promise<TEvent> => new EventConstructor(
    sourceEvent, actionParams.actionName, actionParams.objectName, errors, fullObjectsInfo, relations, api,
  );
