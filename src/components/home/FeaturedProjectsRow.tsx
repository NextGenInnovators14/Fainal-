import React, { useState, useRef } from 'react';
import { useHomeCopy } from './homeEditorUtils';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import { ProjectDetailModal } from '../projects/ProjectDetailModal';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck, 
  Flame
} from 'lucide-react';

export const FeaturedProjectsRow: React.FC = () => {
  const { heading: homeHeading, subheading: homeSubheading } = useHomeCopy('featuredProjects', 'Featured Projects', 'Handpicked RERA-approved townships and luxury residences with direct developer pricing and zero brokerage.');
  const { projects, cmsPages, setActiveView, navigateToProjectDetail } = useApp();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sectionData = cmsPages?.home?.sections?.featuredProjects;
  const heading = sectionData?.heading || homeHeading || 'Featured Projects';
  const subheading = sectionData?.subheading || homeSubheading || 'Explore premier RERA-registered townships and luxury residences with direct developer pricing and zero brokerage.';
  const badge = sectionData?.badge || 'Premier Flash Mandates';

  // Projects list for featured row: prefer featured ones, fallback to all available projects
  const featuredList = projects.filter(p => p.featured);
  const displayProjects = featuredList.length >= 4 ? featuredList : projects;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-10 sm:py-14 bg-[var(--surface)] border-b border-[var(--border)] transition-colors w-full overflow-hidden" id="featured-projects-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header with Left/Right Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-black uppercase tracking-wider border border-[var(--primary)]/20 shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-[var(--secondary)] fill-[var(--secondary)]" />
              <span>{badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                {subheading}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            {/* Scroll Navigation Arrows */}
            <div className="flex items-center space-x-1.5 bg-[var(--surface-secondary)] p-1 rounded-xl border border-[var(--border)]">
              <button
                onClick={scrollLeft}
                aria-label="Scroll left"
                className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll right"
                className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveView('projects')}
              className="inline-flex items-center space-x-1.5 text-xs font-black text-[var(--primary)] hover:text-[var(--secondary)] transition-colors group cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* SINGLE-LINE HORIZONTAL SCROLLING FLASH CARDS */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {displayProjects.map((project, index) => {
            const minPrice = project.minPrice ? `₹${(project.minPrice / 100000).toFixed(project.minPrice % 100000 === 0 ? 0 : 2)}L` : '';
            const maxPrice = project.maxPrice ? `₹${(project.maxPrice / 100000).toFixed(project.maxPrice % 100000 === 0 ? 0 : 2)}L` : '';
            const priceRange = minPrice && maxPrice ? `${minPrice} - ${maxPrice}` : minPrice || project.priceRange || 'Price on Request';
            
            const bhkRange = project.configurations && project.configurations.length > 0 
              ? project.configurations.slice(0, 2).join(', ')
              : (project.bhkRange || '2 & 3 BHK');

            const thumbnail = project.coverImage || project.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

            return (
              <motion.div
                key={project.id}
                id={`featured-project-card-${project.id}`}
                onClick={() => navigateToProjectDetail(project.id)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.28, delay: (index % 6) * 0.05, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start card-theme p-4 rounded-3xl flex flex-col justify-between hover:border-[var(--primary)]/60 hover:shadow-xl transition-all duration-300 group cursor-pointer border border-[var(--border)]"
              >
                <div className="space-y-3.5">
                  {/* Flash Card Image Container */}
                  <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xs">
                    <img
                      src={thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* Top Flash Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="bg-[#F2621E] text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-sm flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Featured Project</span>
                      </span>

                      {project.status && (
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                          {project.status}
                        </span>
                      )}
                    </div>

                    {/* Bottom Price Overlay on Image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-baseline justify-between text-white">
                      <div>
                        <span className="text-sm sm:text-base font-black text-amber-300 drop-shadow-xs">
                          {priceRange}
                        </span>
                        <div className="text-[10px] font-medium text-slate-200">
                          {project.builderName || project.developer}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded">
                        0% Brokerage
                      </span>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="space-y-1.5">
                    <h3 className="font-black text-base text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-xs text-[var(--text-secondary)] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[var(--secondary)] shrink-0" />
                      <span className="truncate">{project.locality || project.location || 'Chh. Sambhajinagar'}</span>
                    </div>
                  </div>

                  {/* Configuration Pill */}
                  <div className="py-1.5 px-3 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] text-xs font-black border border-[var(--primary)]/20 flex items-center justify-between">
                    <span>{bhkRange}</span>
                    <span className="text-[10px] text-[var(--secondary)] font-bold">RERA: {project.reraNumber || project.reraId || 'Verified'}</span>
                  </div>

                  {/* Brief description or offer */}
                  <p className="text-xs text-[var(--text-secondary)] font-normal line-clamp-2 leading-relaxed">
                    {project.exclusiveOffer || project.description || 'Exclusive direct developer booking benefits, landscaped layout and modern clubhouse amenities.'}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Direct Mandate</span>
                  </span>

                  <span className="inline-flex items-center space-x-1 text-xs font-black text-[var(--primary)] group-hover:text-[var(--secondary)] transition-colors">
                    <span>View Project</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Interactive Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};
