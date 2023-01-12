import { IEvent } from './event';
import { IRawAction } from './base';

export interface IEventAdapter<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  > {
  handler: (event: Record<string, unknown>, objectName: string, actionName: string, actionNameType?: string) =>
    Promise<{ rawEvent: Record<string, unknown>, rawAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>}>,
  formSuccessResult: (e: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>) => unknown
  formErrorResult: (e: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>) => unknown
  formFatalErrorResult: (exception: unknown) => unknown
}
