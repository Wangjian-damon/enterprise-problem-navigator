/**
 * EPN API 服务（P2c 轻量实现：原生 node http，零框架依赖）
 * POST /api/query  { question, userId } → 编排器答案
 * GET  /api/health → 存活检查
 * 启动时：git 连接器抽取 demo-repo → 灌入知识库 → 规则 + 知识库编排
 */
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { RuleDrivenOrchestrator, InMemoryKnowledgeBase, QueryOutput } from '@epn/core';
import { GitConnector } from '@epn/connector-git';
import { finRdRuleProvider } from '@epn/pack-fin-rd';
import { join } from 'path';

const PORT = Number(process.env.PORT ?? 8091);
const REPO_PATH = process.env.REPO_PATH ?? join(__dirname, '../../../fixtures/demo-repo');

let orchestrator: RuleDrivenOrchestrator;

async function bootstrap(): Promise<void> {
  const git = new GitConnector();
  await git.connect({ id: 'git:demo-repo', accessLevel: 'L1', params: { path: REPO_PATH } });
  const { entities, relations } = await git.extract({ userId: 'system' });
  const kb = new InMemoryKnowledgeBase();
  kb.ingest(entities, relations);
  orchestrator = new RuleDrivenOrchestrator(finRdRuleProvider, kb);
  console.log(`[epn-api] 索引完成 ${entities.length} 实体 / ${relations.length} 关系 @ ${REPO_PATH}`);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, code: number, payload: unknown): void {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(payload, null, 2));
}

const server = createServer(async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, { ok: true, entities: orchestrator ? 'ready' : 'booting' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/query') {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw) as { question?: string; userId?: string };
      if (!body.question) {
        json(res, 400, { error: 'question is required' });
        return;
      }
      const out: QueryOutput = await orchestrator.handle({ question: body.question, userId: body.userId ?? 'anonymous' });
      json(res, 200, out);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  json(res, 404, { error: 'not found' });
});

bootstrap()
  .then(() => {
    server.listen(PORT, () => console.log(`[epn-api] listening on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('[epn-api] bootstrap failed:', e);
    process.exit(1);
  });
