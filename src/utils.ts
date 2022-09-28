import { transactionProcessor } from 'inlada-transaction-processor';
import { IEvent } from './interfaces/event';

const noop = (_: any) => _;

export const safeFnCall = async <T = any>(logger: any, fn: () => Promise<void>, errorMessage: string, resultOnFail: T): Promise<T | void> => {
  try {
    return (await fn());
  } catch (ex: any) {
    // logger.log(`${errorMessage}: `, ex, ex?.stack);
  }
  return resultOnFail;
};

export const awaitTimeout = (timeout: number) => {
  let timer;
  const promise = new Promise<never>(() => {
    timer = setTimeout(() => { throw new Error('timeout'); },
      // todo with setErrorAndThrow(e, 'timeout' as TERROR_NAMES)
      timeout);
  });
  return { timer, promise };
};

export const processInTransaction = async <
  TACTION_NAMES extends string,
  TERROR_NAMES extends string,
  TOBJECT_NAMES extends string,
  TOPTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IEvent<TACTION_NAMES, TERROR_NAMES, TOBJECT_NAMES, TOPTION_NAMES, TPLUGIN_NAMES>>(
  fnAction: () => Promise<TEvent>,
  uid: string,
  onSuccessAfterCommit = (e: TEvent) => null as any,
  onFailBeforeRollback = (exception: any) => exception,
  onFailAfterRollback = noop,
  timeout?: number,
) => {
  try {
    await transactionProcessor.begin(uid);

    const resPromise = fnAction();
    let res: TEvent;
    if (timeout) {
      const { timer, promise } = awaitTimeout(timeout);
      res = await Promise.race([resPromise, promise]);
      clearTimeout(timer);
    } else {
      res = await resPromise;
    }
    await transactionProcessor.commit(uid);
    res = await safeFnCall({}, () => onSuccessAfterCommit(res), 'in onSuccessAfterSingleton, error', res) || res;
    return res;
  } catch (ex) {
    let res = await safeFnCall({}, () => onFailBeforeRollback(ex), 'in onFailBeforeSingleton, error', ex); // todo move to transaction?
    await transactionProcessor.rollback(uid);
    res = await safeFnCall({}, () => onFailAfterRollback(res), 'in onFailAfterSingleton, error', res);

    return res;
  }
};

export const filterUnique = (arr: any[]) => [...new Set(arr)];

const MAX_ARRAY_LENGTH = 10;
const MAX_STRING_LENGTH = 1024;

// todo add count
export const trimObject = (el: any, strmaxlen = MAX_STRING_LENGTH, arrmaxlen = MAX_ARRAY_LENGTH, throwError = false) => {
  let res = el;
  if (Array.isArray(el)) {
    if (el.length > arrmaxlen && throwError) {
      throw new Error('Too many elements in array');
    }
    res = el.length > arrmaxlen ? el.slice(0, 1).concat([`... and ${el.length - 1} more`]) : el;
    res = res.map((obj: any) => ((typeof obj === 'object') ? trimObject(obj) : obj));
  } else if (el && typeof el === 'object') {
    res = el?.$essentials?.() || el;
    res = Object.entries(res).reduce((acc, [k, v]) => ({ ...acc, [k]: trimObject(v) }), {});
  } else if (el && typeof el === 'string') {
    res = res.substring(0, strmaxlen);
  }
  return res;
};
