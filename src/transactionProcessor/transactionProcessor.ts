import { PriorityList } from './priorityList';
import { IServiceFn } from '../interfaces/base';
import { ITransactionService } from '../interfaces/processors';

const singletonInnerStructure = {
  massActions: {
    $success: new PriorityList<IServiceFn>(),
    $fail: new PriorityList<IServiceFn>(),
    $start: new PriorityList<IServiceFn>(),
  },
  services: {},
};

const registerTransactionService = (obj: ITransactionService, priority?: number) => {
  if (obj.onSuccess) {
    singletonInnerStructure.massActions.$success.add(priority, obj.onSuccess);
  }
  if (obj.onFail) {
    singletonInnerStructure.massActions.$fail.add(priority, obj.onFail);
  }
  if (obj.onStart) {
    singletonInnerStructure.massActions.$start.add(priority, obj.onStart);
  }
};

const mass = async (fnList: PriorityList<IServiceFn>, uid: string) => fnList
  .get()
  .reduce((acc, f = () => Promise.resolve()) => acc.then(() => f(uid)), Promise.resolve())
  .catch(err => {
    // logger.error(err.stack)
  });

const onStart = (uid: string) => mass(singletonInnerStructure.massActions.$start, uid);
const onSuccess = (uid: string) => mass(singletonInnerStructure.massActions.$start, uid);
const onFail = (uid: string) => mass(singletonInnerStructure.massActions.$fail, uid);

export const transactionProcessor = {
  registerTransactionService,
  begin: onStart,
  commit: onSuccess,
  rollback: onFail,
};
