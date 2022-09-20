import { IEventResult } from './base';
import { IAnyEvent } from './event';

export type IPluginPureFunction<TEvent extends IAnyEvent> = (e: TEvent) => Promise<void> | void;
export type IPluginResultFunction<TEvent extends IAnyEvent> = (e: TEvent) => Promise<IEventResult>;
