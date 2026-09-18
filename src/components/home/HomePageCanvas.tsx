import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroVideoSection } from './HeroVideoSection';
import { TopLocalitiesRow } from './TopLocalitiesRow';
import { FourCtaCards } from './FourCtaCards';
import { ServicesRow } from './ServicesRow';
import { BannerAdsCarousel } from './BannerAdsCarousel';
import { FeaturedProjectsRow } from './FeaturedProjectsRow';
import { ProjectsSection } from './ProjectsSection';
import { FeaturedSection } from './FeaturedSection';
import { LoanBannerSection } from './LoanBannerSection';
import { PropertiesSaleSection } from './PropertiesSaleSection';
import { VerifiedRealtorsRow } from './VerifiedRealtorsRow';
import { TwoClubCards } from './TwoClubCards';
import { PropertiesRentSection } from './PropertiesRentSection';
import { BuyerTestimonialsSection } from './BuyerTestimonialsSection';
import { KnowledgeHubSection } from './KnowledgeHubSection';
import { NewsArticlesRow } from './NewsArticlesRow';
import { WhyChooseAuricity } from './WhyChooseAuricity';

interface Props { editMode?: boolean; selectedId?: string; onSelect?: (id: string) => void; onOpenEMIModal?: () => void; onOpenAffiliateModal?: () => void; onOpenAdvertiseModal?: () => void; }

const COMPONENTS: Record<string, React.FC<any>> = {
  hero: HeroVideoSection, localities: TopLocalitiesRow, cta: FourCtaCards, services: ServicesRow,
  bannerAds: BannerAdsCarousel, featuredProjects: FeaturedProjectsRow, projects: ProjectsSection,
  featuredProperties: FeaturedSection, loanBanner: LoanBannerSection, saleProperties: PropertiesSaleSection,
  realtors: VerifiedRealtorsRow, clubs: TwoClubCards, rentProperties: PropertiesRentSection,
  testimonials: BuyerTestimonialsSection, blogs: NewsArticlesRow, news: NewsArticlesRow,
  knowledgeHub: KnowledgeHubSection, whyChoose: WhyChooseAuricity,
};

const spacing: Record<string,string> = { tight: 'py-1', normal: 'py-0', airy: 'py-5 sm:py-8' };
const backgrounds: Record<string,string> = { default: '', soft: 'bg-slate-50', warm: 'bg-orange-50/40', blue: 'bg-blue-50/50', dark: 'bg-slate-950 text-white' };

export const HomePageCanvas: React.FC<Props> = ({ editMode = false, selectedId, onSelect, onOpenEMIModal, onOpenAffiliateModal, onOpenAdvertiseModal }) => {
  const { homePageConfig } = useApp();
  useEffect(() => {
    if (homePageConfig.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement('link');
      link.rel = 'icon'; link.href = homePageConfig.faviconUrl; document.head.appendChild(link);
    }
  }, [homePageConfig.faviconUrl]);

  return <>
    {homePageConfig.sections.map(section => {
      if (!section.visible) return null;

      const Component = COMPONENTS[section.id];
      if (!Component) return null;
      const isSelected = selectedId === section.id;
      return <div key={section.id} data-home-section={section.id} className={`relative ${spacing[section.spacing] || ''} ${backgrounds[section.background] || ''} ${isSelected && editMode ? 'ring-2 ring-inset ring-[#1E4FA8]' : ''}`}>
        {editMode && <button type="button" onClick={(e) => { e.stopPropagation(); onSelect?.(section.id); }} className="absolute z-[60] top-2 left-2 px-3 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black shadow-lg border border-white/20">✦ Edit {section.label}</button>}
        <Component onOpenEMIModal={onOpenEMIModal} onOpenAffiliateModal={onOpenAffiliateModal} onOpenAdvertiseModal={onOpenAdvertiseModal} />
      </div>;
    })}
  </>;
};
