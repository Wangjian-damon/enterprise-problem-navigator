/**
 * 查询编排器：分类 → 实体提取 → 检索计划 → 证据校验
 * V1 先实现骨架与接口；检索/图谱实现随 P2 填充
 */
import { QueryInput, QueryOutput, NavigationAnswer, EvidenceLevel } from './types';

export interface Orchestrator {
  handle(q: QueryInput): Promise<QueryOutput>;
}

export class BasicOrchestrator implements Orchestrator {
  /**
   * V1 竖切实现：先用规则化 pipeline 产出结构化答案
   * （后续接入：分类器 → 实体提取 → 混合检索 → 图谱扩展 → 证据校验）
   */
  async handle(q: QueryInput): Promise<QueryOutput> {
    const placeholder: NavigationAnswer = {
      entities: [],
      relations: [],
      investigationOrder: [],
      evidence: [
        {
          scope: 'TODO: 检索计划执行后填充',
          detail: `收到问题：「${q.question}」（用户 ${q.userId}）`,
          level: EvidenceLevel.Derived,
        },
      ],
      hasSpeculation: false,
    };
    return {
      answer: placeholder,
      plan: { sources: [], order: [] },
    };
  }
}

export const orchestrator = new BasicOrchestrator();
