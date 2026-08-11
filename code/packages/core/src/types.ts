/**
 * 4 档证据可信度（对齐 PDF §12 / 产品方案 §5.1）
 * S4 源码确认 → S3 配置证据 → S2 推算 → S1 模型推测
 * 关键纪律：S1 必须明示标注，绝不伪装成事实（防幻觉硬约束）
 */
export enum EvidenceLevel {
  /** 源码确认：可直接引用 Commit / 文件+行号 */
  SourceCode = 'S4',
  /** 配置证据：引用配置键 / 作用域 / 工作台 */
  Config = 'S3',
  /** 推算：由相邻证据推导，非直接引用 */
  Derived = 'S2',
  /** 模型推测：LLM 推断，必须显式标注 */
  Speculation = 'S1',
}

export interface EvidenceRef {
  /** 证据来源作用域：commit hash / 配置键 / 文件+行号 */
  scope: string;
  /** 人类可读描述 */
  detail: string;
  level: EvidenceLevel;
}

/**
 * 知识图谱实体（企业无关的基础结构，行业实体经 Registry 扩展）
 */
export interface Entity {
  id: string;
  /** 实体类型，如 Repository / CodeSymbol / ApiEndpoint（由行业包注册） */
  type: string;
  /** 展示名 */
  name: string;
  /** 可选元数据（JSONB） */
  meta?: Record<string, unknown>;
}

/**
 * 类型化关系边（CALLS / READS_CONFIG / DEPENDS_ON 等，由行业包注册）
 */
export interface Relation {
  id: string;
  from: string; // 实体 id
  to: string;   // 实体 id
  type: string; // 关系类型
  /** 证据：关系为何成立 */
  evidence?: EvidenceRef;
}

/**
 * 导航答案 = 涉及对象 + 关系 + 排查顺序 + 证据
 */
export interface NavigationAnswer {
  /** 涉及的实体（按发现顺序） */
  entities: Entity[];
  /** 实体间关系 */
  relations: Relation[];
  /** 建议排查顺序（实体 id 序列 + 理由） */
  investigationOrder: { entityId: string; reason: string }[];
  /** 每条断言挂证据 */
  evidence: EvidenceRef[];
  /** 是否包含推测项（前端需显著标注） */
  hasSpeculation: boolean;
}

/**
 * 查询编排器输入输出
 */
export interface QueryInput {
  /** 用户自然语言问题 */
  question: string;
  /** 用户身份（权限前置过滤用） */
  userId: string;
}

export interface QueryOutput {
  answer: NavigationAnswer;
  /** 检索计划（调试/评估用） */
  plan: { sources: string[]; order: string[] };
}
