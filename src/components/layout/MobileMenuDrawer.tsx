import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuricityLogo } from '../common/AuricityLogo';
import { 
  X, 
  ChevronDown, 
  ChevronRight, 
  PhoneCall, 
  MessageSquare, 
  Home, 
  Info, 
  Building2, 
  Briefcase, 
  Gift, 
  Wrench, 
  Award, 
  Mail, 
  LandPlot, 
  Factory, 
  ShieldCheck, 
  Percent, 
  Sparkles,
  ExternalLink,
  Lock,
  User,
  ArrowRight,
  Share2,
  LogIn,
  Camera
} from 'lucide-react';
import { NavMenuItem } from '../../types';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEMIModal?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenEMIModal
}) => {
  const { 
    activeView, 
    setActiveView, 
    setSearchParams, 
    navigationConfig,
    setShowPinModal,
    showToast
  } = useApp();

  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(prev => prev === id ? null : id);
  };

  const handleNavigate = (viewOrUrl: string, filterParam?: string) => {
    if (String(viewOrUrl).toLowerCase().replace(/[^a-z]/g,'') === 'contactus' || String(viewOrUrl).toLowerCase() === '/contact' || String(viewOrUrl).toLowerCase() === 'contact') viewOrUrl = 'contact';
    if (viewOrUrl.startsWith('http')) {
      window.open(viewOrUrl, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }

    if (filterParam) {
      if (filterParam === 'Residential') {
        setSearchParams(prev => ({ ...prev, propertyType: 'Flat / Apartment' }));
      } else if (filterParam === 'Commercial') {
        setSearchParams(prev => ({ ...prev, propertyType: 'Commercial Shop' }));
      } else if (filterParam === 'Industrial') {
        setSearchParams(prev => ({ ...prev, propertyType: 'Industrial Land' }));
      } else if (filterParam === 'Plots') {
        setSearchParams(prev => ({ ...prev, propertyType: 'Residential Plot' }));
      }
    }

    if (viewOrUrl === 'loan' || viewOrUrl === 'emi') {
      onClose();
      if (onOpenEMIModal) {
        onOpenEMIModal();
      } else {
        setActiveView('services');
      }
      return;
    }

    setActiveView(viewOrUrl);
    onClose();
  };

  const navItems: NavMenuItem[] = navigationConfig?.navItems && navigationConfig.navItems.length > 0 
    ? navigationConfig.navItems.filter(item => item.published !== false).map(item => /contact\s*us/i.test(item.label) ? { ...item, viewOrUrl: 'contact' } : item)
    : [
        { id: 'nav-home', label: 'Home', viewOrUrl: 'home', order: 1, published: true },
        { id: 'nav-about', label: 'About Us', viewOrUrl: 'about', order: 2, published: true },
        { 
          id: 'nav-projects', 
          label: 'Our Projects', 
          viewOrUrl: 'projects', 
          isDropdown: true, 
          order: 3, 
          published: true,
          subItems: [
            { id: 'sub-proj-all', label: 'All Projects', viewOrUrl: 'projects' },
            { id: 'sub-proj-res', label: 'Residential', viewOrUrl: 'projects', filterParam: 'Residential' },
            { id: 'sub-proj-comm', label: 'Commercial', viewOrUrl: 'projects', filterParam: 'Commercial' },
            { id: 'sub-proj-ind', label: 'Industrial', viewOrUrl: 'projects', filterParam: 'Industrial' },
            { id: 'sub-proj-plot', label: 'Plot-Land', viewOrUrl: 'projects', filterParam: 'Plots' }
          ]
        },
        { 
          id: 'nav-props', 
          label: 'Properties', 
          viewOrUrl: 'properties', 
          isDropdown: true, 
          order: 4, 
          published: true,
          subItems: [
            { id: 'sub-prop-all', label: 'All Properties', viewOrUrl: 'properties' },
            { id: 'sub-prop-res', label: 'Residential', viewOrUrl: 'properties', filterParam: 'Residential' },
            { id: 'sub-prop-comm', label: 'Commercial', viewOrUrl: 'commercial', filterParam: 'Commercial' },
            { id: 'sub-prop-ind', label: 'Industrial', viewOrUrl: 'properties', filterParam: 'Industrial' },
            { id: 'sub-prop-plot', label: 'Plot-Land', viewOrUrl: 'plots', filterParam: 'Plots' }
          ]
        },
        { id: 'nav-offers', label: 'Offers', viewOrUrl: 'offers', order: 5, published: true, badge: 'Festive' },
        { id: 'nav-services', label: 'Services', viewOrUrl: 'services', order: 6, published: true },
        { id: 'nav-realtors', label: 'Realtors', viewOrUrl: 'realtors', order: 7, published: true },
        { id: 'nav-contact', label: 'Contact Us', viewOrUrl: 'contact', order: 8, published: true }
      ];

  const getIconForNav = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return Home;
    if (l.includes('about')) return Info;
    if (l.includes('project')) return Building2;
    if (l.includes('propert')) return Home;
    if (l.includes('offer')) return Gift;
    if (l.includes('service')) return Wrench;
    if (l.includes('realtor')) return Award;
    if (l.includes('contact')) return Mail;
    return Sparkles;
  };

  const getSubIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('all')) return Building2;
    if (l.includes('residen')) return Home;
    if (l.includes('commerc')) return Briefcase;
    if (l.includes('indust')) return Factory;
    if (l.includes('plot') || l.includes('land')) return LandPlot;
    return ChevronRight;
  };

  const loanText = navigationConfig?.loanButtonText || 'Loan';
  const loanLink = navigationConfig?.loanButtonLink || 'loan';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-blue-50/30 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AuricityLogo 
              variant="compact" 
              size="sm" 
              onClick={() => { setActiveView('home'); onClose(); }} 
            />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Top Announcement Pill for Mobile */}
        <div className="px-4 py-3 bg-[#1E4FA8] text-white flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="truncate text-white/90">
            {navigationConfig?.topBarText || 'Are You A Property Owner? List Your Property'}
          </span>
          <button
            onClick={() => {
              setActiveView('post-property');
              onClose();
            }}
            className="bg-[#F2621E] hover:bg-[#d95214] text-white text-[11px] font-black px-3 py-1 rounded-full shrink-0 shadow-xs cursor-pointer"
          >
            {navigationConfig?.topAnnouncementPillText || 'FREE'}
          </button>
        </div>

        {/* Broker CTA */}
        <div className="px-4 pt-4">
          <button
            onClick={() => handleNavigate('broker-landing')}
            className="w-full rounded-2xl border border-[#D8B15A] bg-[#FFF9EA] px-4 py-3 text-left text-sm font-black text-[#8A651D] shadow-sm"
          >
            <span className="flex items-center justify-between"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Become a Broker</span><ArrowRight className="h-4 w-4" /></span>
            <span className="mt-1 block pl-6 text-[11px] font-semibold text-[#8A651D]/75">Create your professional Auricity profile</span>
          </button>
        </div>

        {/* Service Provider CTA */}
        <div className="px-4 pt-3">
          <button onClick={() => handleNavigate('service-provider')} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-black text-[#214E9B]">
            <span className="flex items-center justify-between"><span className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Join as Service Partner</span><ArrowRight className="h-4 w-4" /></span>
            <span className="mt-1 block pl-6 text-[11px] font-semibold text-[#214E9B]/70">Register your professional property service</span>
          </button>
        </div>

        {/* Account actions */}
        <div className="grid grid-cols-2 gap-2 px-4 pt-3">
          <button onClick={() => handleNavigate('register')} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-[#214E9B] shadow-sm">Register</button>
          <button onClick={() => handleNavigate('signin')} className="rounded-2xl bg-[#102B59] px-3 py-3 text-sm font-black text-white shadow-sm">Sign In</button>
        </div>

        {/* Main Nav Items List */}
        <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = getIconForNav(item.label);
            const isDropdown = item.isDropdown && item.subItems && item.subItems.length > 0;
            const isAccordionOpen = expandedAccordion === item.id;
            const isItemActive = activeView === item.viewOrUrl;

            if (isDropdown) {
              return (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-bold text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-[#1E4FA8] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-slate-900 font-bold">{item.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180 text-[#F2621E]' : ''}`} />
                  </button>

                  {/* Sub-items accordion */}
                  {isAccordionOpen && (
                    <div className="px-3 pb-3 pt-1 space-y-1 bg-white border-t border-slate-100">
                      {item.subItems?.map(sub => {
                        const SubIcon = getSubIcon(sub.label);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavigate(sub.viewOrUrl, sub.filterParam)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1E4FA8] hover:bg-blue-50/70 flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="flex items-center space-x-2.5">
                              <SubIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F2621E]" />
                              <span>{sub.label}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#1E4FA8] transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.viewOrUrl)}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  isItemActive 
                    ? 'bg-[#1E4FA8] text-white shadow-xs' 
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isItemActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#1E4FA8]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Affiliate Partner Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Affiliate Partner Portal</span>
                    <span className="text-[10px] text-amber-700 font-bold block">कमवा आणि रेफर करा · Earn Rewards</span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Creator
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  onClick={() => handleNavigate('affiliate-login')}
                  className="px-3 py-2 rounded-xl bg-[#102B59] hover:bg-[#1a4185] text-white text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Affiliate Login</span>
                </button>
                <button
                  onClick={() => handleNavigate('affiliate-landing')}
                  className="px-3 py-2 rounded-xl bg-white border border-amber-300/80 text-amber-900 hover:bg-amber-100/50 text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <span>Program Details</span>
                </button>
              </div>
              <button
                onClick={() => handleNavigate('spot-and-earn')}
                className="mt-2 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📸 Spot a Property / रिकामी जागा कळवा (Earn Bounty)</span>
              </button>
            </div>
          </div>

          {/* Quick Portal Switch / Super Admin access */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                setShowPinModal(true);
              }}
              className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Super Admin Panel (PIN)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">9999</span>
            </button>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50 space-y-3 sticky bottom-0 z-20">
          
          {/* Brand Orange Loan CTA Button */}
          <button
            id="mobile-menu-loan-cta"
            onClick={() => handleNavigate(loanLink)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#F2621E] hover:bg-[#d95214] text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <Percent className="w-4 h-4 text-amber-200" />
            <span>{loanText} Assistance & EMI Calculator</span>
          </button>

          {/* Support Quick Contacts */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <a
              href={`tel:${navigationConfig?.headerPhoneText || '+918010506030'}`}
              className="px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 hover:bg-slate-100 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#1E4FA8]" />
              <span>Call Helpline</span>
            </a>
            <a
              href={navigationConfig?.joinAuricityLink || 'https://wa.me/918010506030'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
