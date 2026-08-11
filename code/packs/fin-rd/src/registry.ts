/**
 * V1 金融研发包 · 实体与关系注册
 * 对齐 PDF §10 / 产品方案 §6：Repository/SourceFile/CodeSymbol/ApiEndpoint/Page/Route/Task/ConfigItem/ErrorCode/BusinessTerm/ExternalBlackbox
 */
import { Registry } from '@epn/core';

export function registerFinRdTypes(registry: Registry): void {
  // ── 实体类型 ──
  registry.registerEntityType({ type: 'Repository', label: '仓库', attributes: ['url', 'defaultBranch'] });
  registry.registerEntityType({ type: 'SourceFile', label: '源文件', attributes: ['path', 'language'] });
  registry.registerEntityType({ type: 'CodeSymbol', label: '代码符号', attributes: ['kind', 'signature'] });
  registry.registerEntityType({ type: 'ApiEndpoint', label: '接口', attributes: ['method', 'path', 'service'] });
  registry.registerEntityType({ type: 'Page', label: '页面', attributes: ['route', 'app'] });
  registry.registerEntityType({ type: 'Route', label: '路由', attributes: ['path', 'page'] });
  registry.registerEntityType({ type: 'Task', label: '任务', attributes: ['type', 'schedule'] });
  registry.registerEntityType({ type: 'ConfigItem', label: '配置项', attributes: ['key', 'default', 'workbench', 'scope'] });
  registry.registerEntityType({ type: 'ErrorCode', label: '错误码', attributes: ['code', 'message'] });
  registry.registerEntityType({ type: 'BusinessTerm', label: '业务术语', attributes: ['term', 'definition'] });
  registry.registerEntityType({ type: 'ExternalBlackbox', label: '外部黑盒', attributes: ['system', 'contract'] });

  // ── 关系类型 ──
  registry.registerRelationType({ type: 'CALLS', label: '调用', fromTypes: ['CodeSymbol', 'ApiEndpoint', 'Task'], toTypes: ['ApiEndpoint', 'Task', 'CodeSymbol'] });
  registry.registerRelationType({ type: 'READS_CONFIG', label: '读取配置', fromTypes: ['CodeSymbol', 'ApiEndpoint', 'Task'], toTypes: ['ConfigItem'] });
  registry.registerRelationType({ type: 'DEPENDS_ON', label: '依赖', fromTypes: ['Repository', 'CodeSymbol'], toTypes: ['Repository', 'CodeSymbol'] });
  registry.registerRelationType({ type: 'SERVES_PAGE', label: '服务页面', fromTypes: ['ApiEndpoint', 'Task'], toTypes: ['Page', 'Route'] });
  registry.registerRelationType({ type: 'DEFINES', label: '定义', fromTypes: ['SourceFile'], toTypes: ['CodeSymbol', 'ErrorCode'] });
  registry.registerRelationType({ type: 'PRODUCES', label: '产生', fromTypes: ['CodeSymbol', 'Task'], toTypes: ['ErrorCode'] });
  registry.registerRelationType({ type: 'USES_TERM', label: '使用术语', fromTypes: ['CodeSymbol', 'ApiEndpoint'], toTypes: ['BusinessTerm'] });
  registry.registerRelationType({ type: 'EXTERNAL_CALL', label: '外部调用', fromTypes: ['CodeSymbol'], toTypes: ['ExternalBlackbox'] });
}
