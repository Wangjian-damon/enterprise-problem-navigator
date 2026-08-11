/**
 * V1 金融研发包 · 入口：注册实体/关系类型 + 提供诊断规则
 */
import { globalRegistry, RuleProvider, DiagnosticRule } from '@epn/core';
import { registerFinRdTypes } from './registry';
import { finRdRules } from './rules';

export { registerFinRdTypes, finRdRules };

/** 规则提供者：编排器通过它拿到金融研发包规则（core 不反向依赖本包） */
export class FinRdRuleProvider implements RuleProvider {
  getRules(): DiagnosticRule[] {
    return finRdRules;
  }
}

export const finRdRuleProvider = new FinRdRuleProvider();

/** 幂等初始化：包加载时自动注册实体/关系类型 */
let initialized = false;
export function initPack(): void {
  if (initialized) return;
  registerFinRdTypes(globalRegistry);
  initialized = true;
}
