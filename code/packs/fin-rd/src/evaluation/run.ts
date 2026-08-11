/**
 * 金融研发包评估入口：连接器抽取 → 灌入知识库 → 规则 + 知识库跑分
 * 用法：pnpm --filter @epn/pack-fin-rd eval
 * 数据：合成示例仓库 code/fixtures/demo-repo（脱敏）
 */
import { runEvaluation, GoldQuestion, RuleDrivenOrchestrator, InMemoryKnowledgeBase } from '@epn/core';
import { GitConnector } from '@epn/connector-git';
import { finRdRuleProvider } from '..';
import { join } from 'path';

/** V1 黄金问题集全集（S1–S7 + G1–G3，对齐 evaluation/黄金问题集_V1草稿.md） */
const goldQuestions: GoldQuestion[] = [
  { id: 'S1', question: '小程序提交后一直 loading，怎么排查？', expected: ['页面', '状态逻辑', 'API', '服务链路', 'loading', '配置'] },
  { id: 'S2', question: '授信结果查询从小程序到调度服务怎么走？', expected: ['调用链', '服务', '接口', '证据'] },
  { id: 'S3', question: 'apply/submit 接口在哪里调用，最后进入哪个任务？', expected: ['调用方', '参数构造', 'Load Server', '任务', '结果映射'] },
  { id: 'S4', question: '错误码 E1002 在哪里定义和返回？', expected: ['定义', '返回', '传递', 'E1002'] },
  { id: 'S5', question: '测试正常、生产异常，代码相同，查什么？', expected: ['环境差异', '配置差异', '灰度', '发布', '缓存'] },
  { id: 'S6', question: 'doLoan 方法受哪些配置控制？', expected: ['配置键', '默认值', '作用域', '影响分支'] },
  { id: 'S7', question: '配置 loan_retry 关闭后影响哪些页面和服务？', expected: ['读取代码', '接口', '任务', '页面', '用户表现'] },
  { id: 'G1', question: '授信接口持续返回 500，先查什么？', expected: ['调用链', '慢查询', '配置', '缓存', '排查顺序'] },
  { id: 'G2', question: '新配置没在全部实例生效，怎么查？', expected: ['作用域', '发布状态', '实例', '缓存'] },
  { id: 'G3', question: '升级后跨仓库依赖断裂，怎么回滚？', expected: ['依赖图', '受影响模块', '回滚顺序'] },
];

async function main(): Promise<void> {
  const fixtureRepo = join(__dirname, '../../../../fixtures/demo-repo');

  // 1) 连接器抽取合成示例仓库
  const git = new GitConnector();
  await git.connect({ id: 'git:demo-repo', accessLevel: 'L1', params: { path: fixtureRepo } });
  const { entities, relations } = await git.extract({ userId: 'eval' });
  console.log(`索引完成：${entities.length} 实体 / ${relations.length} 关系（${fixtureRepo}）\n`);

  // 2) 灌入知识库
  const kb = new InMemoryKnowledgeBase();
  kb.ingest(entities, relations);

  // 3) 规则 + 知识库编排跑分
  const orchestrator = new RuleDrivenOrchestrator(finRdRuleProvider, kb);
  const result = await runEvaluation({
    questions: goldQuestions,
    rules: finRdRuleProvider.getRules(),
    orchestrator,
  });
  process.exit(result.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
