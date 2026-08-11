// 合成演示仓库 · 授信申请小程序页面（脱敏）
// 场景：S1 提交后 loading；S2 授信结果查询链路
import { queryCreditResult, LOADING_TIMEOUT } from '../services/credit-service';
import { submitApply } from '../api/apply-api';

export interface ApplyState {
  submitting: boolean;
  loading: boolean;
  errorCode?: string;
}

export class ApplyPage {
  state: ApplyState = { submitting: false, loading: false };

  /** 提交申请 → 进入 loading → 调用授信接口 */
  async onSubmit(): Promise<void> {
    this.state.submitting = true;
    this.state.loading = true; // 开启 loading（关闭分支见 finally）
    try {
      const result = await submitApply(this.state);
      if (result.errorCode === 'E1002') {
        this.state.errorCode = result.errorCode;
      }
    } finally {
      this.state.loading = false; // 关闭 loading 的关键分支
      this.state.submitting = false;
    }
  }

  /** 查询授信结果（走小程序 → 服务层 → 调度服务链路） */
  async onQuery(): Promise<string> {
    const r = await queryCreditResult('APPLY_20260811001');
    return r.status;
  }
}
