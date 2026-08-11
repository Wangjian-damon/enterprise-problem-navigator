/**
 * 评估框架（通用跑分器）：注入黄金问题 + 诊断规则，逐题判定首答命中
 * 使用方（行业包）负责提供自己的 questions + rules
 */
import { Orchestrator } from '../orchestrator';
import { DiagnosticRule } from '../diagnostic';

export interface GoldQuestion {
  id: string;
  question: string;
  /** 预期交付的关键信息（命中判定依据） */
  expected: string[];
}

export interface EvalOptions {
  questions: GoldQuestion[];
  rules: DiagnosticRule[];
  orchestrator: Orchestrator;
  /** 命中判定：需命中全部关键词（默认 true）还是 ≥ 比例 */
  requireAll?: boolean;
}

export interface EvalResult {
  total: number;
  hit: number;
  missIds: string[];
  pass: boolean;
}

export async function runEvaluation(opts: EvalOptions): Promise<EvalResult> {
  const { questions, orchestrator, requireAll = true } = opts;
  const missIds: string[] = [];
  let hit = 0;

  for (const g of questions) {
    const { answer } = await orchestrator.handle({ question: g.question, userId: 'eval' });
    const joined = JSON.stringify(answer).toLowerCase();
    const matched = g.expected.filter((k) => joined.includes(k.toLowerCase()));
    const isHit = requireAll ? matched.length === g.expected.length : matched.length / g.expected.length >= 0.8;
    if (isHit) {
      hit += 1;
    } else {
      missIds.push(g.id);
    }
    console.log(`[${isHit ? 'HIT' : 'MISS'}] ${g.id} ${g.question}（命中 ${matched.length}/${g.expected.length}）`);
  }

  const pass = hit / questions.length >= 0.8;
  console.log(`\n结果：${hit}/${questions.length}（目标 ≥80% → ${pass ? 'PASS' : 'FAIL'}）`);
  return { total: questions.length, hit, missIds, pass };
}
