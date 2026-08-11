/**
 * git 仓库连接器（V1 骨架）
 * P2 填充：Tree-sitter 解析 CodeSymbol / ApiEndpoint / 调用关系
 */
import { Connector, ConnectorConfig, ConnectorContext, ExtractResult } from '@epn/connector-sdk';

export class GitConnector implements Connector {
  private cfg?: ConnectorConfig;

  async connect(cfg: ConnectorConfig): Promise<void> {
    this.cfg = cfg;
    // TODO: 校验仓库可达性、读取配置
  }

  async extract(_ctx: ConnectorContext): Promise<ExtractResult> {
    // TODO: Tree-sitter 遍历仓库，产出 Repository/SourceFile/CodeSymbol 实体与 CALLS 关系
    return { entities: [], relations: [] };
  }

  async sync(ctx: ConnectorContext): Promise<ExtractResult> {
    // TODO: git 增量拉取 + 变更实体更新（索引时效 ≤24h）
    return this.extract(ctx);
  }

  async listPermittedEntityIds(_userId: string): Promise<string[]> {
    // TODO: 仓库级权限映射
    return [];
  }

  async disconnect(): Promise<void> {
    this.cfg = undefined;
  }
}

export const gitConnector = new GitConnector();
