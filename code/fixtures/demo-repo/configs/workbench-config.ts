// 合成演示仓库 · 配置工作台（脱敏）
// 场景：S6 方法受哪些配置控制；S7 配置关闭后影响；G2 配置不生效
export enum ConfigKey {
  LoanRetry = 'loan_retry',
  LoadingTimeout = 'loading_timeout',
  AllowLoadServer = 'allow_load_server',
  ChannelScope = 'channel_scope',
}

export type ConfigScope = 'dev' | 'test' | 'prod' | 'gray';

export interface ConfigItemDef {
  key: ConfigKey;
  defaultValue: boolean | number | string;
  scope: ConfigScope[];
  workbench: string;
}

export const CONFIG_DIRECTORY: Record<string, ConfigItemDef> = {
  [ConfigKey.LoanRetry]: { key: ConfigKey.LoanRetry, defaultValue: false, scope: ['prod', 'gray'], workbench: 'wb-loan' },
  [ConfigKey.LoadingTimeout]: { key: ConfigKey.LoadingTimeout, defaultValue: 5000, scope: ['dev', 'test', 'prod'], workbench: 'wb-app' },
  [ConfigKey.AllowLoadServer]: { key: ConfigKey.AllowLoadServer, defaultValue: true, scope: ['prod'], workbench: 'wb-loan' },
  [ConfigKey.ChannelScope]: { key: ConfigKey.ChannelScope, defaultValue: 'ALL', scope: ['prod'], workbench: 'wb-channel' },
};

const runtimeValues = new Map<string, unknown>();

/** 读取配置当前生效值（L3 只读 API 模拟） */
export function getConfig<T>(key: ConfigKey): T {
  const def = CONFIG_DIRECTORY[key];
  const v = runtimeValues.has(key) ? runtimeValues.get(key) : def.defaultValue;
  return v as T;
}

/** 更新配置（发布动作，模拟工作台 L3 API） */
export function setConfig(key: ConfigKey, value: unknown): void {
  runtimeValues.set(key, value);
}
