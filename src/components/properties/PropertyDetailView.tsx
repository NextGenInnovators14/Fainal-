import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { GoogleMapsEmbed } from '../common/GoogleMapsEmbed';
import { Property, Project } from '../../types';
import { formatPriceINR } from '../../utils/propertyUtils';
import { 
  ArrowLeft, 
  MapPin, 
  Share2, 
  Heart, 
  CheckCircle2, 
  Calendar, 
  Home, 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  MessageSquare, 
  Play, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Car, 
  Dumbbell, 
  Waves, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  TreePine, 
  FileText, 
  X,
  Clock,
  Layers,
  Check,
  Send,
  Calculator,
  Eye,
  Sliders
} from 'lucide-react';

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80';



export const PropertyDetailView: React.FC = () => {
  const { 
    selectedPropertyId, 
    selectedProjectId,
    allProperties, 
    projects, 
    setActiveView, 
    navigateToPropertyDetail, 
    navigateToProjectDetail, 
    isFavorite, 
    toggleFavorite, 
    addLead, 
    showToast 
  } = useApp();

  // Find either property or project
  const currentProperty = useApp().allProperties.find(p => p.id === selectedPropertyId);
  const currentProject = useApp().projects.find(p => p.id === (selectedProjectId || selectedPropertyId));

  // Determine active item type & normalize
  const isProject = !currentProperty && !!currentProject;
  const item = currentProperty || currentProject || allProperties[0];

  // Photo Gallery State (uses listing-owned media; never fabricates property photos)
  const fullGallery = useMemo(() => {
    const customImgs = Array.isArray((item as any)?.images) ? (item as any).images.filter(Boolean) : [];
    return customImgs.length ? customImgs : [DEFAULT_PROPERTY_IMAGE];
  }, [item]);

  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState<boolean>(false);

  // Blueprint / Floor Plan State
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'blueprint' | 'video' | 'shorts'>('photos');
  const [blueprintZoom, setBlueprintZoom] = useState<number>(1);
  const [isBlueprintFullscreen, setIsBlueprintFullscreen] = useState<boolean>(false);

  // Inquiry / Site Visit Form State
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryDate, setInquiryDate] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('I would like to schedule a site visit and discuss pricing details.');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  // EMI Calculator State
  const listingPrice = (currentProperty?.price || (currentProject ? currentProject.minPrice : 5500000)) || 5500000;
  const [loanAmount, setLoanAmount] = useState<number>(Math.round(listingPrice * 0.8));
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);

  const monthlyEMI = useMemo(() => {
    const monthlyRate = interestRate / (12 * 100);
    const totalMonths = loanTenureYears * 12;
    if (monthlyRate === 0) return Math.round(loanAmount / totalMonths);
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  }, [loanAmount, loanTenureYears, interestRate]);

  // Reset indices on navigation
  useEffect(() => {
    setActivePhotoIdx(0);
    setBlueprintZoom(1);
    setActiveMediaTab('photos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPropertyId, selectedProjectId]);

  // Handle Inquiry Submit
  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) {
      showToast('Please provide your Name and Phone Number', 'error');
      return;
    }
    setSubmittingInquiry(true);
    setTimeout(() => {
      addLead({
        name: inquiryName,
        phone: inquiryPhone,
        propertyTitle: (item as any)?.title || (item as any)?.name || 'Listing Inquiry',
        message: inquiryMessage,
        status: 'new',
        preferredLocality: item?.locality || 'Chhatrapati Sambhajinagar',
        source: 'Property Detail Page'
      });
      setSubmittingInquiry(false);
      setVisitModalOpen(false);
      showToast('Site visit request received! Our property specialist will call you.', 'success');
      setInquiryName('');
      setInquiryPhone('');
    }, 600);
  };

  // Coordinates for Google Maps
  const coordinates = useMemo(() => {
    if (item && 'coordinates' in item && item.coordinates) {
      return item.coordinates;
    }
    // Reliable Sambhajinagar locality default centroids
    const loc = item?.locality || '';
    if (loc.includes('CIDCO')) return { lat: 19.8762, lng: 75.3626 };
    if (loc.includes('Garkheda')) return { lat: 19.8550, lng: 75.3440 };
    if (loc.includes('Jalna')) return { lat: 19.8710, lng: 75.3780 };
    if (loc.includes('Shendra') || loc.includes('MIDC')) return { lat: 19.8820, lng: 75.4520 };
    if (loc.includes('Beed Bypass')) return { lat: 19.8450, lng: 75.3280 };
    return { lat: 19.8762, lng: 75.3433 };
  }, [item]);

  // Full formatted address
  const fullAddress = useMemo(() => {
    if ('address' in item && item.address) return item.address;
    return `${item?.locality || 'CIDCO'}, Chhatrapati Sambhajinagar, Maharashtra 431005`;
  }, [item]);

  // Similar properties or projects
  const similarItems = useMemo(() => {
    if (isProject) {
      return projects.filter(p => p.id !== item.id).slice(0, 4);
    }
    return allProperties
      .filter(p => p.id !== item.id && (p.locality === item.locality || p.category === (item as Property).category))
      .slice(0, 4);
  }, [item, isProject, projects, allProperties]);

  const title = (item as any)?.title || (item as any)?.name || 'Luxury Property in Sambhajinagar';
  const priceDisplay = (item as any)?.priceDisplay || (item as any)?.priceRange || formatPriceINR((item as any)?.price || 6000000);
  const reraNum = (item as any)?.reraNumber || (('rera' in item) ? (item as any).rera : '') || '';
  const floorPlanImage = (item as any)?.floorPlanUrl || '';
  const videoEmbedUrl = (item as any)?.videoUrl || '';
  const shortsEmbedUrl = (item as any)?.shortsUrl || '';
  const hasFloorPlan = Boolean(floorPlanImage);
  const hasVideo = Boolean(videoEmbedUrl);
  const hasShorts = Boolean(shortsEmbedUrl);

  return (
    <div className="bg-[var(--surface-secondary)] min-h-screen pb-16 transition-colors">
      
      {/* 1. BREADCRUMB & BACK NAVIGATION BAR */}
      <div className="bg-white border-b border-[#E5DEC9] sticky top-14 sm:top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 text-xs text-slate-600 truncate">
            <button
              onClick={() => setActiveView(isProject ? 'projects' : 'properties')}
              className="hover:text-[#1E4FA8] font-bold flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#F2621E]" />
              <span className="hidden sm:inline">Back to</span> <span>{isProject ? 'Projects' : 'Properties'}</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 truncate hidden md:inline">{item?.locality}</span>
            <span className="text-slate-300 hidden md:inline">/</span>
            <span className="text-slate-900 font-extrabold truncate max-w-[200px] sm:max-w-xs">{title}</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Direct listing link copied to clipboard!', 'info');
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E4FA8] transition-colors border border-slate-200 cursor-pointer shadow-2xs"
              title="Share Listing"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                toggleFavorite(item.id);
                showToast(isFavorite(item.id) ? 'Removed from favorites' : 'Saved to favorites!', 'success');
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                isFavorite(item.id)
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Save to Favorites"
            >
              <Heart className={`w-4 h-4 ${isFavorite(item.id) ? 'fill-current text-rose-500' : ''}`} />
            </button>

            <a
              href="tel:+918010506030"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1E4FA8] hover:bg-[#15397d] text-white text-xs font-black shadow-xs transition-all active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Call +91 8010506030</span>
            </a>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* 2. TITLE & HEADER SUMMARY CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E2DAC6] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#1E4FA8] text-white text-[11px] font-black uppercase tracking-wider shadow-2xs">
                {isProject ? 'Township Project' : ((item as Property).propertyType || 'Residential')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>0% Brokerage Direct</span>
              </span>
              {reraNum && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E4FA8] border border-blue-200 text-[11px] font-mono font-bold">
                  MahaRERA: {reraNum}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>

            <div className="flex items-center space-x-2 text-slate-600 text-xs sm:text-sm font-medium">
              <MapPin className="w-4 h-4 text-[#F2621E] shrink-0" />
              <span>{fullAddress}</span>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col items-baseline lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block lg:text-right">
                All-Inclusive Price
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#1E4FA8] tracking-tight">
                {priceDisplay}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold lg:text-right">
                {'carpetArea' in item ? `₹ ${Math.round(((item as Property).price || 5000000) / ((item as Property).carpetArea || 900))} / sq.ft` : 'Best Builder Direct Price'}
              </p>
            </div>

            <button
              onClick={() => setVisitModalOpen(true)}
              className="mt-2 bg-[#F2621E] hover:bg-[#d95214] text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-amber-200" />
              <span>Schedule Site Visit</span>
            </button>
          </div>
        </motion.div>

        {/* 3. PHOTO GALLERY & MEDIA TABS (20+ Photos, Swipeable, Zoomable) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl border border-[#E2DAC6] p-4 sm:p-6 shadow-sm space-y-4"
        >
          {/* Media Category Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={() => setActiveMediaTab('photos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeMediaTab === 'photos'
                    ? 'bg-[#1E4FA8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>📸 Photos ({fullGallery.length})</span>
              </button>

              <button
                onClick={() => hasFloorPlan && setActiveMediaTab('blueprint')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${!hasFloorPlan ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  activeMediaTab === 'blueprint'
                    ? 'bg-[#1E4FA8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>{hasFloorPlan ? 'Blueprint & Floor Plan' : 'Floor Plan Unavailable'}</span>
              </button>

              <button
                onClick={() => hasVideo && setActiveMediaTab('video')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${!hasVideo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  activeMediaTab === 'video'
                    ? 'bg-[#1E4FA8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>{hasVideo ? 'Video Tour' : 'Video Unavailable'}</span>
              </button>

              <button
                onClick={() => hasShorts && setActiveMediaTab('shorts')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${!hasShorts ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  activeMediaTab === 'shorts'
                    ? 'bg-[#1E4FA8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>{hasShorts ? 'Shorts (9:16)' : 'Shorts Unavailable'}</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              Verified High-Resolution Media
            </span>
          </div>

          {/* TAB 1: MAIN PHOTO CAROUSEL */}
          {activeMediaTab === 'photos' && (
            <div className="space-y-3">
              {/* Active Hero Image with Next/Prev Controls */}
              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-950 group shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhotoIdx}
                    src={fullGallery[activePhotoIdx]}
                    alt={`${title} - Photo ${activePhotoIdx + 1}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setIsFullscreenGallery(true)}
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>

                {/* Left/Right Prev-Next Arrows */}
                <button
                  onClick={() => setActivePhotoIdx(prev => (prev === 0 ? fullGallery.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-[#1E4FA8] text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-md active:scale-95 cursor-pointer"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setActivePhotoIdx(prev => (prev === fullGallery.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-[#1E4FA8] text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-md active:scale-95 cursor-pointer"
                  aria-label="Next Photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Counter Badge */}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-xs text-white text-xs font-mono font-bold flex items-center space-x-1.5 shadow-xs">
                  <span>Photo {activePhotoIdx + 1} of {fullGallery.length}</span>
                </div>

                {/* Fullscreen Trigger */}
                <button
                  onClick={() => setIsFullscreenGallery(true)}
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 hover:bg-[#F2621E] text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              </div>

              {/* Thumbnail Strip Below Carousel (20+ Photos) */}
              <div className="flex space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {fullGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-20 sm:w-24 aspect-video rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx 
                        ? 'border-[#F2621E] ring-2 ring-[#F2621E]/30 scale-102' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-[9px] text-white px-1 rounded font-mono">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BLUEPRINT / FLOOR PLAN (Zoomable, Specs) */}
          {activeMediaTab === 'blueprint' && hasFloorPlan && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-[#1E4FA8]" />
                    <span>Architectural Floor Blueprint & Layout</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Vastu-compliant dimensional layout showing carpet zones and balcony alignments.
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setBlueprintZoom(prev => Math.min(prev + 0.25, 2.5))}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#1E4FA8] shadow-2xs cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBlueprintZoom(prev => Math.max(prev - 0.25, 0.75))}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#1E4FA8] shadow-2xs cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBlueprintZoom(1)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#1E4FA8] shadow-2xs cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-600 px-2">
                    {Math.round(blueprintZoom * 100)}%
                  </span>
                </div>
              </div>

              {/* Blueprint Canvas Container */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center p-4 border border-slate-200">
                <div 
                  className="transition-transform duration-200 ease-out origin-center cursor-grab active:cursor-grabbing max-h-full max-w-full"
                  style={{ transform: `scale(${blueprintZoom})` }}
                >
                  <img
                    src={floorPlanImage}
                    alt="Floor plan blueprint"
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 shadow-xs border border-slate-200">
                  <span>Zoom / Drag to inspect room dimensions</span>
                </div>
              </div>

              {/* Room Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Living & Dining</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">18'0" × 12'6"</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Master Suite</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">14'0" × 11'0"</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Modular Kitchen</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">10'6" × 8'0"</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deck Balcony</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">11'0" × 5'0"</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO WALKTHROUGH */}
          {activeMediaTab === 'video' && hasVideo && (
            <div className="space-y-3">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                <iframe
                  src={videoEmbedUrl.includes('watch?v=') ? videoEmbedUrl.replace('watch?v=', 'embed/') : videoEmbedUrl}
                  title="Property Video Walkthrough"
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <p className="text-xs text-slate-500 text-center font-medium">
                Official high-definition walkthrough guided by Auricity property architects.
              </p>
            </div>
          )}

          {/* TAB 4: SHORTS / REEL PLAYER (9:16) */}
          {activeMediaTab === 'shorts' && hasShorts && (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-900">
                <iframe
                  src={shortsEmbedUrl.includes('watch?v=') ? shortsEmbedUrl.replace('watch?v=', 'embed/') : shortsEmbedUrl}
                  title="Shorts Reel"
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Vertical 60-second highlight reel showcasing finishes and view.
              </p>
            </div>
          )}
        </motion.div>

        {/* 4. TWO-COLUMN LAYOUT: SPECS & AMENITIES (LEFT) + INQUIRY & EMI (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT 2 COLUMNS: KEY DETAILS, AMENITIES, LOCATION MAP */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* KEY DETAILS GRID */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E2DAC6] shadow-sm space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Home className="w-5 h-5 text-[#1E4FA8]" />
                <h3 className="text-lg font-black text-slate-900">Key Property Specifications</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Configuration</span>
                  <span className="text-base font-black text-slate-900">
                    {'bhk' in item ? `${item.bhk} BHK` : ('configurations' in item ? (item as any).configurations?.join(', ') : '2, 3 BHK')}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Carpet Area</span>
                  <span className="text-base font-black text-slate-900">
                    {'carpetArea' in item ? `${(item as Property).carpetArea} Sq.Ft` : '950 - 1,450 Sq.Ft'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Possession Status</span>
                  <span className="text-base font-black text-emerald-700">
                    {'possessionStatus' in item ? (item as any).possessionStatus : ('possessionDate' in item ? (item as any).possessionDate : 'Ready to Move')}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Furnishing Status</span>
                  <span className="text-base font-black text-slate-900 capitalize">
                    {'furnishing' in item ? (item as any).furnishing?.replace('_', ' ') : 'Semi-Furnished'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Vastu & Facing</span>
                  <span className="text-base font-black text-slate-900">
                    {'facing' in item ? (item as any).facing : 'East Facing (100% Vastu)'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Car Parking</span>
                  <span className="text-base font-black text-slate-900">
                    {'parking' in item ? (item as any).parking : '1 Covered Car Slot'}
                  </span>
                </div>
              </div>

              {/* Description Paragraph */}
              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">About This Property</h4>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {item?.description || `Spectacular property situated in the heart of ${item?.locality || 'Chhatrapati Sambhajinagar'}. Designed with high-ceiling ventilation, cross-breeze airflow, premium vitrified tile flooring, and concealed electrical conduits. Just 5 minutes from educational institutes, multispeciality hospitals, and daily conveniences.`}
                </p>
              </div>
            </div>

            {/* FACILITIES & AMENITIES LIST (Icon Grid) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E2DAC6] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#F2621E]" />
                  <h3 className="text-lg font-black text-slate-900">Society Amenities & Facilities</h3>
                </div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% Verified Amenities
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { name: 'Clubhouse & Lounge', icon: Building2 },
                  { name: 'Rooftop Swimming Pool', icon: Waves },
                  { name: 'Fitness Gym & Yoga Deck', icon: Dumbbell },
                  { name: '24/7 CCTV & Security', icon: ShieldAlert },
                  { name: '100% Power Backup', icon: Zap },
                  { name: 'Landscaped Podium Park', icon: TreePine },
                  { name: 'Covered EV Charging', icon: Car },
                  { name: 'Vastu Compliant Layout', icon: Compass },
                  { name: 'High-Speed Elevators', icon: Layers },
                  { name: 'Rainwater Harvesting', icon: Sparkles },
                  { name: 'Intercom Connectivity', icon: PhoneCall },
                  { name: 'Fire Safety Equipment', icon: ShieldCheck }
                ].map((amenity, idx) => {
                  const Icon = amenity.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-2.5 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#1E4FA8] flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon className="w-4 h-4 text-[#1E4FA8]" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 leading-tight">
                        {amenity.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOCATION SECTION (Google Maps Embed + Landmark distances) */}
            <div className="space-y-4">
              <GoogleMapsEmbed
                address={fullAddress}
                coordinates={coordinates}
                title={`${title} - Location`}
                height="380px"
              />

              {/* Nearby Landmarks Distance Grid */}
              <div className="bg-white p-5 rounded-3xl border border-[#E2DAC6] shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Strategic Proximity to Key Sambhajinagar Hubs
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Prozone Mall</span>
                    <span className="font-extrabold text-[#1E4FA8]">1.8 km</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Chikalthana Airport</span>
                    <span className="font-extrabold text-[#1E4FA8]">3.5 km</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">MGM Hospital</span>
                    <span className="font-extrabold text-[#1E4FA8]">2.2 km</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Railway Station</span>
                    <span className="font-extrabold text-[#1E4FA8]">4.0 km</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Cambridge School</span>
                    <span className="font-extrabold text-[#1E4FA8]">1.2 km</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Samruddhi Mahamarg</span>
                    <span className="font-extrabold text-[#1E4FA8]">7.5 km</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INQUIRY FORM, WHATSAPP CTA, & EMI CALCULATOR */}
          <div className="space-y-6 lg:sticky lg:top-28">
            
            {/* Direct Contact & Visit Form */}
            <div className="bg-white p-6 rounded-3xl border border-[#E2DAC6] shadow-md space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Direct Response Guarantee
                </span>
                <h3 className="text-lg font-black text-slate-900">Inquire or Book Visit</h3>
                <p className="text-xs text-slate-500">Connect directly with the verified owner or developer representative.</p>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E4FA8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E4FA8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Site Visit Date</label>
                  <input
                    type="date"
                    value={inquiryDate}
                    onChange={(e) => setInquiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E4FA8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={2}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E4FA8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full py-3 rounded-2xl bg-[#1E4FA8] hover:bg-[#15397d] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>{submittingInquiry ? 'Submitting...' : 'Send Inquiry & Get Price Sheet'}</span>
                </button>
              </form>

              {/* Direct Call & WhatsApp Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href={`https://wa.me/918010506030?text=${encodeURIComponent(`Hi Auricity! I am interested in "${title}" located in ${item?.locality}. Please share more details and arrange a site visit.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>

                <a
                  href="tel:+918010506030"
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-[#1E4FA8]" />
                  <span>Call +91 8010506030</span>
                </a>
              </div>
            </div>

            {/* Interactive EMI Calculator Card */}
            <div className="bg-white p-5 rounded-3xl border border-[#E2DAC6] shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Calculator className="w-4 h-4 text-[#1E4FA8]" />
                <h4 className="text-sm font-black text-slate-900">Home Loan EMI Estimator</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Loan Amount</span>
                    <span className="text-[#1E4FA8]">{formatPriceINR(loanAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={listingPrice * 0.9}
                    step={100000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-[#1E4FA8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Tenure</span>
                    <span className="text-slate-800">{loanTenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full accent-[#1E4FA8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Interest Rate</span>
                    <span className="text-slate-800">{interestRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={7.5}
                    max={12.0}
                    step={0.1}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-[#1E4FA8] cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Monthly EMI</span>
                  <span className="text-xl font-black text-[#1E4FA8]">
                    ₹ {monthlyEMI.toLocaleString('en-IN')} / mo
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 5. "SIMILAR PROPERTIES" / "OTHER PROJECTS" ROW */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isProject ? 'Explore Similar Landmark Projects' : 'Similar Properties in Sambhajinagar'}
              </h3>
              <p className="text-xs text-slate-500">Handpicked alternatives offering comparable amenities and price points.</p>
            </div>
            <button
              onClick={() => setActiveView(isProject ? 'projects' : 'properties')}
              className="text-xs font-bold text-[#1E4FA8] hover:underline"
            >
              View All &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarItems.map((simItem) => {
              const simTitle = (simItem as any).title || (simItem as any).name;
              const simPrice = (simItem as any).priceDisplay || (simItem as any).priceRange || formatPriceINR((simItem as any).price || 5000000);
              const simImg = simItem.images && simItem.images[0] ? simItem.images[0] : DEFAULT_PROPERTY_IMAGE;

              return (
                <div
                  key={simItem.id}
                  onClick={() => isProject ? navigateToProjectDetail(simItem.id) : navigateToPropertyDetail(simItem.id)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="aspect-video w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={simImg}
                      alt={simTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold">
                      {simItem.locality}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-[#1E4FA8] transition-colors">
                      {simTitle}
                    </h4>
                    <p className="text-xs font-black text-[#1E4FA8]">
                      {simPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 6. FULLSCREEN GALLERY MODAL */}
      {isFullscreenGallery && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in">
          <div className="w-full max-w-7xl flex items-center justify-between text-white py-2">
            <span className="text-xs font-mono font-bold">
              Photo {activePhotoIdx + 1} of {fullGallery.length}
            </span>
            <button
              onClick={() => setIsFullscreenGallery(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-auto">
            <img
              src={fullGallery[activePhotoIdx]}
              alt=""
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setActivePhotoIdx(prev => (prev === 0 ? fullGallery.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActivePhotoIdx(prev => (prev === fullGallery.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white shadow-xl cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full max-w-3xl flex space-x-2 overflow-x-auto py-2 no-scrollbar">
            {fullGallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`w-14 aspect-video rounded-md overflow-hidden shrink-0 border transition-all ${
                  activePhotoIdx === idx ? 'border-[#F2621E] scale-105' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. SCHEDULE SITE VISIT POPUP MODAL */}
      {visitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#F2621E]" />
                <h3 className="text-base font-black text-slate-900">Schedule In-Person Site Visit</h3>
              </div>
              <button
                onClick={() => setVisitModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Pick your convenient date. Our representative will receive you at <strong className="text-slate-900">{title}</strong> with vehicle parking assistance.
            </p>

            <form onSubmit={handleInquirySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Anand Deshmukh"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+91 9XXXXXXXXX"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={inquiryDate}
                  onChange={(e) => setInquiryDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingInquiry}
                className="w-full py-3 rounded-2xl bg-[#F2621E] hover:bg-[#d95214] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {submittingInquiry ? 'Confirming...' : 'Confirm Free Site Visit'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
