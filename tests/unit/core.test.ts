import { describe, it, expect } from 'vitest';
import { colorFormats, contrast, slug, esc, verdict, hexToRgb } from '@/lib/core';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import { fname, isPerPage } from '@/lib/export';
import { catalog, categories } from '@/lib/catalog';
import { voice } from '@/lib/voice';

describe('core helpers', () => {
  it('formats colours', () => {
    expect(colorFormats('#0b0a08')).toEqual({ hex: '#0B0A08', rgb: 'rgb(11, 10, 8)', hsl: 'hsl(40, 16%, 4%)' });
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });
  it('computes WCAG contrast and verdicts', () => {
    expect(contrast('#E0B04F', '#0B0A08').toFixed(1)).toBe('9.9');
    expect(verdict(contrast('#15181A', '#F3F4F2'))).toBe('AA');
    expect(verdict(contrast('#959B9E', '#F3F4F2'))).toBe('Fail');
    expect(verdict(3.2)).toBe('AA large');
  });
  it('slugs and escapes', () => {
    expect(slug('The Fit Guide (ebook)')).toBe('the-fit-guide-ebook');
    expect(slug('')).toBe('file');
    expect(esc('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});

describe('template catalogue', () => {
  it('has 81 graphics, 9 documents and 6 emails in 13 categories', () => {
    expect(G.templates).toHaveLength(81);
    expect(D.templates.filter(t => t.cat === 'documents')).toHaveLength(9);
    expect(D.templates.filter(t => t.cat === 'email')).toHaveLength(6);
    expect(catalog).toHaveLength(96);
    expect(categories).toHaveLength(13);
    expect(new Set(catalog.map(t => t.id)).size).toBe(96);
  });
  it('has 18 user-selectable layouts and 31 block types (the original README says 30; its code defines 31)', () => {
    expect(G.layoutChoices).toHaveLength(18);
    expect(Object.keys(D.blockTypes)).toHaveLength(31);
  });
  it('routes extreme aspect ratios to strip / tower layouts', () => {
    expect(G.layoutOf('statement', 728, 90)).toBe('strip');
    expect(G.layoutOf('statement', 160, 600)).toBe('tower');
    expect(G.layoutOf('avatar', 728, 90)).toBe('avatar');
    expect(G.layoutOf('banner', 1500, 500)).toBe('banner');
    expect(G.layoutOf('banner', 1128, 150)).toBe('strip');
  });
  it('keeps text and uploaded images across relayout', () => {
    const doc = G.create(G.templates.find(t => t.id === 'sq-launch')!, { slots: { title: 'Kept' } });
    doc.pages[0].els!.find(e => e.id === 'image')!.src = 'data:image/png;base64,AAA';
    const r = G.relayout(doc, 1080, 1920, 'chalk');
    const els = r.pages[0].els!;
    expect(els.find(e => e.id === 'title')!.text).toBe('Kept');
    expect(els.find(e => e.id === 'image')!.src).toBe('data:image/png;base64,AAA');
    expect(r.pages[0].bg).toBe('#F3F4F2');
  });
  it('builds a 34-page ebook with TOC headings', () => {
    const d = D.create(D.templates.find(t => t.id === 'doc-ebook')!);
    expect(d.pages).toHaveLength(34);
    expect(D.headings(d).map(h => h.text)).toContain('Your fittings');
  });
  it('has the voice sections', () => { expect(voice.map(v => v.id)).toContain('accuracy'); });
});

describe('export naming', () => {
  it('names files by template, size and page', () => {
    const g = G.create(G.templates.find(t => t.id === 'car-lookbook')!);
    expect(fname(g, null, 'pdf')).toBe('lookbook-carousel-1080x1080.pdf');
    expect(fname(g, 2, 'jpeg')).toBe('lookbook-carousel-1080x1080-p03.jpg');
    const d = D.create(D.templates.find(t => t.id === 'em-welcome')!);
    expect(fname(d, null, 'md')).toBe('welcome-email.md');
    expect(isPerPage('svg')).toBe(true); expect(isPerPage('pdf')).toBe(false);
  });
});
