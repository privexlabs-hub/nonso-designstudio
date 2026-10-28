/* Parity: the TypeScript engine must produce the same documents and HTML as the original lib/*.js.
   Set NS_SRC to the folder holding the original lib/ to run; skipped otherwise. */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import * as R from '@/lib/render';
import * as X from '@/lib/export';
import { voiceText } from '@/lib/voice';
import type { AnyDoc } from '@/lib/types';

const SRC = process.env.NS_SRC;
/* categories added on top of the original inventory — compared separately (no original to match) */
const ADDED_CATS = new Set(['platform-posts', 'new-month', 'celebrations']);
const original = <T extends { cat: string }>(t: T) => !ADDED_CATS.has(t.cat);
type Legacy = { G: typeof G; D: typeof D; R: typeof R; X: typeof X; voiceText: typeof voiceText; logoData?: string };
let NS: Legacy;

/* ids and timestamps are random; replace them with stable markers before comparing */
const norm = (s: string) => s
  .replace(/"id":"[^"]*"/g, '"id":"#"').replace(/"updated":\d+/g, '"updated":0')
  .replace(/data-(page|block)="[^"]*"/g, 'data-$1="#"')
  .replace(/\/?assets\/logo\/nonso-stitches-badge-primary\.jpg/g, 'LOGO');

describe.skipIf(!SRC)('parity with original JS', () => {
  beforeAll(() => {
    const w = window as unknown as { NS?: Legacy };
    delete w.NS;
    for (const f of ['ns-core.js', 'ns-voice.js', 'ns-graphics.js', 'ns-docs.js', 'ns-render.js', 'ns-export.js']) {
      new Function(fs.readFileSync(path.join(SRC!, 'lib', f), 'utf8'))();
    }
    NS = w.NS!;
  });

  it('has the same template registries', () => {
    const orig = NS.G.templates.map(t => t.id);
    expect(G.templates.slice(0, orig.length).map(t => t.id)).toEqual(orig);
    expect(G.templates.slice(orig.length).every(t => ADDED_CATS.has(t.cat))).toBe(true);
    expect(G.templates.filter(original)).toHaveLength(81);
    expect(D.templates.map(t => t.id)).toEqual(NS.D.templates.map(t => t.id));
    expect(G.layoutChoices).toEqual(NS.G.layoutChoices);
  });

  it('creates identical graphic docs and HTML for every template, size and variation', () => {
    for (const t of G.templates.filter(original)) {
      for (let size = 0; size < t.sizes.length; size++) {
        for (const palette of t.variants) {
          const a = G.create(t, { size, palette }) as AnyDoc;
          const b = NS.G.create(NS.G.templates.find(x => x.id === t.id)!, { size, palette }) as AnyDoc;
          expect(norm(JSON.stringify(a)), `${t.id} ${size} ${palette}`).toBe(norm(JSON.stringify(b)));
          a.pages.forEach((_, i) => expect(norm(R.page(a, i))).toBe(norm(NS.R.page(b, i))));
        }
      }
    }
  });

  it('creates identical document pages and HTML for every document and email template', () => {
    for (const t of D.templates) {
      const a = D.create(t);
      const b = NS.D.create(NS.D.templates.find(x => x.id === t.id)!);
      expect(norm(JSON.stringify(a)), t.id).toBe(norm(JSON.stringify(b)));
      a.pages.forEach((_, i) => expect(norm(R.docPage(a, i)), `${t.id} p${i}`).toBe(norm(NS.R.docPage(b, i))));
    }
  });

  it('relayouts identically across sizes', () => {
    for (const t of G.templates.filter(t => t.sizes.length > 1 && original(t))) {
      const a = G.create(t), b = NS.G.create(NS.G.templates.find(x => x.id === t.id)!);
      const [, W, H] = t.sizes[1];
      expect(norm(JSON.stringify(G.relayout(a, W, H, 'chalk')))).toBe(norm(JSON.stringify(NS.G.relayout(b, W, H, 'chalk'))));
    }
  });

  it('produces identical Markdown, plain text and email HTML for every template', () => {
    for (const t of [...G.templates.filter(original), ...D.templates]) {
      const graphic = 'sizes' in t;
      const a = (graphic ? G.create(t) : D.create(t)) as AnyDoc;
      const src = graphic ? NS.G.templates.find(x => x.id === t.id)! : NS.D.templates.find(x => x.id === t.id)!;
      const b = (graphic ? NS.G.create(src as never) : NS.D.create(src as never)) as AnyDoc;
      expect(X.md(a), t.id).toBe(NS.X.md(b));
      expect(X.txt(a), t.id).toBe(NS.X.txt(b));
      if (a.kind === 'doc' && a.format === 'email') expect(norm(X.emailHtml(a)).replace(/https?:\/\/[^"]*LOGO/g, 'LOGO'), t.id).toBe(norm(NS.X.emailHtml(b as never)).replace(/https?:\/\/[^"]*LOGO/g, 'LOGO'));
      expect(X.formatsFor(a)).toEqual(NS.X.formatsFor(b));
    }
  });

  it('produces the identical voice reference', () => {
    expect(voiceText()).toBe(NS.voiceText());
  });
});
