import { IActionRedirect, IRawAction } from '../interfaces/base';

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
    if (optionValue !== undefined) {
      processedEvent[option] = optionValue;
    }
  });
  delete processedEvent.options;

  return processedEvent;
};

interface IEventPreprocessor<
  TACTION_NAMES extends string,
  TOBJECT_NAMES extends string,
  > {
  makeRawEvent: (event: Record<string, unknown>, objectName: string, actionName: string, actionNameType?: string) =>
    Promise<{ rawEvent: Record<string, unknown>, rawAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>}>,
}

export const eventPreprocessorFactory = <
  TACTION_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
>(
    allowedActions: Partial<Record<TOBJECT_NAMES, TACTION_NAMES[]>>,
    allowedOptions: TOPTION_NAMES[],
    actionRedirect: IActionRedirect<TACTION_NAMES, TOBJECT_NAMES>,
    customEventPreProcessor: (event: Record<string, unknown>) => Promise<Record<string, unknown>> = async _ => _,
  ): IEventPreprocessor<TACTION_NAMES, TOBJECT_NAMES> => ({
    makeRawEvent: async (event, objectName, actionName, actionNameType?) => {
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
      processedEvent = await customEventPreProcessor(processedEvent); // what this for? for spy ability

      return { rawEvent: processedEvent, rawAction: actionAfterRedirect };
    },
  });
