/**
 * V1 金融研发包 · 诊断规则包
 * 痛点 → 排查路径映射（对齐 PDF §4.2 S1–S7 与沙盒 G1–G3）
 * 这是护城河所在：行业 know-how 写进规则，内核只负责执行
 */
import { DiagnosticRule } from '@epn/core';

export const finRdRules: DiagnosticRule[] = [
  {
    id: 'R1_loading',
    keywords: ['loading', '一直加载', '提交', '卡住'],
    steps: ['页面与路由 → 状态逻辑分支(提交中/成功/失败) → 调用的 API → 服务链路 → 关闭 loading 的分支与相关配置'],
    goldQuestionId: 'S1',
  },
  {
    id: 'R2_credit_chain',
    keywords: ['授信', '结果查询', '链路', '怎么走'],
    steps: ['三层调用链：小程序页面 → 服务层 → 调度服务 → 每层节点(仓库/文件/函数/接口) → 证据逐跳'],
    goldQuestionId: 'S2',
  },
  {
    id: 'R3_env_diff',
    keywords: ['测试正常', '生产异常', '代码相同'],
    steps: ['环境差异清单 → 配置差异(重点) → 灰度/渠道/产品覆盖 → 发布时间 → 缓存检查'],
    goldQuestionId: 'S5',
  },
  {
    id: 'S3_interface_landing',
    keywords: ['在哪里调用', '落点', '进入哪个任务'],
    steps: ['接口调用方列表 → 参数构造位置 → Load Server 入口 → 调度任务 → 结果映射'],
    goldQuestionId: 'S3',
  },
  {
    id: 'S4_error_code',
    keywords: ['错误码', '在哪里定义', '返回'],
    steps: ['错误码定义位置 → 产生位置 → 传递路径 → 前端解析 → 日志关键词'],
    goldQuestionId: 'S4',
  },
  {
    id: 'S6_config_control',
    keywords: ['受哪些配置控制', '受哪些配置', '方法受'],
    steps: ['直接配置 → 下游配置 → 配置键 → 默认值 → 工作台 → 作用域 → 影响分支'],
    goldQuestionId: 'S6',
  },
  {
    id: 'R4_config_impact',
    keywords: ['配置', '关闭', '影响'],
    steps: ['读取代码 → 接口 → 任务 → 页面 → 用户表现（配置反向影响链）'],
    goldQuestionId: 'S7',
  },
  {
    id: 'G1_api_500',
    keywords: ['500', '接口报错', '网关', '持续返回', '先查什么', '持续返回 500'],
    steps: ['调用链(网关→服务→DB→配置→缓存) → 每跳证据(日志/慢查询/开关/命中率) → 推荐排查顺序'],
    goldQuestionId: 'G1',
  },
  {
    id: 'G2_config_rollout',
    keywords: ['配置不生效', '实例', '发布'],
    steps: ['配置作用域(prod?) → 发布状态(draft/published) → 逐实例拉取 → 客户端缓存排除'],
    goldQuestionId: 'G2',
  },
  {
    id: 'G3_cross_repo',
    keywords: ['跨仓库', '依赖', '升级', '回滚'],
    steps: ['依赖图(升级仓→受影响仓) → 受影响模块 → 推荐回滚顺序 → 回归验证建议'],
    goldQuestionId: 'G3',
  },
];
