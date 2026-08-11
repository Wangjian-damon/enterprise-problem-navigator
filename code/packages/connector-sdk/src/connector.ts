/**
 * 连接器 SDK 接口（V1.5 正式落地；V1 的 git/workbench 连接器按此契约实现）
 * 一个连接器 = 一个企业知识源的适配器
 */
import { Entity, Relation } from '@epn/core';

/**
 * 接入配置分级（PDF L1–L4）：
 * L1 只读文件/目录 · L2 元数据/配置读取 · L3 只读 API（含历史） · L4 运行时计算最终值
 */
export type AccessLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface ConnectorConfig {
  /** 连接器唯一标识，如 git:repo-a */
  id: string;
  /** 接入分级 */
  accessLevel: AccessLevel;
  /** 连接参数（私有化，不入库） */
  params: Record<string, unknown>;
}

export interface ConnectorContext {
  /** 当前用户（权限过滤） */
  userId: string;
  /** 同步游标（增量同步用） */
  cursor?: string;
}

export interface ExtractResult {
  entities: Entity[];
  relations: Relation[];
  /** 新游标 */
  cursor?: string;
}

/**
 * 连接器契约：所有行业包连接器实现此接口
 */
export interface Connector {
  connect(cfg: ConnectorConfig): Promise<void>;
  /** 全量/增量抽取实体与关系 */
  extract(ctx: ConnectorContext): Promise<ExtractResult>;
  /** 增量同步（索引时效 ≤ 24h 的关键） */
  sync(ctx: ConnectorContext): Promise<ExtractResult>;
  /** 权限过滤：用户可访问哪些实体 id */
  listPermittedEntityIds(userId: string): Promise<string[]>;
  disconnect(): Promise<void>;
}
