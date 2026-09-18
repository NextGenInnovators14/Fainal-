import React from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_CMS_PAGES } from '../../data/cmsInitialData';
import { AuricityLogo } from '../common/AuricityLogo';
import { ChevronRight, Edit3 } from 'lucide-react';

const OWNER_PHOTO_DIRECT_URL = 'https://cdn.postimage.me/2026/09/02/1000001101.png';

export const AboutUsView: React.FC = () => {
  const { cmsPages, activeRole, setActiveView } = useApp();

  // Retrieve current CMS data with robust fallbacks
  const aboutPage = cmsPages?.about || INITIAL_CMS_PAGES.about;
  const mainContent = aboutPage?.sections?.mainContent;
  const customFields = mainContent?.customFields;

  // Fallback defaults matching exact user prompt
  const defaultParagraphs = [
    "Founded in 2023, Auricity Developers is one of the most esteemed real estate management companies in Chhatrapati Sambhajinagar (Aurangabad). We have helped hundreds of clients achieve their property goals. Whether you want to buy or sell a residential property or rent/lease an office space, we have got you covered.",
    "Auricity Developers has built a legacy of trust, quality, and customer satisfaction. We put our clients first, and every decision we make is towards the welfare of our clients. When you work with us, you not only get access to expertise and years of experience but also trust and a stamp of approval from hundreds of clients we have served.",
    "We assure you a niche experience with personalised services, step-by-step guidance, transparent dealings, fair market pricing, honest commitments, and a well-organised programme to make your next real estate transaction a smooth and memorable one. We believe in educating our customers with in-depth analysis of the latest Real estate market information, current design trends, and prevailing prices.",
    "We only work with Reputed Builders who are known for their exceptional workmanship, solid aesthetically beautiful buildings, fair dealings, timely delivery and have proven track record.",
    "For buying, we truly aspire to get you:\nThe Right property at The Right Location at The Right Price.",
    "And for sellers, we aim to fetch the best price, reliable legal guidance, and a streamlined process with a one-stop solution to sum up all your real estate aspirations on a single table."
  ];

  const pageHeading = mainContent?.heading || 'About Us';
  const tagline = customFields?.tagline || 'Delivering Dreams, Trust, and Customer Excellence.';
  const paragraphs: string[] = Array.isArray(customFields?.paragraphs) && customFields.paragraphs.length > 0
    ? customFields.paragraphs
    : defaultParagraphs;

  const ownerName = customFields?.ownerName || 'Vinod Sonawane';
  const ownerRole = customFields?.ownerRole || 'Director - Auricity Developers';
  const ownerPhoto = (customFields?.ownerPhoto && !customFields.ownerPhoto.includes('vinod_sonawane.jpg'))
    ? customFields.ownerPhoto
    : OWNER_PHOTO_DIRECT_URL;
  const customLogoUrl = customFields?.logoUrl || '';

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-slate-900 selection:bg-[#F2621E]/20">
      {/* Breadcrumb Navigation & Admin Shortcut */}
      <div className="border-b border-stone-200/80 bg-white/80 backdrop-blur-xs sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500" aria-label="Breadcrumb">
            <button
              onClick={() => setActiveView('home')}
              className="hover:text-[#1E4FA8] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1E4FA8] font-bold">About Us</span>
          </nav>

          {activeRole === 'admin' && (
            <button
              onClick={() => setActiveView('admin-hub')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E4FA8] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 cursor-pointer shadow-2xs"
              title="Open About Us Page Editor in CMS"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#F2621E]" />
              <span>Edit in CMS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        {/* PAGE HEADING */}
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
            {pageHeading}
          </h1>

          {/* TAGLINE (Highlighted Box, same style as already built) */}
          <div className="mt-6 sm:mt-8 max-w-2xl mx-auto">
            <div className="bg-slate-100/95 text-slate-900 border border-slate-200/90 rounded-2xl px-6 py-4 shadow-sm">
              <p className="text-base sm:text-xl font-black tracking-tight text-slate-900 font-display">
                "{tagline}"
              </p>
            </div>
          </div>
        </header>

        {/* BODY COPY (Exact text, same paragraph spacing as already built) */}
        <div className="space-y-6 sm:space-y-7 text-base sm:text-lg text-slate-700 leading-relaxed font-sans max-w-3xl mx-auto">
          {paragraphs.map((para, idx) => {
            // Check if paragraph contains explicit line breaks (e.g. Paragraph 5)
            const lines = para.split('\n');
            return (
              <p key={idx} className="text-justify sm:text-left">
                {lines.map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {line}
                    {lineIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
          })}
        </div>

        {/* OWNER PROFILE (Centered, NO "Team Auricity" heading or team-style label above this block) */}
        <div className="mt-14 sm:mt-20 pt-10 border-t border-stone-200/80 flex flex-col items-center text-center">
          
          {/* Owner Photo (Circular crop, centered) */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 ring-2 ring-[#1E4FA8]/15 flex items-center justify-center">
            <img
              src={ownerPhoto}
              alt={ownerName}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/vinod_sonawane.png';
              }}
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Directly below: Owner Name */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display mt-5">
            {ownerName}
          </h2>

          {/* Directly below: Owner Role */}
          <p className="text-sm sm:text-base font-bold text-[#F2621E] uppercase tracking-wider mt-1">
            {ownerRole}
          </p>

          {/* Directly below that: Auricity Logo (Icon + Wordmark, centered) */}
          <div className="mt-8 sm:mt-10 flex justify-center">
            {customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt="Auricity Developers"
                className="h-12 sm:h-14 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <AuricityLogo variant="full" size="lg" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
