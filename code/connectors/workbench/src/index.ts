/**
 * 配置工作台连接器（V1 骨架）
 * P2 填充：L1–L3 配置读取（当前值 + 历史 + 作用域）
 */
import { Connector, ConnectorConfig, ConnectorContext, ExtractResult } from '@epn/connector-sdk';

export class WorkbenchConnector implements Connector {
  private cfg?: ConnectorConfig;

  async connect(cfg: ConnectorConfig): Promise<void> {
    this.cfg = cfg;
    // TODO: 校验工作台 API 可达性、读取配置
  }

  async extract(_ctx: ConnectorContext): Promise<ExtractResult> {
    // TODO: 读取配置目录，产出 ConfigItem 实体与 READS_CONFIG 关系
    return { entities: [], relations: [] };
  }

  async sync(ctx: ConnectorContext): Promise<ExtractResult> {
    // TODO: 配置变更增量同步（索引时效 ≤24h）
    return this.extract(ctx);
  }

  async listPermittedEntityIds(_userId: string): Promise<string[]> {
    // TODO: 配置作用域权限映射
    return [];
  }

  async disconnect(): Promise<void> {
    this.cfg = undefined;
  }
}

export const workbenchConnector = new WorkbenchConnector();
