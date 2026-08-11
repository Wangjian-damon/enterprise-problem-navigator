/**
 * V1 金融研发包 · 入口：注册实体/关系类型
 */
import { globalRegistry } from '@epn/core';
import { registerFinRdTypes } from './registry';
import { finRdRules } from './rules';

export { registerFinRdTypes, finRdRules };

/** 幂等初始化：包加载时自动注册 */
let initialized = false;
export function initPack(): void {
  if (initialized) return;
  registerFinRdTypes(globalRegistry);
  initialized = true;
}
