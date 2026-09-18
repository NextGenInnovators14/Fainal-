import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PropertyDetailModal } from '../properties/PropertyDetailModal';
import { Property } from '../../types';
import { normalizeListingType } from '../../utils/propertyUtils';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Flame,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck
} from 'lucide-react';

export const FeaturedSection: React.FC = () => {
  const { allProperties, setActiveView, navigateToPropertyDetail } = useApp();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'sale' | 'rent' | 'pg'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter featured properties
  const filtered = allProperties.filter(p => {
    if (p.approvalStatus === 'rejected' || p.approvalStatus === 'pending') return false;
    // Prefer featured properties, but if none marked, show all
    if (filterTab === 'sale') return normalizeListingType(p.listingType) === 'sale';
    if (filterTab === 'rent') return normalizeListingType(p.listingType) === 'rent';
    if (filterTab === 'pg') return normalizeListingType(p.listingType) === 'pg';
    return true;
  });

  const featuredList = filtered.filter(p => p.featured).length > 0
    ? filtered.filter(p => p.featured)
    : filtered;

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

  const getBhkOrTypeDisplay = (p: Property) => {
    if (p.bhk) return `${p.bhk} BHK`;
    if (p.propertyType === 'Apartment' || p.propertyType === 'apartment') return 'Apartment';
    if (p.propertyType === 'Independent House / Villa') return 'Villa / House';
    if (p.propertyType === 'Penthouse') return 'Penthouse';
    if (p.propertyType === 'Commercial Shop') return 'Commercial Shop';
    if (p.propertyType === 'Commercial Office') return 'Office Space';
    return p.propertyType || 'Property';
  };

  return (
    <section 
      id="featured-properties-horizontal-section"
      className="py-10 sm:py-14 bg-slate-900 text-white border-b border-slate-800 transition-colors w-full overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F2621E]/20 text-[#F2621E] text-xs font-black uppercase tracking-wider border border-[#F2621E]/30">
              <Flame className="w-3.5 h-3.5 fill-[#F2621E]" />
              <span>Handpicked Direct Listings • Single Line Scroll</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Featured Properties in Sambhajinagar
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Prime verified flats, independent row houses, and commercial spaces with 0% brokerage and genuine owner contacts.
            </p>
          </div>

          {/* Controls: Filter Tabs + Scroll Buttons */}
          <div className="flex items-center space-x-3 self-start sm:self-auto flex-wrap gap-y-2">
            <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 shadow-2xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'sale', label: 'Sale' },
                { id: 'rent', label: 'Rent' },
                { id: 'pg', label: 'PG / Co-Living' }
              ].map(tab => {
                const isActive = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#F2621E] text-white shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scroll navigation arrows */}
            <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-2xs">
              <button
                onClick={scrollLeft}
                aria-label="Scroll featured properties left"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll featured properties right"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 1-LINE HORIZONTAL SCROLLING CONTAINER */}
        <div
          ref={scrollContainerRef}
          id="featured-properties-single-line-scroll"
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {featuredList.map((property, idx) => {
            const coverImage = property.images && property.images.length > 0
              ? property.images[0]
              : 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';

            return (
              <motion.div
                key={property.id || idx}
                id={`featured-prop-card-${property.id || idx}`}
                onClick={() => navigateToPropertyDetail(property.id)}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: (idx % 6) * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start group bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden hover:border-[#F2621E] hover:shadow-xl hover:shadow-[#F2621E]/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-950">
                  <img
                    src={coverImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="bg-[#F2621E] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured</span>
                    </span>

                    {property.zeroBrokerage && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        0% Brokerage
                      </span>
                    )}
                  </div>

                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white space-y-0.5">
                    <div className="text-base sm:text-lg font-black text-amber-300 tracking-tight drop-shadow-xs">
                      {property.priceDisplay || `₹ ${(property.price / 100000).toFixed(1)} L`}
                    </div>
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {getBhkOrTypeDisplay(property)} • {property.carpetArea ? `${property.carpetArea.toLocaleString('en-IN')} sq.ft` : 'Clear Title'}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {/* Locality */}
                    <p className="text-[11px] text-slate-400 font-medium flex items-center space-x-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#F2621E] shrink-0" />
                      <span className="truncate">{property.locality}</span>
                    </p>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {property.title}
                    </h4>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Owner</span>
                    </span>
                    <span className="text-[11px] font-black text-[#F2621E] group-hover:text-amber-400 flex items-center space-x-0.5 transition-colors">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* View All CTA Strip */}
        <div className="text-center pt-2">
          <button
            onClick={() => setActiveView('properties')}
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs px-6 py-2.5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer font-bold"
          >
            <span>Explore All {allProperties.filter(p => p.approvalStatus !== 'pending').length} Verified Sambhajinagar Properties</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </section>
  );
};
