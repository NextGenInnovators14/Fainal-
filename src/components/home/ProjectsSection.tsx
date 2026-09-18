import React, { useState, useRef } from 'react';
import { useHomeCopy } from './homeEditorUtils';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers
} from 'lucide-react';

type ProjectTabType = 'all' | 'residential' | 'commercial' | 'township';

export const ProjectsSection: React.FC = () => {
  const { heading: homeHeading, subheading: homeSubheading } = useHomeCopy(
    'projects', 
    'Projects in Chh. Sambhajinagar', 
    'RERA-approved mega townships, high-rises, and commercial hubs with direct developer booking perks.'
  );
  const { projects: contextProjects, setActiveView, navigateToProjectDetail } = useApp();
  const [activeTab, setActiveTab] = useState<ProjectTabType>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allProjects = contextProjects && contextProjects.length > 0 ? contextProjects : [];

  const filteredProjects = allProjects.filter(p => {
    if (activeTab === 'residential') {
      return (
        p.name.toLowerCase().includes('residency') || 
        p.name.toLowerCase().includes('greens') || 
        p.name.toLowerCase().includes('heights') ||
        p.name.toLowerCase().includes('enclave') ||
        p.name.toLowerCase().includes('solitaire') ||
        p.name.toLowerCase().includes('lifestyle') ||
        p.name.toLowerCase().includes('oasis')
      );
    }
    if (activeTab === 'commercial') {
      return (
        p.locality.toLowerCase().includes('midc') || 
        p.locality.toLowerCase().includes('shendra') || 
        p.locality.toLowerCase().includes('dmic') || 
        p.name.toLowerCase().includes('arcade') || 
        p.name.toLowerCase().includes('park') || 
        p.name.toLowerCase().includes('hub') ||
        p.name.toLowerCase().includes('commercial')
      );
    }
    if (activeTab === 'township') {
      return (
        p.name.toLowerCase().includes('township') ||
        p.name.toLowerCase().includes('greens') ||
        p.name.toLowerCase().includes('oasis') ||
        p.configurations.some(c => c.toLowerCase().includes('villa') || c.toLowerCase().includes('plot'))
      );
    }
    return true;
  });

  // Ensure plenty of cards across both lines
  const displayProjects = filteredProjects.length >= 4 ? filteredProjects : allProjects;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320 * 2, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320 * 2, behavior: 'smooth' });
    }
  };

  const handleOpenProjectModal = (p: Project) => {
    navigateToProjectDetail(p.id);
  };

  const tabs: { id: ProjectTabType; label: string }[] = [
    { id: 'all', label: 'All Projects' },
    { id: 'residential', label: 'Residential Townships' },
    { id: 'commercial', label: 'Commercial & IT Parks' },
    { id: 'township', label: 'Villas & Gated Estates' },
  ];

  return (
    <section 
      id="projects-in-sambhajinagar-section"
      className="py-10 sm:py-14 bg-white border-b border-slate-200/80 transition-colors w-full overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* SECTION HEADER: Title & View All */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200/70">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Builder Mandates & RERA Townships</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {homeHeading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
              {homeSubheading}
            </p>
          </div>

          {/* Right Action: Scroll Navigation + View All Link */}
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={scrollLeft}
                aria-label="Scroll projects left"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll projects right"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveView('properties')}
              className="inline-flex items-center space-x-1.5 text-xs font-black text-[#1E4FA8] hover:text-[#F2621E] transition-colors cursor-pointer group shrink-0 py-1"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* TAB TOGGLE: All / Residential / Commercial / Villas */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div 
            id="projects-category-tabs"
            className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`project-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center text-xs font-semibold text-slate-500">
            <span>Showing <strong className="text-slate-800">{displayProjects.length}</strong> mega projects • 2 Lines Horizontal Scroll</span>
          </div>
        </div>

        {/* 2-LINE HORIZONTAL SCROLLING PROJECTS CONTAINER */}
        <div
          ref={scrollContainerRef}
          id="projects-sambhajinagar-horizontal-2lines"
          className="grid grid-rows-2 grid-flow-col auto-cols-[275px] sm:auto-cols-[305px] md:auto-cols-[335px] gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {displayProjects.map((project, index) => {
            const projectImg = project.images && project.images.length > 0
              ? project.images[0]
              : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

            return (
              <motion.div
                key={project.id || index}
                id={`project-card-${project.id || index}`}
                onClick={() => handleOpenProjectModal(project)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.25, delay: (index % 6) * 0.04, ease: "easeOut" }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="snap-start group bg-slate-50/70 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-600/50 transition-all duration-200 flex flex-col justify-between cursor-pointer h-full"
              >
                {/* Image Section */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  <img
                    src={projectImg}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  
                  {/* Status & RERA badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="bg-slate-900/85 backdrop-blur-xs text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-xs">
                      {project.status}
                    </span>

                    {project.reraNumber && (
                      <span className="bg-emerald-700/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs flex items-center space-x-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>MahaRERA</span>
                      </span>
                    )}
                  </div>

                  {/* Price overlay */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 text-white flex items-baseline justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-black text-amber-300 drop-shadow-xs">
                        {project.priceRange}
                      </span>
                    </div>
                    {project.possession && (
                      <span className="text-[10px] font-semibold text-slate-300 bg-black/40 px-1.5 py-0.5 rounded">
                        Poss: {project.possession}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {/* Developer */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{project.builder}</span>
                      {project.featured && (
                        <span className="text-amber-600 flex items-center space-x-0.5">
                          <Sparkles className="w-3 h-3" />
                          <span>Premium</span>
                        </span>
                      )}
                    </div>

                    {/* Project Name */}
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {project.name}
                    </h4>

                    {/* Locality */}
                    <p className="text-[11px] text-slate-600 font-medium flex items-center space-x-1 truncate">
                      <MapPin className="w-3 h-3 text-[#F2621E] shrink-0" />
                      <span className="truncate">{project.locality}</span>
                    </p>

                    {/* Configurations tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.configurations.slice(0, 3).map((config, idx) => (
                        <span 
                          key={idx}
                          className="text-[9px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/80"
                        >
                          {config}
                        </span>
                      ))}
                      {project.configurations.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 self-center">
                          +{project.configurations.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Direct Developer Offer
                    </span>
                    <span className="text-[11px] font-black text-emerald-700 group-hover:text-emerald-800 flex items-center space-x-0.5 transition-colors">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Bottom Strip */}
        <div className="pt-2">
          <button
            onClick={() => setActiveView('properties')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-emerald-800 border border-slate-200 text-xs font-black shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Browse All {allProjects.length} RERA Approved Projects & Townships in Sambhajinagar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
