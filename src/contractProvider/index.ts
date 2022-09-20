import { TransformStages } from '../enums';
import { IAnyEvent } from '../interfaces/event';

import { IContractProvider } from '../interfaces/processors';
import { IContractProviderFactory } from '../interfaces/factories';
import { ITransformation, ITransformEachFn, ITransformFn } from '../interfaces/contract';
import { IIdObject } from '../interfaces/base';

const transformWhole = async <TEvent extends IAnyEvent>(
  event: TEvent, transformFunction: ITransformFn<TEvent> | undefined,
): Promise<TEvent> => {
  if (transformFunction) {
    return transformFunction(event);
  }
  return event;
};

const transformEach = async <TEvent extends IAnyEvent>(
  event: TEvent, transformFunction: ITransformEachFn<TEvent> | undefined,
): Promise<TEvent> => {
  if (!transformFunction) {
    return event;
  }

  const partToTransform = event.result;
  if (partToTransform === null) {
    // empty result on detail
    return event;
  }

  const processedEvent = event;
  if (Array.isArray(partToTransform)) {
    processedEvent.result = await Promise.all(partToTransform.map(r => transformFunction(r, processedEvent))) as IIdObject[];
  } else {
    processedEvent.result = await transformFunction(partToTransform, processedEvent);
  }

  return processedEvent;
};

export const contractProviderFactory = <
  TACTION_NAMES extends string,
  TOBJECTS_NAMES extends string,
  TEvent extends IAnyEvent
  >(
    contracts: Partial<Record<TOBJECTS_NAMES, ITransformation<TACTION_NAMES, TEvent>>>,
    fnBeforeEvery?: ITransformFn<TEvent>,
  ): IContractProviderFactory<TACTION_NAMES, TOBJECTS_NAMES, TEvent> => (
    actionName: TACTION_NAMES, objectName: TOBJECTS_NAMES,
  ): IContractProvider<TEvent> => {
    const contract = contracts?.[objectName]?.[actionName];
    return {
      transformBefore: async (e: TEvent) => {
        const processedBefore = await transformWhole<TEvent>(e, fnBeforeEvery);
        return transformWhole<TEvent>(processedBefore, contract?.[TransformStages.transformBefore]);
      },
      transformAfter: async (e: TEvent) => {
        const processedEvent = await transformWhole(e, contract?.[TransformStages.transformAfter]);
        return transformEach(processedEvent, contract?.[TransformStages.transformAfterEach]);
      },
    };
  };
