/**
 * 金融研发包评估入口：注入本包规则 + 黄金问题，跑分判定
 * 用法：pnpm --filter @epn/pack-fin-rd eval
 */
import { runEvaluation, GoldQuestion, RuleDrivenOrchestrator } from '@epn/core';
import { finRdRuleProvider } from '..';

/** V1 黄金问题集（正式版待作者校准；先取 S1/S2/G1 三题竖切验证） */
const goldQuestions: GoldQuestion[] = [
  {
    id: 'S1',
    question: '小程序提交后一直 loading，怎么排查？',
    expected: ['页面', '状态逻辑', 'API', '服务链路', 'loading', '配置'],
  },
  {
    id: 'S2',
    question: '授信结果查询从小程序到调度服务怎么走？',
    expected: ['调用链', '服务', '接口', '证据'],
  },
  {
    id: 'G1',
    question: '授信接口持续返回 500，先查什么？',
    expected: ['调用链', '慢查询', '配置', '缓存', '排查顺序'],
  },
];

async function main(): Promise<void> {
  const orchestrator = new RuleDrivenOrchestrator(finRdRuleProvider);
  const result = await runEvaluation({ questions: goldQuestions, rules: finRdRuleProvider.getRules(), orchestrator });
  process.exit(result.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
