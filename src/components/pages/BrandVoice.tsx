'use client';
import { useState } from 'react';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { copy, download } from '@/lib/core';
import { toast } from '@/lib/toast';
import { voice, voiceText, type VoiceStatus } from '@/lib/voice';
import css from './BrandVoice.module.css';

type Filter = 'all' | VoiceStatus;
const st: Record<VoiceStatus, [string, string, string]> = {
  verified: ['Verified fact', 'var(--ui-success-bg)', 'var(--ui-success)'],
  proposed: ['Proposed guidance', 'var(--ui-info-bg)', 'var(--ui-info)'],
  confirm: ['Needs confirmation', 'var(--ui-warning-bg)', 'var(--ui-warning)'],
};
const text = voiceText();
const words = text.split(/\s+/).length;
const legend: [Filter, string, string][] = [['all', 'All sections', 'var(--ui-text-2)'], ...Object.entries(st).map(([k, v]) => [k as Filter, v[0], v[2]] as [Filter, string, string])];

export function BrandVoice() {
  const [filter, setFilter] = useState<Filter>('all');
  const list = voice.filter(s => filter === 'all' || s.status === filter);
  return (
    <div className="s-page">
      <StudioHeader current="voice" />
      <main id="main" className={`s-main ${css.main}`}>
        <p className="s-eyebrow">Brand voice &amp; knowledge</p>
        <h1 className="s-h1" style={{ maxWidth: '18ch' }}>Everything an AI tool needs to write like us.</h1>
        <p className="s-lead" style={{ maxWidth: '64ch' }}>Paste the complete reference into ChatGPT, Claude or a content-calendar tool once, then ask for posts, captions, emails or articles. Every section is labelled so the tool knows what is a fact and what still needs confirming.</p>
        <div className="s-row">
          <button type="button" className="s-btn" onClick={() => copy(text, 'complete brand reference (' + voice.length + ' sections)')}>Copy complete reference</button>
          <button type="button" className="s-btn s-btn--outline" onClick={() => { download(new Blob([text], { type: 'text/markdown' }), 'nonso-stitches-brand-voice-knowledge.md'); toast('Downloaded Markdown', 'success'); }}>Download .md</button>
          <button type="button" className="s-btn s-btn--quiet" onClick={() => { download(new Blob([text.replace(/^#+ /gm, '')], { type: 'text/plain' }), 'nonso-stitches-brand-voice-knowledge.txt'); toast('Downloaded text file', 'success'); }}>Download .txt</button>
          <span className="s-muted" style={{ fontSize: 13 }}>{voice.length} sections · ~{words.toLocaleString()} words</span>
        </div>
        <div className={css.legend} role="group" aria-label="Filter by status">
          {legend.map(([k, label, dot]) => (
            <button key={k} type="button" className="s-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              <span className="s-dot" style={{ background: dot }} />{label} · {k === 'all' ? voice.length : voice.filter(s => s.status === k).length}
            </button>
          ))}
        </div>
        <nav aria-label="Sections" className={css.toc}>
          {list.map(s => <a key={s.id} href={'#' + s.id}>{s.title}</a>)}
        </nav>
        {list.map(s => (
          <section key={s.id} id={s.id} className={css.section}>
            <div className={css.head}>
              <h2 className={css.h2}>{s.title}</h2>
              <div className={css.actions}>
                <span className="s-pill" style={{ background: st[s.status][1], color: st[s.status][2] }}>{st[s.status][0]}</span>
                <button type="button" className="s-btn s-btn--quiet s-btn--sm" onClick={() => copy(voiceText([s]).replace(/^# .*\n\n.*\n/, ''), '“' + s.title + '”')}>Copy section</button>
              </div>
            </div>
            <div className={css.body}>{s.body}</div>
          </section>
        ))}
      </main>
    </div>
  );
}
