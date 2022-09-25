import { IRawAction } from './base';
import { IEvent } from './event';
import { IActionProcessor, IContractProvider } from './processors';
import { IPlugin } from './plugin';
import { IEventApi } from './api';

export type IEventFactory<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES> =
    IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  > = (
    sourceEvent: Record<string, unknown>,
    actionParams: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>
  ) => Promise<TEvent>

export type IContractProviderFactory<
  TACTION_NAMES extends string,
  TOBJECT_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, any, TOBJECT_NAMES, any, any>
  > = (actionName: TACTION_NAMES, objectName: TOBJECT_NAMES) => IContractProvider<TEvent>

export type IActionProcessorFactory = <
  TACTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, any, any, any, TPLUGIN_NAMES>
  >(
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
) => IActionProcessor<TEvent>
