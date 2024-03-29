export { ERROR_NAMES_DEFAULT, OPTION_NAMES_DEFAULT } from './defaults';

export {
  IIdObject, IActionRedirect, IEventResult, IRawAction,
} from './interfaces/base';
export {
  IEntityRelation, RELATION_TYPE, IStorageClientFactory, IStorageClient,
} from './interfaces/storage';

export { IEventApi } from './interfaces/api';
export { IObjectInfo } from './interfaces/objectInfo';
export { IError, IResultError } from './interfaces/error';
export { IAnyEvent, IEvent } from './interfaces/event';

export { Event } from './event/event';

export { eventFactoryFactory } from './event';
export { IEventFactory, IActionProcessorFactory } from './interfaces/factories';

export { IPlugin, IPluginSet } from './interfaces/plugin';

export { PLUGIN_APPLY_STAGE, TransformStages } from './enums';
export { ITransformation, ITransformFn } from './interfaces/contract';

export { eventProcessorFactory } from './eventProcessor';
export { eventPreprocessorFactory } from './eventPreprocessor';
export { contractProviderFactory } from './contractProvider';
export { actionProcessorFactory } from './actionProcessor';

export { IHandler } from './interfaces/handler';
