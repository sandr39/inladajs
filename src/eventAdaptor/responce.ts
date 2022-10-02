import { IResultError } from '../interfaces/error';
import { IAnyEvent } from '../interfaces/event';

enum RESPONSE_STATUS {
  ok = 200,
  noAccess = 403,
  notFound = 404,
  error = 500,
}

const response = (status = RESPONSE_STATUS.ok, body: any) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export const responseError = (error: {error?: IResultError<any>}) => {
  const errorObject = { error: error.error };
  return response(error.error?.status || RESPONSE_STATUS.error, errorObject);
};

export const responseNotError = <TEvent extends IAnyEvent>(event: TEvent) => {
  let result;
  // 1. have error field set
  if (event.error) {
    result = {
      error: event.error,
    };
  } else if (typeof event.result === 'object') {
    if (Array.isArray(event.result)) { // list
      result = event.result;
    } else if (event.result === null) { // empty detail
      result = null;
    // } else if ([ACTION_NAMES_CRUD.create, ACTION_NAMES_CRUD.update].includes(event.actionName)) {
    //   // object, add request params
    //   result = {
    //     ...Object.fromEntries(Object.entries(event.get()).filter(([k]) => !k.startsWith('$'))),
    //     ...event.result,
    //     ...event.getCreated(),
    //   };
    } else {
      result = event.result;
    }
  } else {
    // not object, f.e. bool
    result = event.result;
  }

  return response(event.error?.status || RESPONSE_STATUS.ok, result);
};
