import { applyAction, applyPlugins, checkPluginList } from './plugin';
import { PLUGIN_APPLY_STAGE } from '../enums';
import { IActionProcessorFactory } from '../interfaces/factories';
import { IAnyEvent } from '../interfaces/event';
import { IActionProcessor } from '../interfaces/processors';
import { IPlugin, IPluginSet } from '../interfaces/plugin';
import { OPTION_NAMES_DEFAULT } from '../defaults';

const getPlugins = <
  TACTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IAnyEvent,
  TPLUGIN_SET_NAMES extends string = string
  >(
    plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[] | IPluginSet<TACTION_NAMES, TPLUGIN_NAMES, TPLUGIN_SET_NAMES, TEvent>,
  ): (e: TEvent, stage: PLUGIN_APPLY_STAGE) => IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[] => {
  if (Array.isArray(plugins)) {
    return () => plugins;
  }

  type PluginSet = IPluginSet<TACTION_NAMES, TPLUGIN_NAMES, TPLUGIN_SET_NAMES, TEvent>;
  return (e, stage) => {
    const pluginSetName = (e.getOptions(OPTION_NAMES_DEFAULT.$pluginSet) || 'default') as TPLUGIN_SET_NAMES;

    if ((plugins as PluginSet)[pluginSetName]) {
      const pluginInfo = plugins[pluginSetName];
      if (pluginInfo.excludedStages && pluginInfo.excludedStages.includes(stage)) {
        return [];
      }
      return plugins[pluginSetName].plugins;
    }

    return [];
  };
};

export const actionProcessorFactory: IActionProcessorFactory = <
  TACTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IAnyEvent,
  TPLUGIN_SET_NAMES extends string = string
  >(
    plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[] | IPluginSet<TACTION_NAMES, TPLUGIN_NAMES, TPLUGIN_SET_NAMES, TEvent>,
  ) => {
  if (Array.isArray(plugins)) {
    checkPluginList(plugins);
  }

  return {
    processBeforeAllActions: async (e: TEvent): Promise<void> => { // todo move to transactions
      await applyPlugins(e, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.BEFORE_ALL), PLUGIN_APPLY_STAGE.BEFORE_ALL);
    },
    processEventAction: async (e: TEvent): Promise<TEvent> => {
      await applyPlugins(e, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.BEFORE_ACTION), PLUGIN_APPLY_STAGE.BEFORE_ACTION);
      const result = await applyAction(e, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.ACTION));
      await applyPlugins(result, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.AFTER_ACTION), PLUGIN_APPLY_STAGE.AFTER_ACTION);
      return result;
    },
    processAfterAllActions: async (e: TEvent): Promise<void> => { // todo move to transactions
      await applyPlugins(e, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.AFTER_ALL), PLUGIN_APPLY_STAGE.AFTER_ALL);
    },
    mergeIntoParentEvent: async (e: TEvent): Promise<void> => {
      await applyPlugins(e, getPlugins(plugins)(e, PLUGIN_APPLY_STAGE.MERGE), PLUGIN_APPLY_STAGE.MERGE);
    },
  } as IActionProcessor<TEvent>;
};
