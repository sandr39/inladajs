export enum AUTH_FIELDS {
  'companyId' = 'companyId',
  'userId' = 'userId',
}

export enum OPTION_NAMES_DEFAULT {
  $parentEvent = '$parentEvent',
  $useSecretFields = '$useSecretFields',
  $doNotExecAndReturnQuery = '$doNotExecAndReturnQuery',
  $doNotAfterActionProcess = '$doNotAfterActionProcess',
  $lang = '$lang',
}

export enum ACTION_NAMES_CRUD {
  create = 'create',
  delete = 'delete',
  detail = 'detail',
  list = 'list',
  update = 'update',
}

export enum OBJECT_NAMES_DEFAULT {
  none = 'none'
}

export enum ERROR_NAMES_DEFAULT {
  timeout = 'timeout',
  noSuchAction = 'noSuchAction'
}
