import { applyAction, applyPlugins, checkPluginList } from './plugin';
import { PLUGIN_APPLY_STAGE } from '../enums';
import { IActionProcessorFactory } from '../interfaces/factories';
import { IAnyEvent } from '../interfaces/event';
import { IActionProcessor } from '../interfaces/processors';
import { IPlugin } from '../interfaces/plugin';

export const actionProcessorFactory: IActionProcessorFactory = <
  TACTION_NAMES extends string,
  TPLUGIN_NAMES extends string,
  TEvent extends IAnyEvent
  >(
    plugins: IPlugin<TACTION_NAMES, TPLUGIN_NAMES, TEvent>[],
  ) => {
  checkPluginList(plugins);

  return {
    processBeforeAllActions: async (e: TEvent): Promise<void> => { // todo move to transactions
      await applyPlugins(e, plugins, PLUGIN_APPLY_STAGE.BEFORE_ALL);
    },
    processEventAction: async (e: TEvent): Promise<TEvent> => {
      await applyPlugins(e, plugins, PLUGIN_APPLY_STAGE.BEFORE_ACTION);
      const result = await applyAction(e, plugins);
      await applyPlugins(result, plugins, PLUGIN_APPLY_STAGE.AFTER_ACTION);
      return result;
    },
    processAfterAllActions: async (e: TEvent): Promise<void> => { // todo move to transactions
      await applyPlugins(e, plugins, PLUGIN_APPLY_STAGE.AFTER_ALL);
    },
    mergeIntoParentEvent: async (e: TEvent): Promise<void> => {
      await applyPlugins(e, plugins, PLUGIN_APPLY_STAGE.MERGE);
    },
  } as IActionProcessor<TEvent>;
};
