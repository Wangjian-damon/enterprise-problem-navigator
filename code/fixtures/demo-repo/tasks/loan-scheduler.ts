// 合成演示仓库 · 调度任务（脱敏）
// 场景：S3 接口落点（调用方 → Load Server → 调度任务）
import { getConfig, ConfigKey } from '../configs/workbench-config';

export interface LoanTask {
  applyId: string;
  retry: boolean;
  timeout: number;
}

export interface TaskResult {
  errorCode?: string;
  taskId: string;
}

const taskRegistry = new Map<string, TaskResult>();

/** Load Server 入口：接收任务 → 校验配置 → 入调度队列 */
export async function enqueueLoanTask(input: LoanTask): Promise<TaskResult> {
  const allow = getConfig<boolean>(ConfigKey.AllowLoadServer);
  if (!allow) {
    return { errorCode: 'E1002', taskId: '' };
  }
  const taskId = `TASK_${input.applyId}`;
  taskRegistry.set(taskId, { taskId });
  return { taskId };
}

/** 调度服务：定时轮询任务队列（结果映射） */
export function pollLoanTask(taskId: string): TaskResult | undefined {
  return taskRegistry.get(taskId);
}
