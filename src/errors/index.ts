import { IError, IResultError } from '../interfaces/error';

interface IEventErrorStub<TERROR_NAMES extends string> {
  error?: IResultError<TERROR_NAMES>
  setError: (errorName: TERROR_NAMES, error: IError<TERROR_NAMES, any>, details?: any) => any
}

const processErrorInner = <
  TERROR_NAMES extends string, TEvent extends IEventErrorStub<TERROR_NAMES>
  >(errors: { [errName in TERROR_NAMES]: IError<TERROR_NAMES, TEvent> }) => {
  const resultFunc = async (event: TEvent, errorName: TERROR_NAMES): Promise<TEvent> => {
    const { handler } = errors[errorName];
    if (handler) {
      const newErr = await handler(event);
      if (newErr && newErr !== errorName) {
        await resultFunc(event, newErr);
      }
    }
    event.setError(errorName, errors[errorName]);

    return event;
  };

  return resultFunc;
};

// wtf?
// const getErrorTypeFromOriginalException = <TERROR_NAMES extends string>(error: TERROR_NAMES, originalEx?: any) => {
//   if (originalEx?.pgOrigin && originalEx?.pgOrigin?.code === '22001') {
//     return EErrors.valueTooLong;
//   }
//   return error;
// };

const setErrorAndThrow = <TERROR_NAMES extends string, TEvent extends IEventErrorStub<TERROR_NAMES>>(
  errors: { [errName in TERROR_NAMES]: IError<TERROR_NAMES, TEvent> },
) => (event: TEvent, errorName: TERROR_NAMES, data?: any, originalEx?: any) => {
    event.setError(errorName, errors[errorName], data);
    const exception = originalEx || new Error(errorName);
    exception.error = event.error;
    exception.event = event;
    throw exception;
  };

export interface IErrorThrower<TERROR_NAMES extends string, TEvent extends IEventErrorStub<TERROR_NAMES>> {
  setErrorAndThrow: (event: TEvent, error: TERROR_NAMES, data?: any, originalEx?: any) => never,
  processError: (event: TEvent, errorName: TERROR_NAMES)=> Promise<TEvent>,
}

export type IErrorThrowerFactory = <
  TERROR_NAMES extends string, TEvent extends IEventErrorStub<TERROR_NAMES>
  >(errors: { [errName in TERROR_NAMES]: IError<TERROR_NAMES, TEvent> }) => IErrorThrower<TERROR_NAMES, TEvent>;

export const errorThrowerFactory: IErrorThrowerFactory = <
  TERROR_NAMES extends string, TEvent extends IEventErrorStub<TERROR_NAMES>
  >(errors: { [errName in TERROR_NAMES]: IError<TERROR_NAMES, TEvent> }) => ({
    setErrorAndThrow: setErrorAndThrow<TERROR_NAMES, TEvent>(errors),
    processError: processErrorInner<TERROR_NAMES, TEvent>(errors),
  });
