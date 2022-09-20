import { TransformStages } from '../enums';
import { IAnyEvent } from './event';
import { IEventResult } from './base';

export type ITransformFn<TEvent extends IAnyEvent> = (e: TEvent) => Promise<TEvent>;
export type ITransformEachFn<TEvent extends IAnyEvent> = (r: any, e: TEvent) => Promise<IEventResult> | IEventResult;

export type ITransformAction<TEvent extends IAnyEvent> = {
  [TransformStages.transformBefore]?: ITransformFn<TEvent>,
  [TransformStages.transformAfter]?: ITransformFn<TEvent>,
  [TransformStages.transformAfterEach]?: ITransformEachFn<TEvent>,
}

export type ITransformation<TACTION_NAMES extends string, TEvent extends IAnyEvent> =
  Partial<Record<TACTION_NAMES, ITransformAction<TEvent>>>
