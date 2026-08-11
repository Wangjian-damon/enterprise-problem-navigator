/**
 * 实体/关系注册机制（V1.5 SDK 的雏形，V1 先以内置 registry 形式存在）
 * 行业包通过 registerEntityType / registerRelationType 登记新类型
 */
import { Entity, Relation } from './types';

export interface EntityTypeDef {
  type: string;
  /** 展示名（前端渲染用） */
  label: string;
  /** 该实体包含的关键属性 */
  attributes: string[];
}

export interface RelationTypeDef {
  type: string;
  label: string;
  /** from 实体类型 */
  fromTypes: string[];
  /** to 实体类型 */
  toTypes: string[];
}

export class Registry {
  private entityTypes = new Map<string, EntityTypeDef>();
  private relationTypes = new Map<string, RelationTypeDef>();
  private entities = new Map<string, Entity>();
  private relations: Relation[] = [];

  registerEntityType(def: EntityTypeDef): void {
    this.entityTypes.set(def.type, def);
  }

  registerRelationType(def: RelationTypeDef): void {
    this.relationTypes.set(def.type, def);
  }

  addEntity(e: Entity): void {
    this.entities.set(e.id, e);
  }

  addRelation(r: Relation): void {
    this.relations.push(r);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getRelationsOf(entityId: string): Relation[] {
    return this.relations.filter((r) => r.from === entityId || r.to === entityId);
  }

  listEntityTypes(): EntityTypeDef[] {
    return [...this.entityTypes.values()];
  }
}

export const globalRegistry = new Registry();
