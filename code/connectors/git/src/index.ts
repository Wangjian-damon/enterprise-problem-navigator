/**
 * git 仓库连接器（P2b 版）：轻量源码解析
 * 从本地仓库目录抽取：SourceFile / CodeSymbol / ApiEndpoint / ErrorCode / ConfigItem 实体 + 关系
 * 证据带 file:line（S4 源码档）——证据从"规则引用"升级为"真实代码引用"
 * 后续可替换为 Tree-sitter（商品化能力，V1 先用轻量正则跑通）
 */
import { Entity, Relation, EvidenceLevel } from '@epn/core';
import { Connector, ConnectorConfig, ConnectorContext, ExtractResult } from '@epn/connector-sdk';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const TS_EXT = ['.ts', '.tsx', '.js', '.jsx', '.json'];

interface Parsed {
  entities: Entity[];
  relations: Relation[];
}

/** 从单文件抽取实体与关系（轻量解析） */
function parseFile(repoPath: string, abs: string): Parsed {
  const rel = abs.slice(repoPath.length + 1).replace(/\\/g, '/');
  const src = readFileSync(abs, 'utf-8');
  const lines = src.split('\n');
  const fileEntity: Entity = { id: `file:${rel}`, type: 'SourceFile', name: rel, meta: { lines: lines.length } };
  const entities: Entity[] = [fileEntity];
  const relations: Relation[] = [];
  const symbols: Entity[] = [];

  const addSymbol = (kind: string, name: string, lineNo: number): Entity => {
    const e: Entity = { id: `sym:${rel}#${name}`, type: 'CodeSymbol', name, meta: { kind, file: rel, line: lineNo } };
    entities.push(e);
    symbols.push(e);
    relations.push({
      id: `def:${rel}#${name}`,
      from: fileEntity.id,
      to: e.id,
      type: 'DEFINES',
      evidence: { scope: `${rel}:${lineNo}`, detail: `定义于 ${rel} 第 ${lineNo} 行`, level: EvidenceLevel.SourceCode },
    });
    return e;
  };

  lines.forEach((line, i) => {
    const ln = i + 1;
    // 函数/方法定义
    const fn = line.match(/\b(?:export\s+)?(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/);
    if (fn) addSymbol('function', fn[1], ln);
    const arrow = line.match(/\b(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/);
    if (arrow) addSymbol('function', arrow[1], ln);
    // 接口端点（HTTP 动词 + 路径注释形式）
    const api = line.match(/\/\/\s*(POST|GET|PUT|DELETE)\s+(\/[A-Za-z0-9/{}:_-]+)/);
    if (api) {
      const e: Entity = { id: `api:${rel}#${api[1]}${api[2]}`, type: 'ApiEndpoint', name: `${api[1]} ${api[2]}`, meta: { file: rel, line: ln } };
      entities.push(e);
      relations.push({
        id: `api:${rel}#${api[1]}${api[2]}:def`,
        from: fileEntity.id,
        to: e.id,
        type: 'DEFINES',
        evidence: { scope: `${rel}:${ln}`, detail: `接口声明于 ${rel} 第 ${ln} 行`, level: EvidenceLevel.SourceCode },
      });
      relations.push({
        id: `api:${rel}#${api[1]}${api[2]}:call`,
        from: e.id,
        to: `file:${rel}`,
        type: 'CALLS',
        evidence: { scope: `${rel}:${ln}`, detail: `接口处理位于 ${rel}`, level: EvidenceLevel.SourceCode },
      });
    }
    // 错误码定义（ErrorCode 枚举成员）
    const err = line.match(/\b(E\d{4})\s*=\s*['"]E\d{4}['"]/);
    if (err) {
      const e: Entity = { id: `err:${err[1]}`, type: 'ErrorCode', name: err[1], meta: { file: rel, line: ln } };
      entities.push(e);
      relations.push({
        id: `err:${err[1]}:def`,
        from: fileEntity.id,
        to: e.id,
        type: 'DEFINES',
        evidence: { scope: `${rel}:${ln}`, detail: `错误码 ${err[1]} 定义于 ${rel} 第 ${ln} 行`, level: EvidenceLevel.SourceCode },
      });
    }
    // 配置键引用（ConfigKey 枚举定义行 / getConfig 调用）
    // 定义行形如 LoanRetry = 'loan_retry' → 实体名用实际键值 loan_retry（与问题中的 snake_case 对齐）
    // 注意：ErrorCode 枚举值是大写（E1001），配置键是小写下划线，用 [a-z_] 开头区分
    const cfgDef = line.match(/\b([A-Za-z_$][\w$]*)\s*=\s*['"]([a-z_][a-z0-9_]*)['"]/);
    const cfgUse = line.match(/(?:ConfigKey\.)([A-Za-z_$][\w$]*)/);
    if (cfgDef || cfgUse) {
      const keyName = cfgUse ? cfgUse[1] : cfgDef![2];
      const e: Entity = { id: `cfg:${keyName}`, type: 'ConfigItem', name: keyName, meta: { file: rel, line: ln } };
      entities.push(e);
      relations.push({
        id: `cfg:${keyName}:read:${rel}:${ln}`,
        from: fileEntity.id,
        to: e.id,
        type: 'READS_CONFIG',
        evidence: { scope: `${rel}:${ln}`, detail: `${rel} 第 ${ln} 行读取配置 ${keyName}`, level: EvidenceLevel.SourceCode },
      });
    }
    // 错误码产生点：return { errorCode: 'E1002' } 或 new CreditTimeoutError → PRODUCES 关系
    const prod = line.match(/errorCode:\s*['"](E\d{4})['"]|new\s+\w+Error\(['"](E\d{4})['"]/);
    if (prod) {
      const code = prod[1] ?? prod[2];
      relations.push({
        id: `prod:${rel}:${ln}:${code}`,
        from: fileEntity.id,
        to: `err:${code}`,
        type: 'PRODUCES',
        evidence: { scope: `${rel}:${ln}`, detail: `${rel} 第 ${ln} 行返回错误码 ${code}`, level: EvidenceLevel.SourceCode },
      });
    }
    // import 关系（跨文件依赖）
    const imp = line.match(/import\s+.*?from\s+['"](\.\.?\/[^'"]+)['"]/);
    if (imp) {
      relations.push({
        id: `imp:${rel}#${imp[1]}`,
        from: fileEntity.id,
        to: `file:${imp[1].replace(/^\.\.?\//, '').replace(/\.[a-z]+$/, '')}.ts`,
        type: 'DEPENDS_ON',
        evidence: { scope: `${rel}:${ln}`, detail: `${rel} 第 ${ln} 行依赖 ${imp[1]}`, level: EvidenceLevel.SourceCode },
      });
    }
  });

  return { entities, relations };
}

function walk(repoPath: string): string[] {
  const out: string[] = [];
  const walkDir = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      if (name === 'node_modules' || name.startsWith('.')) continue;
      if (statSync(abs).isDirectory()) walkDir(abs);
      else if (TS_EXT.includes(extname(name))) out.push(abs);
    }
  };
  walkDir(repoPath);
  return out;
}

export class GitConnector implements Connector {
  private repoPath = '';
  private cfg?: ConnectorConfig;

  async connect(cfg: ConnectorConfig): Promise<void> {
    this.cfg = cfg;
    this.repoPath = (cfg.params.path as string) ?? '';
  }

  async extract(_ctx: ConnectorContext): Promise<ExtractResult> {
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const files = walk(this.repoPath);
    const repoName = this.repoPath.split('/').pop() || 'demo-repo';
    entities.push({ id: `repo:${repoName}`, type: 'Repository', name: repoName, meta: { files: files.length } });

    for (const f of files) {
      const { entities: es, relations: rs } = parseFile(this.repoPath, f);
      entities.push(...es);
      relations.push(...rs);
    }
    return { entities, relations };
  }

  async sync(ctx: ConnectorContext): Promise<ExtractResult> {
    return this.extract(ctx); // V1 全量重建；增量（git log 变更检测）后续实现
  }

  async listPermittedEntityIds(_userId: string): Promise<string[]> {
    return []; // V1 内部部署默认全量可见；权限模型 V1.5 实现
  }

  async disconnect(): Promise<void> {
    this.repoPath = '';
  }
}

export const gitConnector = new GitConnector();
