import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight } from 'lucide-react';
import { CmsPageSection } from '../../types';

export const CmsPageView: React.FC<{ pageId: string }> = ({ pageId }) => {
  const { cmsPages, setActiveView } = useApp();
  const page = cmsPages?.[pageId];
  if (!page) return <div className="max-w-4xl mx-auto p-10 text-center">Page not found.</div>;
  return (
    <div className="bg-[var(--background)] min-h-screen">
      {Object.values(page.sections || {}).map((section: CmsPageSection) => (
        <section key={section.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          {section.imageUrl && <img src={section.imageUrl} alt="" className="w-full max-h-[420px] object-cover rounded-3xl mb-7" referrerPolicy="no-referrer" />}
          {section.badge && <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-[#1E4FA8] text-xs font-black mb-3">{section.badge}</span>}
          {section.heading && <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">{section.heading}</h1>}
          {section.subheading && <p className="mt-4 max-w-3xl text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">{section.subheading}</p>}
          {section.bodyText && <div className="mt-6 whitespace-pre-wrap text-sm sm:text-base leading-8 text-[var(--text-secondary)]">{section.bodyText}</div>}
          {section.ctaText && <button onClick={() => setActiveView(section.ctaLink || 'home')} className="mt-6 px-5 py-3 rounded-xl bg-[#F2621E] text-white font-black text-sm inline-flex items-center gap-2">{section.ctaText}<ArrowRight className="w-4 h-4"/></button>}
        </section>
      ))}
    </div>
  );
};
