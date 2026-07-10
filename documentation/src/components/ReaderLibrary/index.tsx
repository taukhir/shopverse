import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {ArrowRight, Bookmark, CheckCircle2, Download, Flame, Focus, History, Library, Minus, Plus, RotateCcw, Trash2, Upload, X} from 'lucide-react';
import {defaultReaderState, localDateKey, readReaderState, READER_EVENT, studyStreak, type ReaderState, writeReaderState} from '@site/src/utils/readerLibrary';
import {learningCatalog, learningStages, nextLearningPage} from '@site/src/data/learningCatalog';
import styles from './styles.module.css';

export default function ReaderLibrary() {
  const location = useLocation();
  const [state, setState] = useState<ReaderState>(defaultReaderState);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null); const drawerRef = useRef<HTMLElement>(null); const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = (event?: Event) => setState((event as CustomEvent<ReaderState>)?.detail ?? readReaderState());
    sync();
    window.addEventListener(READER_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(READER_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!document.querySelector('article')) return;
      const current = readReaderState();
      const page = {title: document.querySelector('article h1')?.textContent?.trim() || document.title, path: location.pathname, visitedAt: Date.now()};
      const recent = [page, ...current.recent.filter((item) => item.path !== page.path)].slice(0, 10);
      const today = localDateKey();
      const studyDays = [today, ...current.studyDays.filter((day) => day !== today)].slice(0, 120);
      writeReaderState({...current, recent, studyDays});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font-scale', String(state.fontScale));
    document.body.classList.toggle('reader-focus-mode', state.focusMode);
  }, [state.fontScale, state.focusMode]);

  useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement;drawerRef.current?.querySelector<HTMLElement>('button')?.focus();const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);if(event.key==='Tab'){const items=drawerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled)');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};},[open]);

  const update = (next: ReaderState) => { setState(next); writeReaderState(next); };
  const scale = (delta: number) => update({...state, fontScale: Math.min(1.2, Math.max(0.9, Number((state.fontScale + delta).toFixed(1))))});
  const completedPaths = state.completed.map((page) => page.path);
  const nextPage = nextLearningPage(completedPaths);
  const resetStage = (stage: string) => update({...state, completed: state.completed.filter((item) => !learningCatalog.some((page) => page.stage === stage && page.path === item.path))});
  const exportData=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='shopverse-reading-progress.json';link.click();URL.revokeObjectURL(url);};
  const importData=async(event:React.ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());update({...defaultReaderState,...parsed});}catch{window.alert('This is not a valid Shopverse reader-data file.');}event.target.value='';};
  const resetAll=()=>{if(window.confirm('Clear all bookmarks, completion progress, recent pages, and reading preferences?'))update(defaultReaderState);};

  return <>
    <button ref={triggerRef} className={styles.trigger} type="button" onClick={() => setOpen(true)} aria-label="Open my reading library">
      <Library aria-hidden="true" /><span>My library</span>
      {(state.bookmarks.length + state.completed.length > 0) && <strong>{state.bookmarks.length + state.completed.length}</strong>}
    </button>
    {open && <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
      <aside ref={drawerRef} className={styles.drawer} role="dialog" aria-modal="true" aria-label="My reading library" onClick={(event) => event.stopPropagation()}>
        <header><div><Library aria-hidden="true" /><strong>My reading library</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="Close reading library"><X /></button></header>
        <section className={styles.preferences}>
          <div><span>Reading size</span><div><button type="button" onClick={() => scale(-0.1)} disabled={state.fontScale <= 0.9} aria-label="Decrease reading size"><Minus /></button><strong>{Math.round(state.fontScale * 100)}%</strong><button type="button" onClick={() => scale(0.1)} disabled={state.fontScale >= 1.2} aria-label="Increase reading size"><Plus /></button></div></div>
          <button className={state.focusMode ? styles.active : ''} type="button" onClick={() => update({...state, focusMode: !state.focusMode})}><Focus />Reading mode</button>
        </section>
        <section className={styles.dashboard}>
          <h2><CheckCircle2 />Learning dashboard <span>{state.completed.length}/{learningCatalog.length}</span></h2>
          <div className={styles.streak}><Flame /><strong>{studyStreak(state.studyDays)} day streak</strong><span>{state.studyDays.length} study days</span></div>
          {nextPage && <Link className={styles.continue} to={nextPage.path} onClick={() => setOpen(false)}><span><small>Continue learning</small><strong>{nextPage.title}</strong></span><ArrowRight /></Link>}
          <div className={styles.stages}>{learningStages.map((stage) => { const pages=learningCatalog.filter((page)=>page.stage===stage); const done=pages.filter((page)=>completedPaths.includes(page.path)).length; const percent=Math.round(done/pages.length*100); return <div key={stage}><div><strong>{stage}</strong><span>{done}/{pages.length}</span><button type="button" disabled={!done} onClick={()=>resetStage(stage)} aria-label={`Reset ${stage} progress`}><RotateCcw /></button></div><div className={styles.progress}><span style={{width:`${percent}%`}}/><strong>{percent}%</strong></div></div>;})}</div>
        </section>
        <PageList icon={<Bookmark />} title="Bookmarks" pages={state.bookmarks} empty="Bookmark a guide to keep it here." onNavigate={() => setOpen(false)} />
        <PageList icon={<History />} title="Recently viewed" pages={state.recent} empty="Pages you read will appear here." onNavigate={() => setOpen(false)} />
        <section className={styles.dataTools}><h2>Reader data</h2><p>Stored only in this browser. Export a backup to move progress between devices.</p><div><button type="button" onClick={exportData}><Download/>Export data</button><button type="button" onClick={()=>importRef.current?.click()}><Upload/>Import data</button><button type="button" onClick={resetAll}><Trash2/>Reset all</button></div><input ref={importRef} type="file" accept="application/json,.json" onChange={importData}/></section>
        <button className={styles.clear} type="button" onClick={() => update({...state, recent: []})} disabled={!state.recent.length}>Clear recent history</button>
      </aside>
    </div>}
  </>;
}

function PageList({icon, title, pages, empty, onNavigate}: {icon: React.ReactNode; title: string; pages: ReaderState['recent']; empty: string; onNavigate: () => void}) {
  return <section><h2>{icon}{title}<span>{pages.length}</span></h2>{pages.length ? <nav className={styles.pageList}>{pages.slice(0, 6).map((page) => <Link key={page.path} to={page.path} onClick={onNavigate}>{page.title}</Link>)}</nav> : <p className={styles.empty}>{empty}</p>}</section>;
}
