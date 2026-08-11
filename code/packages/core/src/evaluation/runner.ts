/**
 * 评估框架骨架（P3 填充真实跑分）
 * 黄金问题集在 evaluation/黄金问题集_V1草稿.md；此 runner 将逐题调用 orchestrator 判定命中
 */
import { orchestrator } from '../orchestrator';

export interface GoldQuestion {
  id: string;
  question: string;
  /** 预期交付的关键信息（命中判定依据） */
  expected: string[];
}

/** V1 黄金问题集（正式版待作者校准后替换） */
export const goldQuestions: GoldQuestion[] = [
  { id: 'S1', question: '小程序提交后一直 loading，怎么排查？', expected: ['页面', '状态逻辑', 'API', '服务链路', 'loading关闭分支'] },
  { id: 'S2', question: '授信结果查询从小程序到调度服务怎么走？', expected: ['三层调用链', '仓库/文件/函数', '接口证据'] },
  { id: 'G1', question: '授信接口持续返回 500，先查什么？', expected: ['调用链', '慢查询', '配置开关', '缓存', '排查顺序'] },
];

export async function runEvaluation(): Promise<{ total: number; hit: number; pass: boolean }> {
  let hit = 0;
  for (const g of goldQuestions) {
    const { answer } = await orchestrator.handle({ question: g.question, userId: 'eval' });
    const joined = JSON.stringify(answer).toLowerCase();
    const matched = g.expected.filter((k) => joined.includes(k.toLowerCase()));
    const isHit = matched.length === g.expected.length;
    if (isHit) hit += 1;
    console.log(`[${isHit ? 'HIT' : 'MISS'}] ${g.id} ${g.question}（命中 ${matched.length}/${g.expected.length}）`);
  }
  const pass = hit / goldQuestions.length >= 0.8;
  console.log(`\n结果：${hit}/${goldQuestions.length}（目标 ≥80% → ${pass ? 'PASS' : 'FAIL'}）`);
  return { total: goldQuestions.length, hit, pass };
}

if (require.main === module) {
  runEvaluation().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
