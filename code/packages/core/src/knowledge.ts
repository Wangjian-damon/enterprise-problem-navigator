/**
 * 知识库抽象（P2b 版：内存实现，PostgreSQL/pgvector 后续替换）
 * 承载连接器抽取的实体与关系，提供混合检索（精确 + 关键词 + 关系扩展）
 */
import { Entity, Relation } from './types';

export interface KnowledgeBase {
  ingest(entities: Entity[], relations: Relation[]): void;
  /** 精确匹配：按 id / 名称 / 类型 */
  search(query: string, opts?: { limit?: number; type?: string }): Entity[];
  /** 关系扩展：实体的邻居（一跳） */
  neighbors(entityId: string): Relation[];
  getEntity(id: string): Entity | undefined;
  allEntities(): Entity[];
  allRelations(): Relation[];
}

export class InMemoryKnowledgeBase implements KnowledgeBase {
  private entities = new Map<string, Entity>();
  private relations: Relation[] = [];
  private byName = new Map<string, Entity[]>();

  ingest(entities: Entity[], relations: Relation[]): void {
    for (const e of entities) {
      this.entities.set(e.id, e);
      const list = this.byName.get(e.name) ?? [];
      list.push(e);
      this.byName.set(e.name, list);
    }
    this.relations.push(...relations);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /** 检索：名称精确 → 问题包含实体名 → 名称包含问题关键词（子串） */
  search(query: string, opts?: { limit?: number; type?: string }): Entity[] {
    const limit = opts?.limit ?? 10;
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const exact = this.byName.get(q) ?? [];
    const results: Entity[] = [];
    const seen = new Set<string>();
    for (const e of exact) {
      if (opts?.type && e.type !== opts.type) continue;
      if (!seen.has(e.id)) {
        seen.add(e.id);
        results.push(e);
      }
    }
    // 1) 问题包含实体名（如问题含 "E1002" 命中实体 E1002）——中文问题检索的主路径
    for (const e of this.entities.values()) {
      if (results.length >= limit) break;
      if (opts?.type && e.type !== opts.type) continue;
      const name = e.name.toLowerCase();
      if (name.length >= 2 && q.includes(name) && !seen.has(e.id)) {
        seen.add(e.id);
        results.push(e);
      }
    }
    // 2) 实体名包含问题关键词（英文/代码标识符场景，如 query 命中 queryCreditResult）
    for (const e of this.entities.values()) {
      if (results.length >= limit) break;
      if (opts?.type && e.type !== opts.type) continue;
      if (e.name.toLowerCase().includes(q) && !seen.has(e.id)) {
        seen.add(e.id);
        results.push(e);
      }
    }
    return results.slice(0, limit);
  }

  neighbors(entityId: string): Relation[] {
    return this.relations.filter((r) => r.from === entityId || r.to === entityId);
  }

  allEntities(): Entity[] {
    return [...this.entities.values()];
  }

  allRelations(): Relation[] {
    return [...this.relations];
  }
}

export const globalKnowledgeBase = new InMemoryKnowledgeBase();
