// 合成演示仓库 · 授信服务层（脱敏）
// 场景：S2 三层调用链（小程序 → 服务 → 调度）；S6 doLoan 受配置控制
import { enqueueLoanTask } from '../tasks/loan-scheduler';
import { getConfig, ConfigKey } from '../configs/workbench-config';
import { CreditTimeoutError } from '../sdk/error-codes';

export const LOADING_TIMEOUT = 5000;

export interface CreditResult {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  errorCode?: string;
}

/** 查询授信结果：读取配置 → 调度任务 → 返回状态 */
export async function queryCreditResult(applyId: string): Promise<CreditResult> {
  const retry = getConfig<boolean>(ConfigKey.LoanRetry); // doLoan 受 loan_retry 开关控制
  const timeout = getConfig<number>(ConfigKey.LoadingTimeout);

  const task = await enqueueLoanTask({ applyId, retry, timeout });
  if (task.errorCode) {
    throw new CreditTimeoutError(task.errorCode);
  }
  return { status: 'PENDING' };
}
