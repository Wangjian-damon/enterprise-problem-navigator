// 合成演示仓库 · 错误码 SDK（脱敏）
// 场景：S4 错误码定义与返回
export enum ErrorCode {
  E1001 = 'E1001', // 参数校验失败
  E1002 = 'E1002', // 授信任务失败（Load Server 未放行）
  E5000 = 'E5000', // 网关超时
}

export class CreditTimeoutError extends Error {
  constructor(public code: ErrorCode) {
    super(`credit task failed: ${code}`);
    this.name = 'CreditTimeoutError';
  }
}
