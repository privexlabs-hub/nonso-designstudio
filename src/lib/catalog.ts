/* Unified template catalogue (graphics + documents + emails) and the saved-or-fresh working doc for each. */
import * as G from './graphics';
import * as D from './docs';
import { store } from './core';
import type { AnyDoc, GraphicTemplate, DocTemplate } from './types';

export type CatalogItem = (GraphicTemplate & { kind: 'graphic' }) | (DocTemplate & { kind: 'doc' });
export const catalog: CatalogItem[] = [
  ...G.templates.map(t => ({ ...t, kind: 'graphic' as const })),
  ...D.templates.map(t => ({ ...t, kind: 'doc' as const })),
];
export const findTemplate = (id: string) => catalog.find(t => t.id === id);
export const categories: { k: string; l: string; sub: string }[] = [
  ...G.cats.map(([k, l, sub]) => ({ k, l, sub })),
  { k: 'documents', l: 'Documents', sub: 'Multi-page · PDF, DOCX, EPUB, PPTX' },
  { k: 'email', l: 'Email', sub: '600 px · HTML email, PDF, PNG' },
];
export const docKey = (id: string) => 'ns:doc:' + id;
export const fresh = (t: CatalogItem, slots?: Record<string, string>): AnyDoc => t.kind === 'graphic' ? G.create(t, { slots }) : D.create(t);

const cache = new Map<string, AnyDoc>();
/** The user's saved version if there is one (marked edited), otherwise a cached fresh doc. */
export const docFor = (t: CatalogItem): { doc: AnyDoc; edited: boolean } => {
  const s = store.get<AnyDoc | null>(docKey(t.id), null);
  if (s && s.kind === t.kind) return { doc: s, edited: true };
  if (!cache.has(t.id)) cache.set(t.id, fresh(t));
  return { doc: cache.get(t.id)!, edited: false };
};
