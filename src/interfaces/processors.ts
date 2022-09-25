import { IAnyEvent, IEvent } from './event';
import { IRawAction } from './base';
import { ITransformFn } from './contract';

export type IEventProcessFn<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  > = (
  sourceEvent: Record<string, unknown>,
  preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
) => Promise<TEvent>

export interface IExceptionFromBowelsOfTheCode<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  > {
  [k: string] : any,
  $event: TEvent
  stack: any
}

export interface IEventProcessor<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  > {
  processEvent: (
    sourceEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>
  ) => Promise<TEvent>,
  processSubEvent: (
    sourceEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>
  ) => Promise<TEvent>,
  processRequest: (
    sourceEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>
  ) => Promise<any> // todo return func, type from event adaptor, to write smth like return fn(res, lambdaRes)
}

export interface IActionProcessor<TEvent extends IAnyEvent> {
  processBeforeAllActions: (e: TEvent) => Promise<void>
  processEventAction: (e: TEvent) => Promise<TEvent>
  processAfterAllActions: (e: TEvent) => Promise<void>
  mergeIntoParentEvent: (e: TEvent) => Promise<void>
}

export interface IContractProvider<TEvent extends IAnyEvent> {
  transformBefore: ITransformFn<TEvent>,
  transformAfter: ITransformFn<TEvent>,
}
