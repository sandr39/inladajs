import { IActionRedirect, IRawAction } from '../interfaces/base';
import { IEvent } from '../interfaces/event';
import { responseError, responseNotError } from './responce';
import { logger } from "inlada-logger";

const redirectAction = <TACTION_NAMES extends string, TOBJECT_NAMES extends string>(
  { actionName, objectName }: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
  event: Record<string, unknown>,
  actionRedirect: IActionRedirect<TACTION_NAMES, TOBJECT_NAMES>,
): IRawAction<TACTION_NAMES, TOBJECT_NAMES> => {
  let result = { actionName, objectName };

  const routingToChange = actionRedirect.find(([fromObjectName, fromActionName]) => (actionName === fromActionName && objectName === fromObjectName));
  if (routingToChange) {
    const [, , toObjectName, toActionName] = routingToChange;
    result = { actionName: toActionName, objectName: toObjectName };
  }

  return result as IRawAction<TACTION_NAMES, TOBJECT_NAMES>;
};

const actionIsAllowed = <TACTION_NAMES extends string, TOBJECT_NAMES extends string>(
  action : IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
  allowedActions: Partial<Record<TOBJECT_NAMES, TACTION_NAMES[]>>,
) => allowedActions[action.objectName as TOBJECT_NAMES]?.find(a => a === action.actionName);

const processOptions = <TOPTION_NAMES extends string>(event: Record<string, unknown>, allowedOptions: TOPTION_NAMES[]) => {
  const processedEvent = event;
  allowedOptions.forEach(option => {
    const optionValue = processedEvent[option]
      || processedEvent[option.replace('$', '')]
      || (processedEvent.options as Record<string, unknown>)?.[option]
      || (processedEvent.options as Record<string, unknown>)?.[option.replace('$', '')];
    delete processedEvent[option.replace('$', '')];
    if(optionValue !== undefined) {
      processedEvent[option] = optionValue;
    }
  });
  delete processedEvent.options;

  return processedEvent;
};

export interface IEventAdaptor<
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  > {
  makePreEvent: (event: Record<string, unknown>, objectName: string, actionName: string, actionNameType?: string) =>
    Promise<{ preEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>}>,
  formSuccessResult: (e: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>) => unknown
  formErrorResult: (e: IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>) => unknown
  formFatalErrorResult: (exception: unknown) => unknown
}

export const eventAdaptorFactory = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
>(
    allowedActions: Partial<Record<TOBJECT_NAMES, TACTION_NAMES[]>>,
    allowedOptions: TOPTION_NAMES[],
    actionRedirect: IActionRedirect<TACTION_NAMES, TOBJECT_NAMES>,
    customEventProcessor: (event: Record<string, unknown>) => Promise<Record<string, unknown>>,
  ): IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES> => ({
    makePreEvent: async (event, objectName, actionName, actionNameType?) => {
      const effectiveActionName = `${actionName}${actionNameType ? `-${actionNameType}` : ''}`;
      const actionAfterRedirect = redirectAction<TACTION_NAMES, TOBJECT_NAMES>(
        { actionName: effectiveActionName as TACTION_NAMES, objectName: objectName as TOBJECT_NAMES },
        event,
        actionRedirect,
      );

      if (!actionIsAllowed<TACTION_NAMES, TOBJECT_NAMES>(actionAfterRedirect, allowedActions)) {
        throw new Error(`Action '${actionAfterRedirect.actionName}' is not allowed for '${actionAfterRedirect.objectName}'`);
      }
      let processedEvent = processOptions(event, allowedOptions);
      processedEvent = await customEventProcessor(processedEvent); // what this for? for spy ability

      return { preEvent: processedEvent, preAction: actionAfterRedirect };
    },
    formSuccessResult: e => responseNotError(e),
    formErrorResult: e => responseError(e),
    formFatalErrorResult: (exception: unknown) => {
      logger.error((exception as any).stack, (exception as any).message);
    },
  });
