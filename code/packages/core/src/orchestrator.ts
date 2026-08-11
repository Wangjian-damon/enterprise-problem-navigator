/**
 * 查询编排器（P2b 版）：分类 → 规则匹配 → 检索计划 → 知识库证据补全 → 组装
 * 纪律：core 不感知行业；诊断规则由行业包注入（RuleProvider）；知识库可选注入
 */
import { QueryInput, QueryOutput, NavigationAnswer, EvidenceLevel, EvidenceRef, Entity } from './types';
import { DiagnosticRule, RuleNavigation } from './diagnostic';
import { KnowledgeBase } from './knowledge';

/** 规则注入点：行业包把规则集注册进来 */
export interface RuleProvider {
  getRules(): DiagnosticRule[];
}

export interface Orchestrator {
  handle(q: QueryInput): Promise<QueryOutput>;
}

/**
 * 规则驱动编排器：
 * 1) 规则命中（受约束编排，不做自由 LLM 推理）
 * 2) 从知识库检索真实实体，把证据从"规则引用"升级为"代码引用（S4）"
 */
export class RuleDrivenOrchestrator implements Orchestrator {
  constructor(
    public provider: RuleProvider,
    private kb?: KnowledgeBase,
  ) {}

  /** 问题分类：关键词匹配 → 命中规则（长关键词优先） */
  private classify(question: string): DiagnosticRule | undefined {
    const rules = this.provider.getRules();
    return rules
      .filter((r) => r.keywords.some((k) => question.includes(k)))
      .sort((a, b) => Math.max(...b.keywords.map((k) => k.length)) - Math.max(...a.keywords.map((k) => k.length)))[0];
  }

  /** 依据规则生成带证据的排查路径（规则步骤全文即排查顺序理由，始终保留） */
  private buildNavigation(rule: DiagnosticRule): RuleNavigation {
    const path = rule.steps.map((step, i) => ({
      step,
      evidence: {
        scope: `rule:${rule.id}`,
        detail: step,
        level: (i === 0 ? EvidenceLevel.Config : EvidenceLevel.Derived) as EvidenceRef['level'],
      },
    }));
    return {
      ruleId: rule.id,
      path,
      entities: rule.steps.map((s) => s.split('→')[0].trim()),
      hasSpeculation: false,
    };
  }

  /** 从知识库检索与问题相关的真实实体（S4 源码证据），含反向关系（谁指向命中实体） */
  private retrieveEntities(question: string, rule: DiagnosticRule): { entities: Entity[]; evidence: EvidenceRef[] } {
    if (!this.kb) return { entities: [], evidence: [] };
    const hit = this.kb.search(question, { limit: 8 });
    const extra: Entity[] = [];
    const evidence: EvidenceRef[] = [];
    const seen = new Set<string>();

    for (const e of hit) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      extra.push(e);
      const neighbors = this.kb.neighbors(e.id);
      for (const n of neighbors.slice(0, 6)) {
        // 反向关系：谁指向该实体（S7 配置反向影响链的关键）
        const counterId = n.from === e.id ? n.to : n.from;
        if (!seen.has(counterId)) {
          const counter = this.kb.getEntity(counterId);
          if (counter) {
            seen.add(counter.id);
            extra.push(counter);
          }
        }
        if (n.evidence) {
          evidence.push(n.evidence);
        }
      }
    }
    // 无知识库命中的话，规则步骤本身作为兜底证据
    if (evidence.length === 0) {
      rule.steps.forEach((s) =>
        evidence.push({
          scope: `rule:${rule.id}`,
          detail: s,
          level: EvidenceLevel.Derived,
        }),
      );
    }
    return { entities: extra, evidence };
  }

  async handle(q: QueryInput): Promise<QueryOutput> {
    const rule = this.classify(q.question);

    if (!rule) {
      const answer: NavigationAnswer = {
        entities: [],
        relations: [],
        investigationOrder: [],
        evidence: [{ scope: 'no-rule', detail: '未命中诊断规则，无法给出导航路径', level: EvidenceLevel.Speculation }],
        hasSpeculation: true,
      };
      return { answer, plan: { sources: [], order: [] } };
    }

    const nav = this.buildNavigation(rule);
    const { entities: kbEntities, evidence: kbEvidence } = this.retrieveEntities(q.question, rule);

    const entities: Entity[] = [
      ...kbEntities,
      ...nav.entities.map((name, i) => ({ id: `${rule.id}-e${i}`, type: 'PathNode', name })),
    ];
    const answer: NavigationAnswer = {
      entities,
      relations: [],
      investigationOrder: nav.path.map((p, i) => ({ entityId: `${rule.id}-e${i}`, reason: p.step })),
      evidence: [...kbEvidence, ...nav.path.map((p) => p.evidence)],
      hasSpeculation: nav.hasSpeculation,
    };
    return {
      answer,
      plan: { sources: [`rules:${rule.id}`, ...(this.kb ? ['knowledge-base'] : [])], order: rule.steps },
    };
  }
}

/** 占位实现：规则未注入时的兜底 */
export class EmptyProvider implements RuleProvider {
  getRules(): DiagnosticRule[] {
    return [];
  }
}

export const orchestrator = new RuleDrivenOrchestrator(new EmptyProvider());

/** 入口注入真实规则与知识库（apps/api 启动时调用，行业包把规则与连接器数据传进来） */
export function setRuleProvider(provider: RuleProvider, kb?: KnowledgeBase): void {
  (orchestrator as RuleDrivenOrchestrator).provider = provider;
  (orchestrator as unknown as { kb?: KnowledgeBase }).kb = kb;
}
