import { PLUGIN_APPLY_STAGE, PLUGIN_INFO_FIELD_NAMES } from '../enums';
import { IPluginPureFunction, IPluginResultFunction } from './eventOperations';
import { IAnyEvent } from './event';

export type IPluginInfo<ACTION_NAMES extends string, PLUGIN_NAMES extends string> = {
  [PLUGIN_INFO_FIELD_NAMES.SECTION_NAME]?: {
    [PLUGIN_INFO_FIELD_NAMES.NAME]?: PLUGIN_NAMES,
  }
} & {
  [PLUGIN_INFO_FIELD_NAMES.AVAILABLE_ACTIONS]?: ACTION_NAMES[]
}

export type IPlugin<
  ACTION_NAMES extends string,
  PLUGIN_NAMES extends string,
  TEvent extends IAnyEvent
  > = {
  [action in ACTION_NAMES]?: {
    [PLUGIN_APPLY_STAGE.BEFORE]?: IPluginPureFunction<TEvent>
    [PLUGIN_APPLY_STAGE.ACTION]?: IPluginResultFunction<TEvent>,
    [PLUGIN_APPLY_STAGE.MODIFY_QUERY]?: IPluginPureFunction<TEvent>
    [PLUGIN_APPLY_STAGE.FINALIZE_ACTION]?: IPluginResultFunction<TEvent>,
    [PLUGIN_APPLY_STAGE.AFTER]?: IPluginPureFunction<TEvent>
  }
} & {
  [PLUGIN_APPLY_STAGE.MERGE]?: IPluginPureFunction<TEvent>
  [PLUGIN_APPLY_STAGE.BEFORE_ACTION]?: IPluginPureFunction<TEvent>
  [PLUGIN_APPLY_STAGE.BEFORE_ALL]?: IPluginPureFunction<TEvent>
  [PLUGIN_APPLY_STAGE.AFTER_ALL]?: IPluginPureFunction<TEvent>
  [PLUGIN_APPLY_STAGE.AFTER_ACTION]?: IPluginPureFunction<TEvent>
} & IPluginInfo<ACTION_NAMES, PLUGIN_NAMES>
