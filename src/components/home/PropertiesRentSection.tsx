import React, { useState, useRef } from 'react';
import { useHomeCopy } from './homeEditorUtils';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { normalizeListingType } from '../../utils/propertyUtils';
import { PropertyDetailModal } from '../properties/PropertyDetailModal';
import { Property } from '../../types';
import { 
  KeyRound, 
  ArrowRight, 
  MapPin, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const PropertiesRentSection: React.FC = () => {
  const { heading: homeHeading, subheading: homeSubheading } = useHomeCopy(
    'rentProperties', 
    'Properties on Rent', 
    'Find verified rental homes, commercial spaces and flexible living options.'
  );
  const { allProperties, setActiveView, navigateToPropertyDetail } = useApp();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'residential' | 'commercial' | 'pg'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter rent properties
  const rentProperties = allProperties.filter(p => {
    if (p.approvalStatus === 'rejected' || p.approvalStatus === 'pending') return false;
    const isRent = ['rent', 'pg'].includes(normalizeListingType(p.listingType));
    if (!isRent) return false;

    if (activeTab === 'residential') {
      return (
        p.propertyType === 'Apartment' || 
        p.propertyType === 'apartment' || 
        p.propertyType === 'Independent House / Villa' ||
        p.propertyType === 'row_house'
      );
    }
    if (activeTab === 'commercial') {
      return (
        p.propertyType === 'Commercial Office' || 
        p.propertyType === 'Commercial Shop' || 
        p.propertyType === 'commercial'
      );
    }
    if (activeTab === 'pg') {
      return p.propertyType === 'Co-living / PG';
    }
    return true;
  });

  // Ensure plenty of rental cards
  const displayRentals = rentProperties.length >= 4 
    ? rentProperties 
    : allProperties.filter(p => ['rent', 'pg'].includes(normalizeListingType(p.listingType)));

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
    if (p.propertyType === 'Commercial Shop') return 'Shop / Retail';
    if (p.propertyType === 'Commercial Office') return 'Office Space';
    if (p.propertyType === 'Co-living / PG') return 'PG / Hostel';
    return p.propertyType || 'Rental';
  };

  return (
    <section 
      id="properties-on-rent-section"
      className="py-10 sm:py-14 bg-slate-50/80 border-b border-slate-200/80 transition-colors w-full overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider border border-indigo-200/60">
              <KeyRound className="w-3.5 h-3.5 text-[#F2621E]" />
              <span>Zero Brokerage Direct Rentals • Single Line Scroll</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {homeHeading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
              {homeSubheading}
            </p>
          </div>

          {/* Controls: Tab Toggle + Scroll Arrows */}
          <div className="flex items-center space-x-3 self-start sm:self-auto flex-wrap gap-y-2">
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {[
                { id: 'all', label: 'All Rentals' },
                { id: 'residential', label: 'Flats & Houses' },
                { id: 'commercial', label: 'Offices / Shops' },
                { id: 'pg', label: 'PG & Hostels' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scroll navigation arrows */}
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={scrollLeft}
                aria-label="Scroll rental properties left"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll rental properties right"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveView('rentals')}
              className="hidden lg:inline-flex items-center space-x-1.5 text-xs font-black text-indigo-600 hover:text-[#F2621E] transition-colors cursor-pointer group shrink-0 py-1"
            >
              <span>View All Rentals</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 1-LINE HORIZONTAL SCROLLING RENTALS CONTAINER */}
        <div
          ref={scrollContainerRef}
          id="properties-rent-single-line-scroll"
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {displayRentals.map((property, idx) => {
            const coverImage = property.images && property.images.length > 0
              ? property.images[0]
              : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80';

            return (
              <motion.div
                key={property.id || idx}
                id={`rent-card-${property.id || idx}`}
                onClick={() => navigateToPropertyDetail(property.id)}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: (idx % 6) * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-[280px] sm:w-[310px] md:w-[330px] shrink-0 snap-start group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  <img
                    src={coverImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="bg-indigo-600/95 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                      {getBhkOrTypeDisplay(property)}
                    </span>

                    {property.zeroBrokerage && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        0% Brokerage
                      </span>
                    )}
                  </div>

                  {/* Bottom Rent overlay */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white space-y-0.5">
                    <div className="text-base sm:text-lg font-black text-amber-300 tracking-tight drop-shadow-xs">
                      {property.priceDisplay || `₹ ${property.price.toLocaleString('en-IN')}/mo`}
                    </div>
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {property.carpetArea ? `${property.carpetArea.toLocaleString('en-IN')} sq.ft • ` : ''}{property.locality}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {/* Locality */}
                    <p className="text-[11px] text-slate-500 font-medium flex items-center space-x-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#F2621E] shrink-0" />
                      <span className="truncate">{property.locality}</span>
                    </p>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {property.title}
                    </h4>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{property.verified ? 'Verified Owner' : 'Direct Listing'}</span>
                    </span>
                    <span className="text-[11px] font-black text-indigo-600 group-hover:text-indigo-700 flex items-center space-x-0.5 transition-colors">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* View All Rentals CTA */}
        <div className="text-center pt-2">
          <button
            onClick={() => setActiveView('rentals')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 text-xs font-black shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Browse All {rentProperties.length} Direct Owner Rental Homes in Sambhajinagar</span>
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
