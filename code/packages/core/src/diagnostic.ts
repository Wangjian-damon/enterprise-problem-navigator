/**
 * 诊断规则包契约（行业包实现，内核执行）
 * 规则 = 行业 know-how 的载体（护城河所在）；内核只认此接口，不认行业
 */
import { EvidenceLevel, EvidenceRef } from './types';

export interface DiagnosticRule {
  id: string;
  /** 触发关键词（问题分类时匹配，命中任一即触发） */
  keywords: string[];
  /** 排查路径：按顺序执行的检查步骤 */
  steps: string[];
  /** 关联黄金问题 */
  goldQuestionId?: string;
}

/**
 * 证据标签：每条断言挂来源（S4 源码/S3 配置/S2 推算/S1 推测）
 * 复用 types.ts 的 EvidenceRef，避免两套类型漂移
 */
export type EvidenceTag = EvidenceRef;

/**
 * 规则驱动编排的输出（V1 竖切：先基于规则包给出结构化导航答案）
 */
export interface RuleNavigation {
  /** 命中规则 */
  ruleId: string;
  /** 排查路径（步骤列表，每步带证据） */
  path: { step: string; evidence: EvidenceTag }[];
  /** 涉及的实体（名称级，P3 接入图谱后升级为实体 id） */
  entities: string[];
  /** 是否含推测项 */
  hasSpeculation: boolean;
}
