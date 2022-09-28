import { PLUGIN_APPLY_STAGE, PLUGIN_INFO_FIELD_NAMES } from '../enums';
import { IAnyEvent } from '../interfaces/event';
import { IPlugin } from '../interfaces/plugin';
import { ERROR_NAMES_DEFAULT } from '../defaults';

const pluginList = <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  key: PLUGIN_APPLY_STAGE, action?: TACTION_NAMES,
) => plugins
    .map(pl => [(action ? (pl[PLUGIN_APPLY_STAGE.ACTION]?.[action] || {}) : pl), pl])
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
    .map(([f, pl]) => [f[key], pl])
    .filter(([_]) => _)
    .map(([f]) => async (e: TEvent) => f(e));

const applyPluginsInner = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  key: PLUGIN_APPLY_STAGE,
  action?: TACTION_NAMES,
): Promise<void> => {
  await pluginList(plugins, key, action)
    .map(f => (async (e: TEvent) => (await f(e)) || e))
    .reduce((acc, f) => acc.then(e => f(e)), Promise.resolve(event));
};

// todo rename
const actionAction = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  action: TACTION_NAMES,
) => {
  const funcsToApply = pluginList(plugins, PLUGIN_APPLY_STAGE.ACTION, action);

  if (!funcsToApply.length) {
    event.errorThrower.setErrorAndThrow(event, ERROR_NAMES_DEFAULT.noSuchAction);
  }
  if (funcsToApply?.length) {
    return funcsToApply[0](event);
  }
  return undefined;
};

const actionFinalization = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  action: TACTION_NAMES,
) => {
  const funcsToApply = pluginList(plugins, PLUGIN_APPLY_STAGE.FINALIZE_ACTION, action);
  if (funcsToApply?.length) {
    return funcsToApply[0](event);
  }
  return undefined;
};

const applyActionInner = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  actionName: TACTION_NAMES,
) => {
  const processedEvent = event;
  await applyPluginsInner(processedEvent, plugins, PLUGIN_APPLY_STAGE.BEFORE, actionName);
  processedEvent.result = await actionAction(processedEvent, plugins, actionName);
  await applyPluginsInner(processedEvent, plugins, PLUGIN_APPLY_STAGE.MODIFY_QUERY, actionName);
  // eslint-disable-next-line no-param-reassign
  processedEvent.result = await actionFinalization(processedEvent, plugins, actionName) || event.result;
  await applyPluginsInner(processedEvent, plugins, PLUGIN_APPLY_STAGE.AFTER, actionName);
  return processedEvent;
};

export const applyAction = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
) => {
  const { actionName } = event;
  return applyActionInner(event, plugins, actionName);
};

export const applyPlugins = async <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  event: TEvent,
  plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  key: PLUGIN_APPLY_STAGE,
) => applyPluginsInner(event, plugins, key);

export const checkPluginList = <TACTION_NAMES extends string, TPLUGIN_NAMES extends string, TEvent extends IAnyEvent>(
  plugins:IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
) => {
  const actionsMap: { [a in TACTION_NAMES]?: boolean } = {};
  plugins.forEach(pl => {
    const actions = pl[PLUGIN_INFO_FIELD_NAMES.AVAILABLE_ACTIONS];
    actions?.forEach(a => {
      if (actionsMap[a]) {
        throw new Error(`Duplication of actions in different plugins ${a}`);
      }
      actionsMap[a] = true;
    });
  });
};
