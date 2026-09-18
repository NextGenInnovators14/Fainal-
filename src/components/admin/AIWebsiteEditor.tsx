import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HomePageCanvas } from '../home/HomePageCanvas';
import {
  ArrowDown, ArrowUp, Check, ChevronRight, ImagePlus, Loader2, MessageSquare,
  Monitor, Paperclip, RotateCcw, Save, Sparkles, Smartphone, Wand2, X
} from 'lucide-react';
import { applyLocalHomeAI } from '../../utils/homeEditorAI';

const compactAIState = (value: any, depth = 0): any => {
  if (depth > 8) return value;
  if (typeof value === 'string') {
    if (/^data:(image|video)\//i.test(value)) return '[binary media omitted — use the attached screenshot or supplied URL]';
    if (value.length > 24000) return `${value.slice(0, 24000)}…[truncated]`;
    return value;
  }
  if (Array.isArray(value)) return value.map(item => compactAIState(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, compactAIState(item, depth + 1)]));
  }
  return value;
};

/**
 * AI-first website operator. This is deliberately a separate admin surface so
 * a non-technical owner has one obvious place to ask for changes.
 */
export const AIWebsiteEditor: React.FC = () => {
  const app = useApp() as any;
  const {
    homePageConfig, updateHomePageConfig, cmsPages, addCmsPage, updateCmsSection,
    navigationConfig, updateNavigationConfig, settings, updateSettings,
    bannerAds, updateBannerAd, offers, updateOffer, projects, updateProject,
    allProperties, updateProperty, realtors, updateRealtor, clubCardsConfig,
    updateClubCardsConfig, mediaLibrary, updateMediaItem, cmsBlogs, updateCmsBlog,
    trainingBlogs, updateTrainingBlog, knowledgeHubConfig, updateKnowledgeHubConfig,
    customServiceDetails, updateCustomServiceDetail, showToast, setActiveView
  } = app;

  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [result, setResult] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [selectedId, setSelectedId] = useState(homePageConfig.sections?.[0]?.id || 'hero');
  const [showPreview, setShowPreview] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => homePageConfig.sections?.find((s: any) => s.id === selectedId) || homePageConfig.sections?.[0],
    [homePageConfig.sections, selectedId]
  );

  const readImage = (file: File) => {
    if (!file.type.startsWith('image/')) return showToast('Sirf image/screenshot attach karo.', 'error');
    if (file.size > 8 * 1024 * 1024) return showToast('Image 8MB se chhoti honi chahiye.', 'error');
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      const comma = raw.indexOf(',');
      setImage({ data: comma >= 0 ? raw.slice(comma + 1) : raw, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const applyResponse = (data: any) => {
    if (data?.config) updateHomePageConfig(data.config);
    if (data?.settings) updateSettings(data.settings);
    if (data?.navigationConfig) updateNavigationConfig(data.navigationConfig);
    if (Array.isArray(data?.createdPages)) {
      data.createdPages.forEach((p: any) => addCmsPage(p));
      const existingNav = Array.isArray(navigationConfig?.navItems) ? navigationConfig.navItems : [];
      const additions = data.createdPages
        .filter((p: any) => p?.id && p?.title && !existingNav.some((n: any) => n.viewOrUrl === p.id))
        .map((p: any, i: number) => ({ id: `nav-${p.id}`, label: p.title, viewOrUrl: p.id, order: existingNav.length + i + 1, published: true }));
      if (additions.length) updateNavigationConfig({ navItems: [...existingNav, ...additions] });
    }
    if (data?.deletedPages) data.deletedPages.forEach((id: string) => app.deleteCmsPage?.(id));
    if (data?.pageUpdates) Object.entries(data.pageUpdates).forEach(([pageId, value]: [string, any]) => {
      if (value?.sectionId && value?.updates) updateCmsSection(pageId, value.sectionId, value.updates);
      else Object.entries(value || {}).forEach(([sectionId, updates]: [string, any]) => updateCmsSection(pageId, sectionId, updates));
    });
    const updateCollection = (items: any[], fn: (id: string, value: any) => void) => {
      if (Array.isArray(items)) items.forEach(item => item?.id && fn(item.id, item));
    };
    updateCollection(data?.bannerAds, updateBannerAd);
    updateCollection(data?.offers, updateOffer);
    updateCollection(data?.projects, updateProject);
    updateCollection(data?.properties, updateProperty);
    updateCollection(data?.realtors, updateRealtor);
    updateCollection(data?.cmsBlogs, updateCmsBlog);
    updateCollection(data?.trainingBlogs, updateTrainingBlog);
    updateCollection(data?.mediaLibrary, updateMediaItem);
    if (data?.clubCardsConfig) updateClubCardsConfig(data.clubCardsConfig);
    if (data?.knowledgeHubConfig) updateKnowledgeHubConfig(data.knowledgeHubConfig);
    if (data?.customServiceDetails) {
      Object.entries(data.customServiceDetails).forEach(([id, value]) => updateCustomServiceDetail(id, value));
    }
  };

  const [history, setHistory] = useState<{ label: string; time: number; snapshot: any }[]>([]);

  // Full-state snapshot for Undo. Captured right before an AI change is
  // actually applied (never before a clarification, since nothing changes
  // then). Deep-cloned via JSON so later in-place edits to app state can't
  // silently mutate what we're holding onto for restore.
  const captureSnapshot = () => JSON.parse(JSON.stringify({
    homePageConfig, cmsPages, navigationConfig, settings, bannerAds, offers, projects,
    allProperties, realtors, clubCardsConfig, mediaLibrary, cmsBlogs, trainingBlogs,
    knowledgeHubConfig, customServiceDetails
  }));

  const pushHistory = (label: string) => {
    setHistory(prev => [...prev.slice(-4), { label, time: Date.now(), snapshot: captureSnapshot() }]);
  };

  const undoLast = () => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const s = last.snapshot;
      updateHomePageConfig(s.homePageConfig);
      updateNavigationConfig(s.navigationConfig);
      updateSettings(s.settings);
      if (s.clubCardsConfig) updateClubCardsConfig(s.clubCardsConfig);
      if (s.knowledgeHubConfig) updateKnowledgeHubConfig(s.knowledgeHubConfig);
      const restoreCollection = (items: any[], fn: (id: string, value: any) => void) => {
        if (Array.isArray(items)) items.forEach(item => item?.id && fn(item.id, item));
      };
      restoreCollection(s.bannerAds, updateBannerAd);
      restoreCollection(s.offers, updateOffer);
      restoreCollection(s.projects, updateProject);
      restoreCollection(s.allProperties, updateProperty);
      restoreCollection(s.realtors, updateRealtor);
      restoreCollection(s.cmsBlogs, updateCmsBlog);
      restoreCollection(s.trainingBlogs, updateTrainingBlog);
      restoreCollection(s.mediaLibrary, updateMediaItem);
      Object.entries(s.customServiceDetails || {}).forEach(([id, value]) => updateCustomServiceDetail(id, value));
      Object.entries(s.cmsPages || {}).forEach(([pageId, page]: [string, any]) => {
        Object.entries(page?.sections || {}).forEach(([sectionId, updates]: [string, any]) => updateCmsSection(pageId, sectionId, updates));
      });
      showToast(`Undone: ${last.label}`, 'info');
      return prev.slice(0, -1);
    });
  };

  const run = async (forcedPrompt?: string) => {
    const instruction = (forcedPrompt ?? prompt).trim();
    if (!instruction && !image) return;
    setBusy(true); setResult('');
    try {
      const res = await fetch('/api/ai/home-editor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction || 'Use the screenshot as the source of truth and make the requested visual change.',
          image, selectedSectionId: selected?.id || null,
          config: compactAIState(homePageConfig), pages: compactAIState(cmsPages), navigationConfig: compactAIState(navigationConfig), settings: compactAIState(settings),
          bannerAds: compactAIState(bannerAds), offers: compactAIState(offers), projects: compactAIState(projects), allProperties: compactAIState(allProperties), realtors: compactAIState(realtors), clubCardsConfig: compactAIState(clubCardsConfig),
          mediaLibrary: compactAIState(mediaLibrary), cmsBlogs: compactAIState(cmsBlogs), trainingBlogs: compactAIState(trainingBlogs), knowledgeHubConfig: compactAIState(knowledgeHubConfig), customServiceDetails: compactAIState(customServiceDetails)
        })
      });
      const rawResponse = await res.text();
      let data: any;
      try { data = rawResponse ? JSON.parse(rawResponse) : {}; } catch {
        throw new Error(`AI server returned invalid JSON (${res.status}).`);
      }
      if (!res.ok) throw new Error(data?.error || 'AI request failed');
      if (data?.configured === false) {
        const local = applyLocalHomeAI(instruction, homePageConfig, cmsPages, navigationConfig, selected?.id || null);
        if (local.needsClarification) {
          setResult(`⚠ ${local.message}`);
          showToast(local.message, 'warning');
        } else {
        pushHistory(instruction || 'Screenshot command');
        updateHomePageConfig(local.config);
        if (local.navigationConfig) updateNavigationConfig(local.navigationConfig);
        local.createdPages?.forEach((p: any) => addCmsPage(p));
        if (local.pageUpdates) Object.entries(local.pageUpdates).forEach(([pageId, value]: [string, any]) => {
          if (value?.sectionId && value?.updates) updateCmsSection(pageId, value.sectionId, value.updates);
          else Object.entries(value || {}).forEach(([sectionId, updates]: [string, any]) => updateCmsSection(pageId, sectionId, updates));
        });
        if (local.createdPages?.length) {
          const nav = Array.isArray(navigationConfig?.navItems) ? navigationConfig.navItems : [];
          const additions = local.createdPages.filter((p:any) => !nav.some((n:any) => n.viewOrUrl === p.id)).map((p:any,i:number) => ({ id:`nav-${p.id}`, label:p.title, viewOrUrl:p.id, order:nav.length+i+1, published:true }));
          if (additions.length) updateNavigationConfig({ navItems:[...nav, ...additions] });
        }
        setResult(local.message);
        showToast('AI key configure nahi hai — built-in editor command apply kiya.', 'warning');
        }
      } else if (data?.needsClarification) {
        setResult(`⚠ ${data.message || 'Ek detail chahiye — kaunsa section/element?'}`);
        showToast(data.message || 'AI ko ek detail chahiye.', 'warning');
      } else {
        pushHistory(data.message || instruction || 'AI change');
        applyResponse(data);
        setResult(data.message || 'Change applied successfully.');
        showToast(data.message || 'AI changes applied.', 'success');
      }
    } catch (e: any) {
      // Keep ordinary text commands usable even when Gemini is unavailable or
      // returns an invalid response. Screenshot understanding still requires
      // GEMINI_API_KEY, but text-only commands use the deterministic local editor.
      if (instruction) {
        const local = applyLocalHomeAI(instruction, homePageConfig, cmsPages, navigationConfig, selected?.id || null);
        if (local.needsClarification) {
          setResult(`⚠ ${local.message}`);
          showToast(local.message, 'warning');
        } else {
        pushHistory(instruction);
        updateHomePageConfig(local.config);
        if (local.pageUpdates) Object.entries(local.pageUpdates).forEach(([pageId, value]: [string, any]) => {
          if (value?.sectionId && value?.updates) updateCmsSection(pageId, value.sectionId, value.updates);
          else Object.entries(value || {}).forEach(([sectionId, updates]: [string, any]) => updateCmsSection(pageId, sectionId, updates));
        });
        local.createdPages?.forEach((p: any) => addCmsPage(p));
        setResult(local.message);
        showToast(image ? 'AI response failed — text command applied safely; screenshot can be retried after fixing AI configuration.' : 'AI service unavailable — built-in command applied.', 'warning');
        }
      } else {
        showToast(e?.message || 'AI editor request failed.', 'error');
        setResult('Change apply nahi hua. Dobara try karo.');
      }
    } finally {
      setBusy(false); setPrompt(''); setImage(null);
    }
  };

  const quick = [
    'Homepage ko premium aur clean banao, lekin existing content mat hatao.',
    'Services section ko compact karo aur auto-scroll speed 1.5x karo.',
    'Sale Properties ko Featured Projects ke neeche move karo.',
    'Ek naya page banao: About Auricity, aur navigation mein add karo.'
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-950 via-[#10234a] to-[#163d85] text-white rounded-[28px] p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-cyan-200 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> AI Website Operator
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-3">Website ko bolo. AI khud karega.</h2>
            <p className="text-sm text-slate-300 mt-2 leading-6">Text mein bolo, screenshot bhejo, ya homepage ka section select karo. AI supported website content, pages, navigation aur homepage layout ko update karega.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(v => !v)} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-xs font-black flex items-center gap-2"><Monitor className="w-4 h-4" /> {showPreview ? 'Hide Preview' : 'Show Preview'}</button>
            <button onClick={() => setActiveView('home')} className="px-3 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black">Live Website</button>
          </div>
        </div>
      </div>

      <div className={`grid gap-5 ${showPreview ? 'xl:grid-cols-[390px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 h-fit xl:sticky xl:top-4">
          <div className="flex items-center justify-between">
            <div><div className="text-sm font-black text-slate-900">AI Command Center</div><div className="text-[11px] text-slate-500">Simple language • no coding</div></div>
            <Wand2 className="w-5 h-5 text-[#F2621E]" />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setDevice('mobile')} className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${device === 'mobile' ? 'bg-[#1E4FA8] text-white' : 'bg-slate-100 text-slate-600'}`}><Smartphone className="w-4 h-4 inline mr-1"/>Mobile</button>
            <button onClick={() => setDevice('desktop')} className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${device === 'desktop' ? 'bg-[#1E4FA8] text-white' : 'bg-slate-100 text-slate-600'}`}><Monitor className="w-4 h-4 inline mr-1"/>Desktop</button>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 focus-within:border-[#1E4FA8] focus-within:ring-4 focus-within:ring-blue-50 p-3">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); }} rows={6} placeholder="Example: ‘Hero section ki heading ko chhota karo aur CTA orange rakho’\n\nYa: ‘Is screenshot jaisa spacing karo’" className="w-full resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button onClick={() => fileRef.current?.click()} className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black flex items-center gap-1.5"><Paperclip className="w-4 h-4"/>Screenshot</button>
              <button disabled={busy || (!prompt.trim() && !image)} onClick={() => run()} className="px-4 py-2 rounded-xl bg-[#F2621E] text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-40"><Wand2 className="w-4 h-4"/>{busy ? 'Working…' : 'Do it'}</button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) readImage(f); e.currentTarget.value=''; }} />

          {image && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-bold text-blue-800"><ImagePlus className="w-4 h-4"/><span className="truncate">{image.name}</span><button onClick={() => setImage(null)} className="ml-auto"><X className="w-4 h-4"/></button></div>}
          {result && (
            <div className={`p-3 rounded-xl text-xs font-bold flex gap-2 ${result.startsWith('⚠') ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
              <Check className="w-4 h-4 shrink-0"/>{result}
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent AI changes</span>
                <button onClick={undoLast} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-700 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5"/>Undo last change</button>
              </div>
              <div className="space-y-1">
                {[...history].reverse().slice(0, 3).map((h, i) => (
                  <div key={h.time} className={`text-[11px] font-semibold truncate ${i === 0 ? 'text-slate-700' : 'text-slate-400'}`}>{i === 0 ? '● ' : '○ '}{h.label}</div>
                ))}
              </div>
            </div>
          )}


          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Try these</div>
            <div className="space-y-1.5">{quick.map((q,i)=><button key={i} onClick={() => run(q)} disabled={busy} className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-semibold text-slate-700 transition-colors">{q}</button>)}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-xs font-black text-slate-800 mb-2">Selected homepage section</div>
            <select value={selected?.id || ''} onChange={e => setSelectedId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold">
              {homePageConfig.sections?.map((s:any)=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => run(`Move ${selected?.label || 'this section'} to the top`)} className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black"><ArrowUp className="w-3.5 h-3.5 inline mr-1"/>Top</button>
              <button onClick={() => run(`Move ${selected?.label || 'this section'} to the bottom`)} className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black"><ArrowDown className="w-3.5 h-3.5 inline mr-1"/>Bottom</button>
            </div>
          </div>
        </section>

        {showPreview && <section className="bg-slate-100 rounded-3xl border border-slate-200 p-3 sm:p-5 min-h-[700px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div><span className="text-xs font-black text-slate-800">Live Homepage Preview</span><span className="text-[10px] text-slate-400 ml-2">Tap a section to select it</span></div>
            <div className="text-[10px] font-bold text-slate-500">{homePageConfig.sections?.filter((s:any)=>s.visible).length} visible sections</div>
          </div>
          <div className={`${device === 'mobile' ? 'max-w-[390px]' : 'max-w-[1180px]'} mx-auto bg-white rounded-2xl shadow-xl overflow-hidden`}>
            <HomePageCanvas editMode selectedId={selected?.id} onSelect={setSelectedId} />
          </div>
        </section>}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-[#1E4FA8]"/><h3 className="font-black text-sm">Owner can ask for anything supported by the CMS</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-slate-600">
          {['Homepage sections','Pages & navigation','Properties & projects','Banners, blogs & services','Branding & settings','Realtors & clubs','Screenshots as visual reference','Scroll & layout controls'].map(x => <div key={x} className="p-3 rounded-xl bg-slate-50 border border-slate-100">✓ {x}</div>)}
        </div>
      </div>
    </div>
  );
};
