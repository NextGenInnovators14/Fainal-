import React from 'react';
import { useApp } from '../../context/AppContext';
import { AuricityLogo } from '../common/AuricityLogo';
import {
  MapPin,
  PhoneCall,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageSquare,
  ArrowUp,
  ShieldCheck,
} from 'lucide-react';

interface FooterProps {
  onOpenIconModal?: () => void;
}

/**
 * Classic Compact Footer:
 * Clean, elegant layout focusing on brand, essential navigation, contact, and legal copyright.
 */
export const Footer: React.FC<FooterProps> = () => {
  const { setActiveView, navigationConfig } = useApp();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const corporateLinks = (navigationConfig?.footerCorporateLinks || [
    { id: 'corp-1', label: 'About Us', viewOrUrl: 'about' },
    { id: 'corp-2', label: 'Home', viewOrUrl: 'home' },
    { id: 'corp-3', label: 'Projects', viewOrUrl: 'projects' },
    { id: 'corp-4', label: 'Blog & News', viewOrUrl: 'blogs' },
    { id: 'corp-5', label: 'Contact Us', viewOrUrl: 'contact' },
    { id: 'corp-6', label: 'Privacy & Terms', viewOrUrl: 'legal' },
    { id: 'corp-7', label: 'Become a Broker', viewOrUrl: 'broker-landing' },
    { id: 'corp-8', label: 'Service Partner', viewOrUrl: 'service-provider-register' },
    { id: 'corp-9', label: 'Affiliate Program', viewOrUrl: 'affiliate-landing' },
    { id: 'corp-10', label: 'Admin Portal', viewOrUrl: 'admin-hub' },
  ]).map(link => /contact\s*us/i.test(link.label) ? { ...link, viewOrUrl: 'contact' } : link);

  const handleLinkClick = (viewOrUrl: string) => {
    const value = String(viewOrUrl || '');
    const normalized = value.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized === 'contactus' || normalized === 'contact') {
      setActiveView('contact');
    } else if (value.startsWith('http')) {
      window.open(value, '_blank', 'noopener,noreferrer');
    } else {
      setActiveView(value);
    }
    scrollToTop();
  };

  const socialLinks = [
    ['Facebook', navigationConfig?.socialLinks?.facebook || 'https://facebook.com/auricity', Facebook],
    ['Instagram', navigationConfig?.socialLinks?.instagram || 'https://instagram.com/auricity.official', Instagram],
    ['YouTube', navigationConfig?.socialLinks?.youtube || 'https://youtube.com/@auricity', Youtube],
    ['LinkedIn', navigationConfig?.socialLinks?.linkedin || 'https://linkedin.com/company/auricity', Linkedin],
    ['WhatsApp', navigationConfig?.joinAuricityLink || 'https://wa.me/918010506030', MessageSquare],
  ] as const;

  return (
    <footer className="bg-[#0B132B] text-slate-300 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Main Classic 3-Column Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr] gap-6 lg:gap-10">
          {/* Brand & Brief Tagline */}
          <div className="space-y-3">
            <AuricityLogo variant="compact" theme="dark" size="md" />
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              {navigationConfig?.footerTagline || "Chhatrapati Sambhajinagar's direct real estate & verified property technology ecosystem with 0% Brokerage."}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 font-bold text-amber-400">0% Brokerage</span>
              <span>•</span>
              <span>MahaRERA: A51500038921</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">Quick Links</h4>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {corporateLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.viewOrUrl)}
                  className="truncate text-left text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">Contact Desk</h4>
            <div className="mt-2.5 space-y-2 text-xs">
              <a className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors" href={`tel:${navigationConfig?.footerPhone || '+918010506030'}`}>
                <PhoneCall className="h-3.5 w-3.5 shrink-0 text-[#F2621E]" />
                <span>{navigationConfig?.footerPhone || '+91 8010506030'}</span>
              </a>
              <a className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors truncate" href={`mailto:${navigationConfig?.footerEmail || 'support@auricity.com'}`}>
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#F2621E]" />
                <span className="truncate">{navigationConfig?.footerEmail || 'support@auricity.com'}</span>
              </a>
              <div className="flex items-start gap-2 text-slate-400 leading-snug">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F2621E] mt-0.5" />
                <span className="line-clamp-2">{navigationConfig?.companyAddress || navigationConfig?.footerAddress || 'CIDCO Cannaught Place & Jalna Road, Chhatrapati Sambhajinagar, MH 431005'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar: Social + Back to Top + Copyright */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400">Follow Us:</span>
            <div className="flex items-center gap-1.5">
              {socialLinks.map(([label, href, Icon]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>{navigationConfig?.copyrightText || `© ${new Date().getFullYear()} Auricity. All Rights Reserved.`}</span>
            <button
              onClick={() => { setActiveView('admin-hub'); scrollToTop(); }}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
              title="Open Super Admin Hub"
            >
              <ShieldCheck className="h-3 w-3" /> Admin
            </button>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back to top <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
