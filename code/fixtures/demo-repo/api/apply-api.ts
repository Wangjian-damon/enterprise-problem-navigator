// 合成演示仓库 · 接口层（脱敏）
// 场景：S3 接口调用方与落点；G1 接口 500
import { queryCreditResult } from '../services/credit-service';

interface ApplyRequest {
  applyId: string;
  channel: string;
}

/** POST /apply/submit —— 提交授信申请 */
export async function submitApply(req: ApplyRequest): Promise<{ errorCode?: string }> {
  try {
    const r = await queryCreditResult(req.applyId);
    return { errorCode: r.errorCode };
  } catch (e) {
    // 网关超时场景（G1）：慢查询 → 超时 500
    return { errorCode: 'E5000' };
  }
}

/** GET /credit/query —— 查询授信结果 */
export async function queryApply(req: ApplyRequest): Promise<unknown> {
  return queryCreditResult(req.applyId);
}
