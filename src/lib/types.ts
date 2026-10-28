/* Shared document model for graphics (artboards of positioned elements) and documents (pages of flowing blocks). */
import type { Palette, PaletteKey } from './core';

export type ElType = 'text' | 'image' | 'logo' | 'rect' | 'line' | 'ticks' | 'ring';
export type Align = 'left' | 'center' | 'right' | 'justify';
export type VAlign = 'top' | 'middle' | 'bottom';

/** A positioned artboard element. Optional fields apply to particular element types (see Editor inspector). */
export interface El {
  id: string; t: ElType; x: number; y: number; w: number; h: number;
  z?: number; user?: boolean; hidden?: boolean; op?: number; rot?: number;
  /* text */
  text?: string; ff?: 'display' | 'sans'; fs?: number; fw?: number; it?: boolean; up?: boolean; ls?: number; lh?: number;
  al?: Align; va?: VAlign; c?: string; bg?: string; bd?: string; bw?: number; bt?: string; pad?: number; r?: number;
  /* image */
  src?: string; fit?: 'cover' | 'contain'; pos?: string; label?: string; alt?: string;
  /* rect / line */
  dashBd?: boolean; guide?: boolean; dash?: boolean;
}
/** Element built by the layout engine for a text slot — text props are always present. */
export type TextEl = El & { text: string; fs: number; pad: number };

/** Template content: named text slots plus layout options and harvested image state (`__src_<id>`, `__fit_<id>`). */
export type Slots = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface GPage {
  id: string; name: string; layout: string; palette?: PaletteKey; slots: Slots; els?: El[]; bg?: string; bgSrc?: string; cards?: unknown;
}
export interface GraphicDoc {
  kind: 'graphic'; tpl: string; name: string; W: number; H: number; sizeIndex: number; palette: PaletteKey; pages: GPage[]; updated: number;
}
export interface Frame { layout: string; palette?: PaletteKey; slots: Slots }
export interface GraphicTemplate {
  id: string; cat: string; name: string; layout: string; palette: PaletteKey; slots: Slots;
  sizes: [string, number, number][]; variants: PaletteKey[]; frames?: Frame[]; article?: boolean;
}

export type BlockType = 'eyebrow' | 'title' | 'subtitle' | 'h1' | 'h2' | 'h3' | 'lead' | 'para' | 'quote' | 'callout' | 'note' | 'list' | 'table'
  | 'image' | 'gallery' | 'stats' | 'chart' | 'timeline' | 'kv' | 'steps' | 'columns' | 'toc' | 'takeaways' | 'exercise' | 'byline' | 'cta'
  | 'logo' | 'divider' | 'spacer' | 'signature' | 'contact';
export interface Block {
  id: string; t: BlockType; text: string;
  al?: Align; sz?: number; c?: string; label?: string; cap?: string; btn?: string; ord?: boolean; lines?: number;
  ratio?: string; w?: number; src?: string; alt?: string; fit?: 'cover' | 'contain'; srcs?: string[];
}
export type PageLayout = 'page' | 'cover' | 'divider' | 'back' | 'slide' | 'email';
export interface DPage {
  id: string; name: string; layout: PageLayout; bg: PaletteKey; va?: VAlign; hideNum?: boolean; hideHeader?: boolean; section?: string; blocks: Block[];
}
export interface DocSettings { numbers: boolean; numStart: number; numPos: 'center' | 'outside'; header: boolean; theme: string }
export interface DocDoc {
  kind: 'doc'; tpl: string; type: string; name: string; format: string; title: string; author: string; settings: DocSettings; pages: DPage[]; updated: number;
}
export interface DocTemplate { id: string; cat: 'documents' | 'email'; type: string; name: string; format: string; keys?: string[]; overrides?: Record<number, { blocks: [BlockType, string][] }>; custom?: () => DPage[] }
export interface Format { label: string; w: number; h: number; m: number; base: number; mm?: string }

export type AnyDoc = GraphicDoc | DocDoc;
export type Template = GraphicTemplate | DocTemplate;
export type { Palette, PaletteKey };
