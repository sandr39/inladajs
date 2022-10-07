import { v4 } from 'uuid';
import { addSourceEvent, logger } from 'inlada-logger';
import {
  IActionProcessor,
  IEventProcessFn,
  IEventProcessor,
  IExceptionFromBowelsOfTheCode,
} from '../interfaces/processors';
import { IRawAction } from '../interfaces/base';
import { IContractProviderFactory, IEventFactory } from '../interfaces/factories';
import { processInTransaction } from '../utils';
import { IEventAdaptor } from '../eventAdaptor';
import { IEvent } from '../interfaces/event';
import { IEventApi } from '../interfaces/api';
import { OPTION_NAMES_DEFAULT } from '../defaults';

export const processSubEvent = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  >(
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent> => async (
    sourceEvent,
    rawAction,
  ) => {
    let event = await eventFactory(sourceEvent, rawAction, api);
    event = await actionProcessor.processEventAction(event);
    return event;
  };

export const processEvent = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
>(
    contractProviderFactory: IContractProviderFactory<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent> => async (
    sourceEvent,
    rawAction,
  ) => {
    let event = await eventFactory(sourceEvent, rawAction, api);
    addSourceEvent(event);
    const contractProvider = contractProviderFactory(event.actionName, event.me.name);

    event = await contractProvider.transformBefore(event);

    await actionProcessor.processBeforeAllActions(event);
    event = await actionProcessor.processEventAction(event);
    event = await contractProvider.transformAfter(event);
    await actionProcessor.processAfterAllActions(event);

    logger.info(event.uid, 'finished event: ', event.me.name, event.actionName);

    return event;
  };

const logOnActionFail = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  > () => async (exception: IExceptionFromBowelsOfTheCode<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>) => {
    const resultEvent = exception.event;
    if (!exception.event) {
      logger.log('exception.event is not set');
    }

    logger.error(resultEvent?.uid, resultEvent?.me.name, resultEvent?.actionName, exception?.stack);
    return exception;
  };

const processRequestActionInnerSuccess = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  >(
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>,
  ) => async (
    resultEvent: TEvent,
  ) => eventAdaptor.formSuccessResult(resultEvent);

const processActionFail = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  >(
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>,
  ) => async (exception: IExceptionFromBowelsOfTheCode<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>) => {
    const resultEvent = exception.event;
    const { error } = exception;

    if (resultEvent && error) {
      await processInTransaction<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>(
        async () => {
          await resultEvent.processError();
          return resultEvent;
        },
        resultEvent.uid,
        undefined,
        ex => {
          logger.error(resultEvent.uid, 'in processRequestActionInnerFail', ex?.stack);
        },
      );
      if (resultEvent?.error) {
        return eventAdaptor.formErrorResult(resultEvent);
      }
    }

    return eventAdaptor.formFatalErrorResult(exception);
  };

const processRequest = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
  >(
    processEventFn: IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>,
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>,
  ) => {
  const processRequestActionInnerSuccessFn = processRequestActionInnerSuccess(eventAdaptor);
  const logOnActionFailFn = logOnActionFail();
  const processActionFailFn = processActionFail(eventAdaptor);

  return async (
    sourceEvent: Record<string, unknown>, rawAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
  ) => {
    const uid = v4();

    return processInTransaction<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>(
      () => processEventFn({ ...sourceEvent, [OPTION_NAMES_DEFAULT.$uid]: uid }, rawAction),
      uid,
      processRequestActionInnerSuccessFn,
      logOnActionFailFn,
      processActionFailFn,
    );
  };
};

export const eventProcessorFactory = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>
> (
    contractProviderFactory: IContractProviderFactory<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>,
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>,
  ) => {
  const api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent> = {
    processSubEvent: (_: any) => _,
    mergeIntoParentEvent: actionProcessor.mergeIntoParentEvent,
  };

  const processEventFn = processEvent(contractProviderFactory, actionProcessor, eventFactory, api);
  const processSubEventFn = processSubEvent(actionProcessor, eventFactory, api);

  api.processSubEvent = processSubEventFn;

  return {
    processEvent: processEventFn,
    processSubEvent: processSubEventFn,
    processRequest: processRequest(processEventFn, eventAdaptor),
  } as IEventProcessor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, TEvent>;
};
