import { v4 } from 'uuid';
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

export const processSubEvent = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent> => async (
    sourceEvent,
    preAction,
  ) => {
    let event = await eventFactory(sourceEvent, preAction, api);
    event = await actionProcessor.processEventAction(event);
    return event;
  };

export const processEvent = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
>(
    contractProviderFactory: IContractProviderFactory<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>,
    api: IEventApi<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
  ): IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent> => async (
    sourceEvent,
    preAction,
  ) => {
    let event = await eventFactory(sourceEvent, preAction, api);

    const contractProvider = contractProviderFactory(preAction.actionName, preAction.objectName);

    event = await contractProvider.transformAfter(event);

    await actionProcessor.processBeforeAllActions(event);
    event = await actionProcessor.processEventAction(event);
    event = await contractProvider.transformAfter(event);
    await actionProcessor.processAfterAllActions(event);

    // logger.info('finished event: ', event.me.name, event.actionName);

    return event;
  };

const logOnActionFail = async <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(exception: IExceptionFromBowelsOfTheCode<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>) => {
  const resultEvent = exception.$event;
  if (!exception.$event) {
    // logger.log('exception.$event is not set');
  }

  // logger.error(resultEvent?.me.name, resultEvent?.actionName, exception?.stack);
  return exception;
};

const processRequestActionInnerSuccess = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  ) => async (
    resultEvent: TEvent,
  ) => eventAdaptor.formSuccessResult(resultEvent);

const processActionFail = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(
    eventAdaptor: IEventAdaptor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>,
  ) => async (exception: IExceptionFromBowelsOfTheCode<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>) => {
    const resultEvent = exception.$event;
    const error = exception.$error;

    if (resultEvent && error) {
      await processInTransaction<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => resultEvent.errorThrower.processError(resultEvent, error.type), // todo understand and fix
        resultEvent.uid,
        ex => {
          // logger.error('in processRequestActionInnerFail', ex?.stack)
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
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
  >(
    processEventFn: IEventProcessFn<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>,
  ) => async (
    sourceEvent: Record<string, unknown>, preAction: IRawAction<TACTION_NAMES, TOBJECT_NAMES>,
  ) => {
    const uid = v4();

    return processInTransaction<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>(
      () => processEventFn(sourceEvent, preAction),
      uid,
      processRequestActionInnerSuccess,
      logOnActionFail,
      processActionFail,
    );
  };

export const eventProcessorFactory = <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  IQuery,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery>
> (
    contractProviderFactory: IContractProviderFactory<TACTION_NAMES, TOBJECT_NAMES, TEvent>,
    actionProcessor: IActionProcessor<TEvent>,
    eventFactory: IEventFactory<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>,
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
    processRequest: processRequest(processEventFn),
  } as IEventProcessor<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES, IQuery, TEvent>;
};