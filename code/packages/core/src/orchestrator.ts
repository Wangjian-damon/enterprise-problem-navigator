/**
 * 查询编排器（P2 竖切版）：分类 → 规则匹配 → 检索计划 → 证据组装
 * 纪律：core 不感知行业；诊断规则由行业包注入（RuleProvider）
 */
import { QueryInput, QueryOutput, NavigationAnswer, EvidenceLevel, EvidenceRef } from './types';
import { DiagnosticRule, RuleNavigation } from './diagnostic';

/** 规则注入点：行业包把规则集注册进来 */
export interface RuleProvider {
  getRules(): DiagnosticRule[];
}

export interface Orchestrator {
  handle(q: QueryInput): Promise<QueryOutput>;
}

/**
 * 规则驱动编排器：先用规则包做受约束编排（不做自由 LLM 推理）
 * 后续演进：规则命中 → 检索计划 → 混合检索 → 图谱扩展 → 证据校验
 */
export class RuleDrivenOrchestrator implements Orchestrator {
  constructor(public provider: RuleProvider) {}

  /** 问题分类：关键词匹配 → 命中规则 */
  private classify(question: string): DiagnosticRule | undefined {
    const rules = this.provider.getRules();
    // 长关键词优先（更具体），避免"配置"先于"配置不生效"命中
    return rules
      .filter((r) => r.keywords.some((k) => question.includes(k)))
      .sort((a, b) => Math.max(...b.keywords.map((k) => k.length)) - Math.max(...a.keywords.map((k) => k.length)))[0];
  }

  /** 依据规则生成带证据的排查路径 */
  private buildNavigation(rule: DiagnosticRule): RuleNavigation {
    const path = rule.steps.map((step, i) => ({
      step,
      evidence: {
        scope: `rule:${rule.id}`,
        detail: `按诊断规则包 ${rule.id} 的第 ${i + 1} 步执行`,
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
    const answer: NavigationAnswer = {
      entities: nav.entities.map((name, i) => ({ id: `${rule.id}-e${i}`, type: 'PathNode', name })),
      relations: [],
      investigationOrder: nav.path.map((p, i) => ({ entityId: `${rule.id}-e${i}`, reason: p.step })),
      evidence: nav.path.map((p) => p.evidence),
      hasSpeculation: nav.hasSpeculation,
    };
    return {
      answer,
      plan: { sources: [`rules:${rule.id}`], order: rule.steps },
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

/** 入口注入真实规则（apps/api 启动时调用，行业包把规则集传进来） */
export function setRuleProvider(provider: RuleProvider): void {
  orchestrator.provider = provider;
}

