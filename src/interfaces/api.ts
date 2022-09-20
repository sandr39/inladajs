import { IRawAction } from './base';

export interface IEventApi<TACTION_NAMES extends string, TOBJECT_NAMES extends string, TEvent> {
  processSubEvent: (e: Record<string, unknown>, ap: IRawAction<TACTION_NAMES, TOBJECT_NAMES>) => Promise<TEvent>,
  mergeIntoParentEvent: (e: TEvent)=> Promise<void>
}
