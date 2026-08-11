/** 全系统共享常量 */
export const SYSTEM = {
  name: 'Enterprise Problem Navigator',
  shortName: 'EPN',
  version: '0.1.0',
} as const;

/** 业务词典：领域术语 → 实体类型（P2 检索时使用） */
export const BUSINESS_DICTIONARY: Record<string, string> = {
  // V1 金融研发包占位：由 packs/fin-rd 注册完整词典
  授信: 'CreditFlow',
  loading: 'PageState',
  接口: 'ApiEndpoint',
  配置: 'ConfigItem',
  错误码: 'ErrorCode',
};
