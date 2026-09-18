import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchStore, pushStore } from '../utils/apiStore';
import { 
  Property, 
  Project,
  Lead, 
  AppSettings, 
  UserProfile, 
  PropertyFilterParams,
  CmsPageData,
  MediaItem,
  BannerAdItem,
  BlogPost,
  TrainingBlog,
  OfferItem,
  OfferCategory,
  OfferClaim,
  OfferAnalyticsEvent,
  OffersPageConfig,
  NavigationConfig,
  Realtor,
  ClubCardsConfig,
  KnowledgeHubConfig,
  BrokerAccessRequest,
  BrokerDirectMessage,
  ServiceProviderRegistration,
  ContactMessage, ContactMessageStatus, ContactPageConfig
} from '../types';
import { 
  INITIAL_PROPERTIES, 
  INITIAL_PROJECTS,
  INITIAL_OFFERS,
  INITIAL_TRAINING_BLOGS,
  INITIAL_REALTORS,
  INITIAL_CLUB_CARDS_CONFIG,
  INITIAL_KNOWLEDGE_HUB_CONFIG,
  INITIAL_BROKER_ACCESS_REQUESTS,
  INITIAL_BROKER_MESSAGES,
  SAMBHAJINAGAR_LOCALITIES as LOCALITIES 
} from '../data/mockData';
import { COMPREHENSIVE_PROPERTIES } from '../data/propertiesData';
import { normalizeProperty } from '../utils/propertyUtils';
import { 
  INITIAL_CMS_PAGES, 
  INITIAL_MEDIA_LIBRARY, 
  INITIAL_BANNER_ADS, 
  INITIAL_CMS_BLOGS, 
  INITIAL_NAVIGATION_CONFIG 
} from '../data/cmsInitialData';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ServiceBookingRecord {
  id?: string;
  serviceId: string;
  serviceTitle: string;
  userName: string;
  userPhone: string;
  locality: string;
  date: string;
  timeSlot?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: string;
}

interface AppContextType {
  activeView: string;
  setActiveView: (view: string) => void;
  activeRole: 'public' | 'broker' | 'admin';
  setActiveRole: (role: 'public' | 'broker' | 'admin') => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;
  verifyAdminPin: (pin: string) => boolean;

  // Selected Details Navigation
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedServiceId: string | null;
  selectedOfferId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  navigateToPropertyDetail: (id: string) => void;
  navigateToProjectDetail: (id: string) => void;
  navigateToServiceDetail: (id: string) => void;
  navigateToOfferDetail: (id: string) => void;

  // Custom Service Details (CMS)
  customServiceDetails: Record<string, any>;
  updateCustomServiceDetail: (categoryId: string, updates: any) => void;

  // Search & Filters
  searchParams: PropertyFilterParams;
  setSearchParams: React.Dispatch<React.SetStateAction<PropertyFilterParams>>;
  localitiesList: string[];

  // Properties Store
  allProperties: Property[];
  addProperty: (prop: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Projects Store
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Offers Store
  offers: OfferItem[];
  addOffer: (offer: OfferItem) => void;
  updateOffer: (id: string, updates: Partial<OfferItem>) => void;
  deleteOffer: (id: string) => void;
  offerCategories: OfferCategory[];
  addOfferCategory: (category: OfferCategory) => void;
  updateOfferCategory: (id: string, updates: Partial<OfferCategory>) => void;
  deleteOfferCategory: (id: string) => void;
  offersPageConfig: OffersPageConfig;
  updateOffersPageConfig: (updates: Partial<OffersPageConfig>) => void;
  offerClaims: OfferClaim[];
  addOfferClaim: (claim: Omit<OfferClaim,'id'|'createdAt'|'status'>) => void;
  updateOfferClaim: (id: string, updates: Partial<OfferClaim>) => void;
  offerAnalytics: OfferAnalyticsEvent[];
  recordOfferAnalytics: (offerId: string, eventType: OfferAnalyticsEvent['eventType']) => void;

  // Contact CMS & messages
  contactPageConfig: ContactPageConfig;
  updateContactPageConfig: (updates: Partial<ContactPageConfig>) => void;
  contactMessages: ContactMessage[];
  submitContactMessage: (message: Omit<ContactMessage, 'id'|'status'|'createdAt'|'updatedAt'>) => Promise<boolean>;
  updateContactMessage: (id: string, updates: Partial<ContactMessage>) => void;
  deleteContactMessage: (id: string) => void;

  // Verified Realtors Store
  realtors: Realtor[];
  addRealtor: (realtor: Realtor) => void;
  updateRealtor: (id: string, updates: Partial<Realtor>) => void;
  deleteRealtor: (id: string) => void;

  // Club Cards Config
  clubCardsConfig: ClubCardsConfig;
  updateClubCardsConfig: (updates: Partial<ClubCardsConfig>) => void;

  // CMS: Page Content
  cmsPages: Record<string, CmsPageData>;
  addCmsPage: (page: CmsPageData) => void;
  deleteCmsPage: (pageId: string) => void;
  updateCmsPage: (pageId: string, updates: Partial<CmsPageData>) => void;
  updateCmsSection: (pageId: string, sectionId: string, sectionUpdates: any) => void;

  // Visual Home Page Builder
  homePageConfig: HomePageConfig;
  updateHomePageConfig: (updates: Partial<HomePageConfig>) => void;
  updateHomeSection: (sectionId: string, updates: Partial<HomePageSectionConfig>) => void;
  resetHomePageConfig: () => void;

  // CMS: Media Library
  mediaLibrary: MediaItem[];
  addMediaItem: (item: MediaItem) => void;
  addMediaItemsBulk: (items: MediaItem[]) => void;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => void;

  // CMS: Banner Ads Carousel
  bannerAds: BannerAdItem[];
  addBannerAd: (ad: BannerAdItem) => void;
  updateBannerAd: (id: string, updates: Partial<BannerAdItem>) => void;
  deleteBannerAd: (id: string) => void;
  reorderBannerAds: (ads: BannerAdItem[]) => void;

  // CMS: Blogs & News (Public & Broker Academy)
  cmsBlogs: BlogPost[];
  addCmsBlog: (blog: BlogPost) => void;
  updateCmsBlog: (id: string, updates: Partial<BlogPost>) => void;
  deleteCmsBlog: (id: string) => void;

  trainingBlogs: TrainingBlog[];
  addTrainingBlog: (tb: TrainingBlog) => void;
  updateTrainingBlog: (id: string, updates: Partial<TrainingBlog>) => void;
  deleteTrainingBlog: (id: string) => void;

  // CMS: Knowledge Hub Section Config
  knowledgeHubConfig: KnowledgeHubConfig;
  updateKnowledgeHubConfig: (updates: Partial<KnowledgeHubConfig>) => void;

  // Broker Content Access Requests Queue
  brokerAccessRequests: BrokerAccessRequest[];
  requestBrokerAccess: (brokerInfo: { brokerId: string; brokerName: string; agencyName?: string; phone: string; email: string; reraNumber?: string }) => void;
  updateBrokerAccessRequestStatus: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
  deleteBrokerAccessRequest: (requestId: string) => void;
  getBrokerAccessStatus: (brokerId: string) => 'not_requested' | 'pending' | 'approved' | 'rejected';

  // Broker Direct Messages / Support Desk
  brokerMessages: BrokerDirectMessage[];
  sendBrokerMessage: (msg: { brokerId: string; brokerName: string; senderRole: 'broker' | 'admin'; message: string }) => void;

  // CMS: Navigation & Links
  navigationConfig: NavigationConfig;
  updateNavigationConfig: (updates: Partial<NavigationConfig>) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;

  // Leads & CRM
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  deleteLead: (leadId: string) => void;

  // Service Provider Registrations
  serviceProviderRegistrations: ServiceProviderRegistration[];
  addServiceProviderRegistration: (registration: ServiceProviderRegistration) => void;
  updateServiceProviderRegistration: (id: string, updates: Partial<ServiceProviderRegistration>) => void;
  deleteServiceProviderRegistration: (id: string) => void;

  // Service Bookings
  serviceBookings: ServiceBookingRecord[];
  addServiceBooking: (booking: ServiceBookingRecord) => void;
  updateServiceBookingStatus: (id: string, status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled', notes?: string) => void;
  deleteServiceBooking: (id: string) => void;

  // App Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  adminPin: '9999',
  supportPhone: '+91 8010506030',
  supportEmail: 'support@auricity.com',
  officeAddress: 'CIDCO Cannaught Place & Jalna Road, Chhatrapati Sambhajinagar, MH 431005',
  zeroBrokerageBadgeEnabled: true,
  requirePhoneForLeads: true,
  brandLogoUrl: '',
  faviconUrl: ''
};

export interface HomePageSectionConfig {
  id: string;
  label: string;
  visible: boolean;
  layout: 'auto' | 'full' | 'compact' | 'split' | 'grid' | 'carousel';
  background: string;
  spacing: 'tight' | 'normal' | 'airy';
  autoScroll: boolean;
  autoScrollSpeed: number;
  headingOverride?: string;
  subheadingOverride?: string;
  imageUrl?: string;
}

export interface HomePageConfig {
  sections: HomePageSectionConfig[];
  autoScrollOffset: number;
  smoothScroll: boolean;
  scrollDuration: number;
  showEditorHints: boolean;
  brandLogoUrl?: string;
  faviconUrl?: string;
}

const DEFAULT_HOME_SECTION_DEFINITIONS: Array<[string, string]> = [
  ['hero','Hero & Search'], ['localities','Top Localities'], ['cta','Quick Action Cards'],
  ['services','Services'], ['bannerAds','Banner Ads'], ['featuredProjects','Featured Projects'],
  ['projects','Projects in Sambhajinagar'], ['featuredProperties','Featured Properties'], ['saleProperties','Properties on Sale'],
  ['loanBanner','Loan Banner'], ['rentProperties','Properties on Rent'],
  ['realtors','Verified Realtors'], ['clubs','Realtor & Affiliate Clubs'],
  ['testimonials','Home Buyers'],
  ['blogs','Latest Blogs & Market Insights'],
  ['knowledgeHub','Knowledge Hub'],
  ['whyChoose','Why Choose Auricity']
];

export const DEFAULT_HOME_PAGE_CONFIG: HomePageConfig = {
  sections: DEFAULT_HOME_SECTION_DEFINITIONS.map(([id,label]) => ({
    id, label, visible: !['whyChoose'].includes(id),
    layout: (['services','localities','featuredProjects','featuredProperties','rentProperties','realtors','testimonials','blogs','knowledgeHub'].includes(id) ? 'carousel' : 'auto'),
    background: 'default', spacing: 'normal',
    autoScroll: false,
    autoScrollSpeed: 1,
  })),
  autoScrollOffset: 80, smoothScroll: true, scrollDuration: 450, showEditorHints: true,
  brandLogoUrl: '/auricity-brand-logo.png',
  faviconUrl: '/auricity-logo-mark.png'
};

export const normalizeHomePageConfig = (parsed: Partial<HomePageConfig> | null | undefined): HomePageConfig => {
  const incoming = parsed && Array.isArray(parsed.sections) ? parsed.sections : [];
  const byId = new Map(incoming.map(section => [section.id, section]));
  const merged = DEFAULT_HOME_PAGE_CONFIG.sections.map(def => {
    const found = byId.get(def.id);
    if (!found) return def;
    if (def.id === 'blogs') {
      return { ...def, ...found, visible: found.visible !== undefined ? found.visible : true };
    }
    return { ...def, ...found };
  });
  const custom = incoming.filter(section => !DEFAULT_HOME_PAGE_CONFIG.sections.some(def => def.id === section.id));
  return { ...DEFAULT_HOME_PAGE_CONFIG, ...(parsed || {}), sections: [...merged, ...custom] };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const viewFromPath = (path: string): string => {
    if (path.startsWith('/properties/')) return 'property-detail';
    if (path.startsWith('/projects/')) return 'project-detail';
    if (path.startsWith('/services/')) return 'service-detail';
    if (path.startsWith('/offers/')) return 'offer-detail';
    const known: Record<string, string> = {
      '/': 'home', '/home': 'home', '/properties': 'properties', '/projects': 'projects',
      '/commercial': 'commercial', '/plots': 'plots', '/rentals': 'rentals', '/pgs': 'pgs',
      '/about': 'about', '/contact': 'contact', '/services': 'services', '/offers': 'offers',
      '/blogs': 'blogs', '/legal': 'legal', '/valuator': 'valuator', '/post-property': 'post-property',
      '/realtors': 'realtors', '/knowledge-hub': 'knowledge-hub', '/broker-knowledge-hub': 'broker-knowledge-hub',
      '/admin': 'admin-hub', '/admin-hub': 'admin-hub', '/broker': 'broker-hub', '/broker-hub': 'broker-hub', '/brokers': 'broker-landing', '/broker-register': 'broker-register', '/broker-status': 'broker-status', '/broker-dashboard': 'broker-dashboard', '/admin/brokers': 'broker-admin', '/affiliate': 'affiliate-landing', '/affiliate-register': 'affiliate-register', '/service-providers': 'service-provider', '/service-provider': 'service-provider', '/service-provider-register': 'service-provider-register', '/service-provider-status': 'service-provider-status', '/admin/service-providers': 'service-provider-admin', '/affiliate-status': 'affiliate-status', '/affiliate-dashboard': 'affiliate-dashboard', '/admin/affiliates': 'affiliate-admin', '/register': 'register', '/signin': 'signin'
    };
    return known[path] || 'home';
  };

  const pathForView = (view: string): string => {
    const known: Record<string, string> = {
      home: '/', properties: '/properties', projects: '/projects', commercial: '/commercial', plots: '/plots',
      rentals: '/rentals', pgs: '/pgs', about: '/about', contact: '/contact', services: '/services',
      offers: '/offers', blogs: '/blogs', legal: '/legal', valuator: '/valuator', 'post-property': '/post-property',
      realtors: '/realtors', 'knowledge-hub': '/knowledge-hub', 'broker-knowledge-hub': '/broker-knowledge-hub',
      'admin-hub': '/admin', 'broker-hub': '/broker', 'broker-landing': '/brokers', 'broker-register': '/broker-register', 'broker-status': '/broker-status', 'broker-dashboard': '/broker-dashboard', 'broker-admin': '/admin/brokers', 'affiliate-landing': '/affiliate', 'affiliate-register': '/affiliate-register', 'affiliate-status': '/affiliate-status', 'affiliate-dashboard': '/affiliate-dashboard', 'affiliate-admin': '/admin/affiliates', register: '/register', signin: '/signin', 'service-provider': '/service-providers', 'service-provider-register': '/service-provider-register', 'service-provider-status': '/service-provider-status', 'service-provider-admin': '/admin/service-providers'
    };
    if (view.startsWith('offer-detail:')) return `/offers/${encodeURIComponent(view.slice('offer-detail:'.length))}`;
    return known[view] || `/${view}`;
  };

  const [activeView, setActiveViewState] = useState<string>(() => viewFromPath(window.location.pathname));

  // Central SPA navigation: every in-app navigation gets a browser-history entry.
  // Back/forward therefore returns to the previous screen instead of leaving the site.
  const setActiveView = (view: string) => {
    setActiveViewState(view);
    if (view.startsWith('offer-detail:')) setSelectedOfferId(view.slice('offer-detail:'.length));
    else if (view !== 'offer-detail') setSelectedOfferId(null);
    const nextPath = pathForView(view);
    if (window.location.pathname !== nextPath) {
      try { window.history.pushState({ type: 'view', view }, '', nextPath); } catch {}
    }
  };
  const [activeRole, setActiveRole] = useState<'public' | 'broker' | 'admin'>('public');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('auricity_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Selected Detail Page States (Real separate pages)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(() => { const m=window.location.pathname.match(/^\/offers\/(.+)$/); return m ? decodeURIComponent(m[1]) : null; });

  // Custom Service Details (CMS overrides)
  const [customServiceDetails, setCustomServiceDetails] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('auricity_custom_services');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchParams, setSearchParams] = useState<PropertyFilterParams>({});
  const [localitiesList] = useState<string[]>(LOCALITIES);

  // Persistence with localStorage fallback
  const [allProperties, setAllProperties] = useState<Property[]>(() => {
    const seed = [...COMPREHENSIVE_PROPERTIES, ...INITIAL_PROPERTIES].map(p => normalizeProperty(p as any));
    const dedupe = (items: Property[]) => Array.from(new Map(items.map(p => [p.id, p])).values());
    try {
      const saved = localStorage.getItem('auricity_properties');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupe(parsed.map(p => normalizeProperty(p)));
      }
    } catch {}
    return dedupe(seed);
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missing = INITIAL_PROJECTS.filter(p => !existingIds.has(p.id));
          return [...parsed, ...missing];
        }
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [offers, setOffers] = useState<OfferItem[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_offers');
      return saved ? JSON.parse(saved) : INITIAL_OFFERS;
    } catch {
      return INITIAL_OFFERS;
    }
  });

  const [offerCategories, setOfferCategories] = useState<OfferCategory[]>(() => {
    try { const saved=localStorage.getItem('auricity_offer_categories'); return saved?JSON.parse(saved):[
      {id:'property',name:'Property',slug:'property',displayOrder:1,active:true},
      {id:'home-services',name:'Home Services',slug:'home-services',displayOrder:2,active:true},
      {id:'interior',name:'Interior',slug:'interior',displayOrder:3,active:true},
      {id:'construction',name:'Construction',slug:'construction',displayOrder:4,active:true},
      {id:'moving',name:'Moving',slug:'moving',displayOrder:5,active:true},
      {id:'legal',name:'Legal / Documentation',slug:'legal-documentation',displayOrder:6,active:true},
      {id:'finance',name:'Finance',slug:'finance',displayOrder:7,active:true},
      {id:'other',name:'Other',slug:'other',displayOrder:8,active:true}
    ]; } catch { return []; }
  });
  const [offersPageConfig,setOffersPageConfig]=useState<OffersPageConfig>(()=>{
    try { const saved=localStorage.getItem('auricity_offers_page_config'); return saved?JSON.parse(saved):{heroTitle:'Exclusive Offers',heroSubtitle:'Discover active offers and opportunities from Auricity and its partners.',featuredTitle:'Featured Offers',featuredLimit:4,listTitle:'Explore Offers',sections:[{id:'featured',title:'Featured Offers',visible:true,displayOrder:1},{id:'listing',title:'Explore Offers',visible:true,displayOrder:2}]}; } catch { return {heroTitle:'Exclusive Offers',heroSubtitle:'Discover active offers and opportunities from Auricity and its partners.',featuredTitle:'Featured Offers',featuredLimit:4,listTitle:'Explore Offers',sections:[]}; }
  });
  const [offerClaims,setOfferClaims]=useState<OfferClaim[]>(()=>{try{const x=localStorage.getItem('auricity_offer_claims');return x?JSON.parse(x):[]}catch{return[]}});
  const [offerAnalytics,setOfferAnalytics]=useState<OfferAnalyticsEvent[]>(()=>{try{const x=localStorage.getItem('auricity_offer_analytics');return x?JSON.parse(x):[]}catch{return[]}});

  const DEFAULT_CONTACT_CONFIG: ContactPageConfig = {
    heroTitle: 'We’re Here to Help',
    heroSubtitle: 'Have a question, need assistance, or want to work with Auricity? Get in touch with our team.',
    heroImage: '',
    contactSectionTitle: 'Contact Auricity',
    contactSectionDescription: 'Reach out through the channel that works best for you. Contact details shown here are controlled from the Admin Panel.',
    email: '',
    phone: '',
    address: '',
    workingHours: '',
    formTitle: 'Send us a message',
    formSubtitle: 'Tell us what you need and our team will route your message to the right place.',
    inquiryTypes: ['General Inquiry','Property Inquiry','Broker Support','Affiliate Support','Partnership','Technical Support','Feedback','Other'],
    formButtonText: 'Send Message',
    mapEnabled: false,
    mapLocationName: '',
    mapAddress: '',
    mapEmbedUrl: '',
    quickActions: [
      { id: 'email', label: 'Email Us', enabled: true },
      { id: 'phone', label: 'Call Us', enabled: true },
      { id: 'whatsapp', label: 'WhatsApp Us', enabled: false },
      { id: 'visit', label: 'Visit Us', enabled: false }
    ],
    faqTitle: 'Contact FAQ',
    faqs: [
      { question: 'How can I contact Auricity?', answer: 'Use the contact form or any configured quick-contact option on this page.', visible: true, order: 1 },
      { question: 'How long does it take to receive a response?', answer: 'Response times depend on the inquiry and the team handling it. Working hours shown above are configured by the Auricity admin.', visible: true, order: 2 },
      { question: 'How can I contact broker support?', answer: 'Choose Broker Support in the inquiry type and submit your message.', visible: true, order: 3 },
      { question: 'How can I contact affiliate support?', answer: 'Choose Affiliate Support in the inquiry type and submit your message.', visible: true, order: 4 },
      { question: 'How can I report an issue?', answer: 'Choose Technical Support and describe the issue with useful context.', visible: true, order: 5 },
      { question: 'How can I submit feedback?', answer: 'Choose Feedback and send your suggestions through the contact form.', visible: true, order: 6 }
    ],
    bottomCtaTitle: 'Need help with something specific?',
    bottomCtaDescription: 'Send us the details and our team will take it from there.',
    bottomCtaButtonText: 'Contact Auricity',
    bottomCtaButtonLink: '/contact'
  };

  const [contactPageConfig, setContactPageConfig] = useState<ContactPageConfig>(() => {
    try { const saved = localStorage.getItem('auricity_contact_page_config'); return saved ? { ...DEFAULT_CONTACT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONTACT_CONFIG; } catch { return DEFAULT_CONTACT_CONFIG; }
  });
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [realtors, setRealtors] = useState<Realtor[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_realtors');
      return saved ? JSON.parse(saved) : INITIAL_REALTORS;
    } catch {
      return INITIAL_REALTORS;
    }
  });

  const [clubCardsConfig, setClubCardsConfig] = useState<ClubCardsConfig>(() => {
    try {
      const saved = localStorage.getItem('auricity_club_cards');
      return saved ? JSON.parse(saved) : INITIAL_CLUB_CARDS_CONFIG;
    } catch {
      return INITIAL_CLUB_CARDS_CONFIG;
    }
  });

  const [cmsPages, setCmsPages] = useState<Record<string, CmsPageData>>(() => {
    try {
      const saved = localStorage.getItem('auricity_cms_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.about?.sections?.mainContent?.customFields?.paragraphs) {
          parsed.about = INITIAL_CMS_PAGES.about;
        } else if (
          !parsed.about?.sections?.mainContent?.customFields?.ownerPhoto ||
          parsed.about?.sections?.mainContent?.customFields?.ownerPhoto.includes('vinod_sonawane.jpg')
        ) {
          parsed.about.sections.mainContent.customFields.ownerPhoto = 'https://cdn.postimage.me/2026/09/02/1000001101.png';
        }
        return parsed;
      }
      return INITIAL_CMS_PAGES;
    } catch {
      return INITIAL_CMS_PAGES;
    }
  });

  const [homePageConfig, setHomePageConfig] = useState<HomePageConfig>(() => {
    try {
      const saved = localStorage.getItem('auricity_home_page_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeHomePageConfig(parsed);
      }
    } catch {}
    return DEFAULT_HOME_PAGE_CONFIG;
  });

  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_media_library');
      return saved ? JSON.parse(saved) : INITIAL_MEDIA_LIBRARY;
    } catch {
      return INITIAL_MEDIA_LIBRARY;
    }
  });

  const [bannerAds, setBannerAds] = useState<BannerAdItem[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_banner_ads');
      return saved ? JSON.parse(saved) : INITIAL_BANNER_ADS;
    } catch {
      return INITIAL_BANNER_ADS;
    }
  });

  const [cmsBlogs, setCmsBlogs] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_cms_blogs');
      return saved ? JSON.parse(saved) : INITIAL_CMS_BLOGS;
    } catch {
      return INITIAL_CMS_BLOGS;
    }
  });

  const [trainingBlogs, setTrainingBlogs] = useState<TrainingBlog[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_training_blogs');
      return saved ? JSON.parse(saved) : INITIAL_TRAINING_BLOGS;
    } catch {
      return INITIAL_TRAINING_BLOGS;
    }
  });

  const [knowledgeHubConfig, setKnowledgeHubConfig] = useState<KnowledgeHubConfig>(() => {
    try {
      const saved = localStorage.getItem('auricity_knowledge_hub_config');
      return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_HUB_CONFIG;
    } catch {
      return INITIAL_KNOWLEDGE_HUB_CONFIG;
    }
  });

  const [brokerAccessRequests, setBrokerAccessRequests] = useState<BrokerAccessRequest[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_broker_access_requests');
      return saved ? JSON.parse(saved) : INITIAL_BROKER_ACCESS_REQUESTS;
    } catch {
      return INITIAL_BROKER_ACCESS_REQUESTS;
    }
  });

  const [brokerMessages, setBrokerMessages] = useState<BrokerDirectMessage[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_broker_messages');
      return saved ? JSON.parse(saved) : INITIAL_BROKER_MESSAGES;
    } catch {
      return INITIAL_BROKER_MESSAGES;
    }
  });

  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig>(() => {
    try {
      const saved = localStorage.getItem('auricity_nav_config');
      return saved ? JSON.parse(saved) : INITIAL_NAVIGATION_CONFIG;
    } catch {
      return INITIAL_NAVIGATION_CONFIG;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_leads');
      return saved ? JSON.parse(saved) : [
        {
          id: 'lead-1',
          name: 'Sunil Jagtap',
          phone: '9822019988',
          email: 'sunil.jagtap@gmail.com',
          propertyTitle: 'Spacious 2 BHK in CIDCO N-4',
          message: 'Interested in scheduling a site visit this Saturday.',
          status: 'new',
          budget: '₹45 - 55 Lakh',
          preferredLocality: 'CIDCO',
          source: 'Website Inquiry',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'lead-2',
          name: 'Pooja Deshpande',
          phone: '9890123456',
          email: 'pooja.d@yahoo.com',
          propertyTitle: 'Direct Owner 3 BHK Luxury Garkheda',
          message: 'Looking for urgent possession before Diwali.',
          status: 'contacted',
          budget: '₹75 - 90 Lakh',
          preferredLocality: 'Garkheda',
          source: 'WhatsApp Desk',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  const [serviceProviderRegistrations, setServiceProviderRegistrations] = useState<ServiceProviderRegistration[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_service_provider_registrations');
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; }
      return [];
    } catch { return []; }
  });

  const [serviceBookings, setServiceBookings] = useState<ServiceBookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('auricity_bookings');
      return saved ? JSON.parse(saved) : [
        {
          id: 'bk-1',
          serviceId: 'legal-title-search',
          serviceTitle: '30-Year Title Search & Legal Opinion',
          userName: 'Vikram Shinde',
          userPhone: '9422114455',
          locality: 'Samarth Nagar',
          date: '2025-04-10',
          status: 'confirmed',
          notes: 'Plot verification near Cannaught place.'
        }
      ];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('auricity_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ---------------------------------------------------------------------
  // Shared server hydration
  // ---------------------------------------------------------------------
  // localStorage is per-browser/per-device, so admin edits used to never
  // reach real visitors and were wiped on cache clear / new device. On
  // mount we pull the latest shared copy of every CMS collection from the
  // server (see /api/store/:key in server.ts) and use it if present. The
  // `hydratedRef` guard below stops the "sync to server" effects further
  // down from firing with stale local defaults before this fetch resolves
  // (which could otherwise briefly overwrite real data already on the
  // server with whatever was left over in this browser's localStorage).
  const hydratedRef = useRef(false);
  const syncTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const setters: Record<string, (v: any) => void> = {
      auricity_properties: setAllProperties,
      auricity_projects: setProjects,
      auricity_offers: setOffers,
      auricity_offer_categories: setOfferCategories,
      auricity_offers_page_config: setOffersPageConfig,
      auricity_offer_claims: setOfferClaims,
      auricity_offer_analytics: setOfferAnalytics,
      auricity_realtors: setRealtors,
      auricity_club_cards: setClubCardsConfig,
      auricity_cms_pages: setCmsPages,
      auricity_home_page_config: setHomePageConfig,
      auricity_media_library: setMediaLibrary,
      auricity_banner_ads: setBannerAds,
      auricity_cms_blogs: setCmsBlogs,
      auricity_training_blogs: setTrainingBlogs,
      auricity_knowledge_hub_config: setKnowledgeHubConfig,
      auricity_broker_access_requests: setBrokerAccessRequests,
      auricity_broker_messages: setBrokerMessages,
      auricity_contact_page_config: setContactPageConfig,
      auricity_nav_config: setNavigationConfig,
      auricity_leads: setLeads,
      auricity_bookings: setServiceBookings,
      auricity_service_provider_registrations: setServiceProviderRegistrations,
      auricity_settings: setSettings,
      auricity_custom_services: setCustomServiceDetails
    };

    const hydrate = async () => {
      await Promise.all(
        Object.entries(setters).map(async ([key, setter]) => {
          const value = await fetchStore<any>(key);
          if (value !== null) {
            if (key === 'auricity_properties' && Array.isArray(value)) {
              const normalized = value.map((p: any) => normalizeProperty(p));
              setter(Array.from(new Map(normalized.map((p: Property) => [p.id, p])).values()));
            } else {
              setter(value);
            }
          }
        })
      );
      hydratedRef.current = true;
    };
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === 'function') {
      const id = idle(hydrate, { timeout: 1200 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(hydrate, 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeRole !== 'admin') return;
    fetch('/api/contact/messages', { headers: { 'x-admin-pin': String(settings.adminPin || '') } })
      .then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data?.value)) setContactMessages(data.value); }).catch(() => {});
  }, [activeRole, settings.adminPin]);

  // Push a collection to the shared server store and — unlike before — tell
  // the admin when it didn't actually save (oversized payload, server down,
  // etc). `label` is the plain-language name shown in that warning. A short
  // per-key cooldown stops a single bad save (e.g. a huge photo saved via
  // several fast state updates) from stacking up duplicate toasts.
  const lastSyncWarningRef = useRef<Record<string, number>>({});

  // localStorage has a small per-origin quota (~5-10MB). Before compressed
  // uploads were added, a handful of full-size photos could fill it, after
  // which every further localStorage.setItem call throws — previously that
  // was swallowed silently, so nothing appeared to save and there was no
  // way to tell why. Compression makes this rare now, but if it does happen
  // the admin should see it instead of just losing changes quietly.
  const warnIfStorageFull = (err: unknown, label: string) => {
    const isQuotaError = err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22);
    if (!isQuotaError) return;
    const key = `local_${label}`;
    const now = Date.now();
    const lastWarned = lastSyncWarningRef.current[key] || 0;
    if (now - lastWarned > 8000) {
      lastSyncWarningRef.current[key] = now;
      showToast(`Browser storage full — ${label} save nahi ho payega. Purani unused photos/media library items delete karo.`, 'error');
    }
  };

  const syncToServer = (key: string, value: any, label: string) => {
    const existing = syncTimersRef.current[key];
    if (existing) clearTimeout(existing);
    syncTimersRef.current[key] = setTimeout(async () => {
      const ok = await pushStore(key, value);
      if (!ok) {
        const now = Date.now();
        const lastWarned = lastSyncWarningRef.current[key] || 0;
        if (now - lastWarned > 8000) {
          lastSyncWarningRef.current[key] = now;
          showToast(`${label} save nahi hua — file bahut badi ho sakti hai ya connection issue. Dobara try karo.`, 'error');
        }
      }
      delete syncTimersRef.current[key];
    }, 650);
  };

  // Sync state to localStorage (and, once hydrated, to the shared server
  // store so every visitor — not just this browser — sees admin edits)
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem('auricity_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('auricity_current_user');
    } catch (e) { warnIfStorageFull(e, 'Current user session'); }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_properties', JSON.stringify(allProperties));
    } catch (e) { warnIfStorageFull(e, 'Properties'); }
    if (hydratedRef.current) syncToServer('auricity_properties', allProperties, 'Properties');
  }, [allProperties]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_projects', JSON.stringify(projects));
    } catch (e) { warnIfStorageFull(e, 'Projects'); }
    if (hydratedRef.current) syncToServer('auricity_projects', projects, 'Projects');
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_offers', JSON.stringify(offers));
    } catch (e) { warnIfStorageFull(e, 'Offers'); }
    if (hydratedRef.current) syncToServer('auricity_offers', offers, 'Offers');
  }, [offers]);

  useEffect(() => {
    const reconcileOfferStatuses = () => {
      const t=Date.now();
      setOffers(prev=>{ let changed=false; const next=prev.map(o=>{
        if(o.status==='published' && o.endAt && new Date(o.endAt).getTime()<t){changed=true;return {...o,status:'expired',published:false,updatedAt:new Date().toISOString()};}
        if(o.status==='scheduled' && (!o.startAt || new Date(o.startAt).getTime()<=t) && (!o.endAt || new Date(o.endAt).getTime()>=t)){changed=true;return {...o,status:'published',published:true,updatedAt:new Date().toISOString()};}
        return o;
      }); return changed?next:prev; });
    };
    reconcileOfferStatuses(); const timer=window.setInterval(reconcileOfferStatuses,60000); return()=>window.clearInterval(timer);
  }, []);

  useEffect(()=>{try{localStorage.setItem('auricity_offer_categories',JSON.stringify(offerCategories))}catch(e){warnIfStorageFull(e,'Offer categories')}if(hydratedRef.current)syncToServer('auricity_offer_categories',offerCategories,'Offer categories')},[offerCategories]);
  useEffect(()=>{try{localStorage.setItem('auricity_offers_page_config',JSON.stringify(offersPageConfig))}catch(e){warnIfStorageFull(e,'Offers page')}if(hydratedRef.current)syncToServer('auricity_offers_page_config',offersPageConfig,'Offers page')},[offersPageConfig]);
  useEffect(()=>{try{localStorage.setItem('auricity_offer_claims',JSON.stringify(offerClaims))}catch(e){warnIfStorageFull(e,'Offer claims')}if(hydratedRef.current)syncToServer('auricity_offer_claims',offerClaims,'Offer claims')},[offerClaims]);
  useEffect(()=>{try{localStorage.setItem('auricity_offer_analytics',JSON.stringify(offerAnalytics))}catch(e){warnIfStorageFull(e,'Offer analytics')}if(hydratedRef.current)syncToServer('auricity_offer_analytics',offerAnalytics,'Offer analytics')},[offerAnalytics]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_realtors', JSON.stringify(realtors));
    } catch (e) { warnIfStorageFull(e, 'Realtors'); }
    if (hydratedRef.current) syncToServer('auricity_realtors', realtors, 'Realtors');
  }, [realtors]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_club_cards', JSON.stringify(clubCardsConfig));
    } catch (e) { warnIfStorageFull(e, 'Club cards'); }
    if (hydratedRef.current) syncToServer('auricity_club_cards', clubCardsConfig, 'Club cards');
  }, [clubCardsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_cms_pages', JSON.stringify(cmsPages));
    } catch (e) { warnIfStorageFull(e, 'Page content'); }
    if (hydratedRef.current) syncToServer('auricity_cms_pages', cmsPages, 'Page content');
  }, [cmsPages]);

  useEffect(() => {
    try { localStorage.setItem('auricity_home_page_config', JSON.stringify(homePageConfig)); } catch (e) { warnIfStorageFull(e, 'Homepage layout'); }
    if (hydratedRef.current) syncToServer('auricity_home_page_config', homePageConfig, 'Homepage layout');
  }, [homePageConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_media_library', JSON.stringify(mediaLibrary));
    } catch (e) { warnIfStorageFull(e, 'Media library'); }
    if (hydratedRef.current) syncToServer('auricity_media_library', mediaLibrary, 'Media library');
  }, [mediaLibrary]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_banner_ads', JSON.stringify(bannerAds));
    } catch (e) { warnIfStorageFull(e, 'Banner ads'); }
    if (hydratedRef.current) syncToServer('auricity_banner_ads', bannerAds, 'Banner ads');
  }, [bannerAds]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_cms_blogs', JSON.stringify(cmsBlogs));
    } catch (e) { warnIfStorageFull(e, 'Blog posts'); }
    if (hydratedRef.current) syncToServer('auricity_cms_blogs', cmsBlogs, 'Blog posts');
  }, [cmsBlogs]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_training_blogs', JSON.stringify(trainingBlogs));
    } catch (e) { warnIfStorageFull(e, 'Broker training articles'); }
    if (hydratedRef.current) syncToServer('auricity_training_blogs', trainingBlogs, 'Broker training articles');
  }, [trainingBlogs]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_knowledge_hub_config', JSON.stringify(knowledgeHubConfig));
    } catch (e) { warnIfStorageFull(e, 'Knowledge hub'); }
    if (hydratedRef.current) syncToServer('auricity_knowledge_hub_config', knowledgeHubConfig, 'Knowledge hub');
  }, [knowledgeHubConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_broker_access_requests', JSON.stringify(brokerAccessRequests));
    } catch (e) { warnIfStorageFull(e, 'Broker access requests'); }
    if (hydratedRef.current) syncToServer('auricity_broker_access_requests', brokerAccessRequests, 'Broker access requests');
  }, [brokerAccessRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_broker_messages', JSON.stringify(brokerMessages));
    } catch (e) { warnIfStorageFull(e, 'Broker messages'); }
    if (hydratedRef.current) syncToServer('auricity_broker_messages', brokerMessages, 'Broker messages');
  }, [brokerMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_nav_config', JSON.stringify(navigationConfig));
    } catch (e) { warnIfStorageFull(e, 'Navigation menu'); }
    if (hydratedRef.current) syncToServer('auricity_nav_config', navigationConfig, 'Navigation menu');
  }, [navigationConfig]);

  useEffect(() => {
    try { localStorage.setItem('auricity_contact_page_config', JSON.stringify(contactPageConfig)); } catch (e) { warnIfStorageFull(e, 'Contact page'); }
    if (hydratedRef.current) syncToServer('auricity_contact_page_config', contactPageConfig, 'Contact page');
  }, [contactPageConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_favorites', JSON.stringify(favorites));
    } catch (e) { warnIfStorageFull(e, 'Favorites'); }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_leads', JSON.stringify(leads));
    } catch (e) { warnIfStorageFull(e, 'Leads'); }
    if (hydratedRef.current) syncToServer('auricity_leads', leads, 'Leads');
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_bookings', JSON.stringify(serviceBookings));
    } catch (e) { warnIfStorageFull(e, 'Service bookings'); }
    if (hydratedRef.current) syncToServer('auricity_bookings', serviceBookings, 'Service bookings');
  }, [serviceBookings]);

  useEffect(() => {
    try {
      localStorage.setItem('auricity_settings', JSON.stringify(settings));
    } catch (e) { warnIfStorageFull(e, 'Site settings'); }
    if (hydratedRef.current) syncToServer('auricity_settings', settings, 'Site settings');
  }, [settings]);

  // Toast Notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Property Actions
  const addProperty = (prop: Property) => {
    setAllProperties(prev => [prop, ...prev]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setAllProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = (id: string) => {
    setAllProperties(prev => prev.filter(p => p.id !== id));
  };

  // Projects Actions
  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // Offers Actions
  const addOffer = (offer: OfferItem) => {
    setOffers(prev => [offer, ...prev]);
  };

  const updateOffer = (id: string, updates: Partial<OfferItem>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const addOfferCategory=(category:OfferCategory)=>setOfferCategories(prev=>[...prev,category]);
  const updateOfferCategory=(id:string,updates:Partial<OfferCategory>)=>setOfferCategories(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));
  const deleteOfferCategory=(id:string)=>setOfferCategories(prev=>prev.filter(c=>c.id!==id));
  const updateOffersPageConfig=(updates:Partial<OffersPageConfig>)=>setOffersPageConfig(prev=>({...prev,...updates}));
  const addOfferClaim=(claim:Omit<OfferClaim,'id'|'createdAt'|'status'>)=>{const id=`claim-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;setOfferClaims(prev=>[{...claim,id,status:'new',createdAt:new Date().toISOString()},...prev]);setOffers(prev=>prev.map(o=>o.id===claim.offerId?{...o,claims:(o.claims||0)+1}:o));setOfferAnalytics(prev=>[{id:`event-${Date.now()}`,offerId:claim.offerId,eventType:'claim',userId:claim.userId,createdAt:new Date().toISOString()},...prev]);};
  const updateOfferClaim=(id:string,updates:Partial<OfferClaim>)=>setOfferClaims(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));
  const recordOfferAnalytics=(offerId:string,eventType:OfferAnalyticsEvent['eventType'])=>{const ev={id:`event-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,offerId,eventType,userId:currentUser?.id,createdAt:new Date().toISOString()};setOfferAnalytics(prev=>[ev,...prev].slice(0,10000));if(eventType==='view')setOffers(prev=>prev.map(o=>o.id===offerId?{...o,views:(o.views||0)+1}:o));};

  // Verified Realtors Actions
  const addRealtor = (realtor: Realtor) => {
    setRealtors(prev => [realtor, ...prev]);
  };

  const updateRealtor = (id: string, updates: Partial<Realtor>) => {
    setRealtors(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRealtor = (id: string) => {
    setRealtors(prev => prev.filter(r => r.id !== id));
  };

  // Club Cards Config Actions
  const updateClubCardsConfig = (updates: Partial<ClubCardsConfig>) => {
    setClubCardsConfig(prev => ({ ...prev, ...updates }));
  };

  // CMS Page Content Actions
  const updateCmsPage = (pageId: string, updates: Partial<CmsPageData>) => {
    setCmsPages(prev => {
      const existing = prev[pageId] || INITIAL_CMS_PAGES[pageId];
      return {
        ...prev,
        [pageId]: {
          ...existing,
          ...updates,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      };
    });
  };

  const updateCmsSection = (pageId: string, sectionId: string, sectionUpdates: any) => {
    setCmsPages(prev => {
      const page = prev[pageId] || INITIAL_CMS_PAGES[pageId];
      if (!page) return prev;
      const currentSection = page.sections?.[sectionId] || { id: sectionId, name: sectionId };
      return {
        ...prev,
        [pageId]: {
          ...page,
          lastUpdated: new Date().toISOString().split('T')[0],
          sections: {
            ...page.sections,
            [sectionId]: {
              ...currentSection,
              ...sectionUpdates
            }
          }
        }
      };
    });
  };

  // CMS Media Library Actions
  const addMediaItem = (item: MediaItem) => {
    setMediaLibrary(prev => [item, ...prev]);
  };

  const addMediaItemsBulk = (items: MediaItem[]) => {
    setMediaLibrary(prev => [...items, ...prev]);
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaLibrary(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMediaItem = (id: string) => {
    setMediaLibrary(prev => prev.filter(m => m.id !== id));
  };

  // CMS Banner Ads Actions
  const addBannerAd = (ad: BannerAdItem) => {
    setBannerAds(prev => [...prev, ad]);
  };

  const updateBannerAd = (id: string, updates: Partial<BannerAdItem>) => {
    setBannerAds(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBannerAd = (id: string) => {
    setBannerAds(prev => prev.filter(b => b.id !== id));
  };

  const reorderBannerAds = (newAds: BannerAdItem[]) => {
    setBannerAds(newAds);
  };

  // CMS Blogs Actions
  const addCmsBlog = (blog: BlogPost) => {
    setCmsBlogs(prev => [blog, ...prev]);
  };

  const updateCmsBlog = (id: string, updates: Partial<BlogPost>) => {
    setCmsBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteCmsBlog = (id: string) => {
    setCmsBlogs(prev => prev.filter(b => b.id !== id));
  };

  const addTrainingBlog = (tb: TrainingBlog) => {
    setTrainingBlogs(prev => [tb, ...prev]);
  };

  const updateTrainingBlog = (id: string, updates: Partial<TrainingBlog>) => {
    setTrainingBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteTrainingBlog = (id: string) => {
    setTrainingBlogs(prev => prev.filter(b => b.id !== id));
  };

  // CMS Knowledge Hub Actions
  const updateKnowledgeHubConfig = (updates: Partial<KnowledgeHubConfig>) => {
    setKnowledgeHubConfig(prev => ({ ...prev, ...updates }));
  };

  // Broker Access Requests Actions
  const requestBrokerAccess = (brokerInfo: { brokerId: string; brokerName: string; agencyName?: string; phone: string; email: string; reraNumber?: string }) => {
    const existing = brokerAccessRequests.find(r => r.brokerId === brokerInfo.brokerId || r.phone === brokerInfo.phone);
    if (existing) {
      if (existing.status === 'approved') {
        showToast('Your broker account is already approved for Knowledge Hub access!', 'info');
        return;
      }
      if (existing.status === 'pending') {
        showToast('Your access request is currently pending Super Admin review.', 'info');
        return;
      }
    }

    const newRequest: BrokerAccessRequest = {
      id: `bar-${Date.now()}`,
      brokerId: brokerInfo.brokerId || `broker-${Date.now()}`,
      brokerName: brokerInfo.brokerName,
      agencyName: brokerInfo.agencyName,
      phone: brokerInfo.phone,
      email: brokerInfo.email,
      reraNumber: brokerInfo.reraNumber,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    setBrokerAccessRequests(prev => [newRequest, ...prev]);
    showToast('Knowledge Hub access requested! Super Admin will review your RERA credentials.', 'success');
  };

  const updateBrokerAccessRequestStatus = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    setBrokerAccessRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status,
          reviewedAt: new Date().toISOString(),
          adminNotes: notes || req.adminNotes
        };
      }
      return req;
    }));
    showToast(`Broker access request has been marked as ${status.toUpperCase()}.`, 'success');
  };

  const deleteBrokerAccessRequest = (requestId: string) => {
    setBrokerAccessRequests(prev => prev.filter(r => r.id !== requestId));
    showToast('Broker access record removed.', 'info');
  };

  const getBrokerAccessStatus = (brokerId: string): 'not_requested' | 'pending' | 'approved' | 'rejected' => {
    if (!brokerId) return 'not_requested';
    const found = brokerAccessRequests.find(r => r.brokerId === brokerId || (currentUser?.id && r.brokerId === currentUser.id) || (currentUser?.phone && r.phone === currentUser.phone));
    if (!found) return 'not_requested';
    return found.status;
  };

  // Broker Direct Messages Actions
  const sendBrokerMessage = (msg: { brokerId: string; brokerName: string; senderRole: 'broker' | 'admin'; message: string }) => {
    const newMsg: BrokerDirectMessage = {
      id: `msg-${Date.now()}`,
      brokerId: msg.brokerId,
      brokerName: msg.brokerName,
      senderRole: msg.senderRole,
      message: msg.message,
      timestamp: new Date().toISOString(),
      read: msg.senderRole === 'admin'
    };
    setBrokerMessages(prev => [...prev, newMsg]);
    showToast('Message dispatched successfully.', 'success');
  };

  // CMS Navigation Config Actions
  const updateNavigationConfig = (updates: Partial<NavigationConfig>) => {
    setNavigationConfig(prev => ({ ...prev, ...updates }));
  };

  // Favorite Actions
  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(propertyId);
      if (exists) {
        showToast('Property removed from favorites', 'info');
        return prev.filter(id => id !== propertyId);
      } else {
        showToast('Property saved to favorites!', 'success');
        return [...prev, propertyId];
      }
    });
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  // Lead Actions
  const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
  };

  const deleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  // Navigation to Dedicated Detail Pages (Real separate pages with URL synchronization)
  const navigateToPropertyDetail = (id: string) => {
    setSelectedPropertyId(id);
    setActiveViewState('property-detail');
    try { window.history.pushState({ type: 'property', id }, '', `/properties/${id}`); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProjectDetail = (id: string) => {
    setSelectedProjectId(id);
    setActiveViewState('project-detail');
    try { window.history.pushState({ type: 'project', id }, '', `/projects/${id}`); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToServiceDetail = (id: string) => {
    setSelectedServiceId(id);
    setActiveViewState('service-detail');
    try { window.history.pushState({ type: 'service', id }, '', `/services/${id}`); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToOfferDetail = (id: string) => {
    const offer = offers.find(o => o.id === id);
    const routeKey = offer?.slug || id;
    setSelectedOfferId(routeKey);
    setActiveViewState('offer-detail');
    try { window.history.pushState({ type: 'offer', id: routeKey }, '', `/offers/${encodeURIComponent(routeKey)}`); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Custom Service Details Update (CMS)
  const updateCustomServiceDetail = (categoryId: string, updates: any) => {
    setCustomServiceDetails(prev => {
      const next = {
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] || {}),
          ...updates
        }
      };
      try {
        localStorage.setItem('auricity_custom_services', JSON.stringify(next));
      } catch (e) { warnIfStorageFull(e, 'Service details'); }
      syncToServer('auricity_custom_services', next, 'Service details');
      return next;
    });
    showToast('Service details updated in CMS', 'success');
  };

  // URL Path Synchronization & Popstate Handler
  // A direct-open route gets a one-entry guard. The first Android/browser Back
  // therefore returns to Auricity Home instead of immediately closing the tab;
  // normal in-app navigation still uses the browser history normally.
  useEffect(() => {
    const guardedPathRef = { current: null as string | null };

    try {
      const state = window.history.state;
      const appStateTypes = new Set(['auricity-root', 'auricity-root-guard', 'view', 'property', 'project', 'service', 'offer']);
      if (!state || !appStateTypes.has(state.type)) {
        const path = window.location.pathname;
        window.history.replaceState({ type: 'auricity-root', view: viewFromPath(path) }, '', window.location.href);
        window.history.pushState({ type: 'auricity-root-guard', view: viewFromPath(path) }, '', window.location.href);
        guardedPathRef.current = path;
      }
    } catch {}

    const handlePopState = () => {
      const path = window.location.pathname;
      const state = window.history.state;

      // We arrived here by pressing Back from a directly opened Auricity URL.
      // Consume the guard and land on the real home route instead of allowing
      // Chrome/Android to close the only tab.
      if (guardedPathRef.current && state?.type === 'auricity-root' && path === guardedPathRef.current) {
        guardedPathRef.current = null;
        window.history.replaceState({ type: 'view', view: 'home' }, '', '/');
        setActiveViewState('home');
        setSelectedPropertyId(null);
        setSelectedProjectId(null);
        setSelectedServiceId(null);
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      if (path.startsWith('/properties/')) {
        const id = path.slice('/properties/'.length);
        setSelectedPropertyId(id || null);
        setActiveViewState(id ? 'property-detail' : 'properties');
      } else if (path.startsWith('/projects/')) {
        const id = path.slice('/projects/'.length);
        setSelectedProjectId(id || null);
        setActiveViewState(id ? 'project-detail' : 'projects');
      } else if (path.startsWith('/services/')) {
        const id = path.slice('/services/'.length);
        setSelectedServiceId(id || null);
        setActiveViewState(id ? 'service-detail' : 'services');
      } else if (path.startsWith('/offers/')) {
        const id = decodeURIComponent(path.slice('/offers/'.length));
        setSelectedOfferId(id || null);
        setActiveViewState(id ? 'offer-detail' : 'offers');
      } else {
        setSelectedOfferId(null);
        setActiveViewState(viewFromPath(path));
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Service Booking Actions
  const addServiceProviderRegistration = (registration: ServiceProviderRegistration) => {
    setServiceProviderRegistrations(prev => [registration, ...prev]);
    showToast('Service provider registration submitted for review.', 'success');
  };

  const updateServiceProviderRegistration = (id: string, updates: Partial<ServiceProviderRegistration>) => {
    setServiceProviderRegistrations(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
  };

  const deleteServiceProviderRegistration = (id: string) => {
    setServiceProviderRegistrations(prev => prev.filter(item => item.id !== id));
  };

  const addServiceBooking = (booking: ServiceBookingRecord) => {
    const newBooking: ServiceBookingRecord = {
      ...booking,
      id: `bk-${Date.now()}`,
      status: booking.status || 'new',
      createdAt: new Date().toISOString()
    };
    setServiceBookings(prev => [newBooking, ...prev]);
    showToast('Service request submitted! Auricity team will contact you shortly.', 'success');
  };

  const updateServiceBookingStatus = (id: string, status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled', notes?: string) => {
    setServiceBookings(prev => prev.map(bk => {
      if (bk.id === id) {
        return {
          ...bk,
          status,
          notes: notes !== undefined ? notes : bk.notes
        };
      }
      return bk;
    }));
    showToast(`Service order marked as ${status.replace('_', ' ').toUpperCase()}`, 'info');
  };

  const deleteServiceBooking = (id: string) => {
    setServiceBookings(prev => prev.filter(bk => bk.id !== id));
    showToast('Service order removed', 'info');
  };

  // CMS Page Actions
  const addCmsPage = (page: CmsPageData) => {
    setCmsPages(prev => ({ ...prev, [page.id]: page }));
    showToast(`Page "${page.title}" created`, 'success');
  };

  const deleteCmsPage = (pageId: string) => {
    setCmsPages(prev => {
      if (!prev[pageId]) return prev;
      const next = { ...prev };
      delete next[pageId];
      return next;
    });
    showToast('Page removed from CMS', 'info');
  };

  const updateHomePageConfig = (updates: Partial<HomePageConfig>) => {
    setHomePageConfig(prev => ({ ...prev, ...updates }));
  };

  const updateHomeSection = (sectionId: string, updates: Partial<HomePageSectionConfig>) => {
    setHomePageConfig(prev => ({ ...prev, sections: prev.sections.map(section => section.id === sectionId ? { ...section, ...updates } : section) }));
  };

  const resetHomePageConfig = () => {
    setHomePageConfig(DEFAULT_HOME_PAGE_CONFIG);
    showToast('Homepage layout restored to default', 'info');
  };

  const updateContactPageConfig = (updates: Partial<ContactPageConfig>) => setContactPageConfig(prev => ({ ...prev, ...updates }));

  const submitContactMessage = async (message: Omit<ContactMessage, 'id'|'status'|'createdAt'|'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: ContactMessage = { ...message, id, status: 'new', createdAt: now, updatedAt: now };
    setContactMessages(prev => [record, ...prev]);
    try {
      const res = await fetch('/api/contact/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
      if (res.ok) return true;
      setContactMessages(prev => prev.filter(m => m.id !== id));
      return false;
    } catch {
      setContactMessages(prev => prev.filter(m => m.id !== id));
      return false;
    }
  };

  const updateContactMessage = (id: string, updates: Partial<ContactMessage>) => {
    const nextUpdates = { ...updates, updatedAt: new Date().toISOString() };
    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, ...nextUpdates } : m));
    fetch(`/api/contact/messages/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-pin':String(settings.adminPin||'')}, body:JSON.stringify(nextUpdates) }).catch(()=>{});
  };
  const deleteContactMessage = (id: string) => {
    setContactMessages(prev => prev.filter(m => m.id !== id));
    fetch(`/api/contact/messages/${encodeURIComponent(id)}`, { method:'DELETE', headers:{'x-admin-pin':String(settings.adminPin||'')} }).catch(()=>{});
  };

  // Settings Actions
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Super Admin PIN Verification
  const verifyAdminPin = (pin: string) => {
    return pin.trim() === settings.adminPin;
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        activeRole,
        setActiveRole,
        currentUser,
        setCurrentUser,
        showPinModal,
        setShowPinModal,
        verifyAdminPin,
        searchParams,
        setSearchParams,
        localitiesList,
        allProperties,
        addProperty,
        updateProperty,
        deleteProperty,
        projects,
        addProject,
        updateProject,
        deleteProject,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        offerCategories,
        addOfferCategory,
        updateOfferCategory,
        deleteOfferCategory,
        offersPageConfig,
        updateOffersPageConfig,
        offerClaims,
        addOfferClaim,
        updateOfferClaim,
        offerAnalytics,
        recordOfferAnalytics,
        contactPageConfig,
        updateContactPageConfig,
        contactMessages,
        submitContactMessage,
        updateContactMessage,
        deleteContactMessage,
        realtors,
        addRealtor,
        updateRealtor,
        deleteRealtor,
        clubCardsConfig,
        updateClubCardsConfig,
        cmsPages,
        addCmsPage,
        deleteCmsPage,
        updateCmsPage,
        updateCmsSection,
        homePageConfig,
        updateHomePageConfig,
        updateHomeSection,
        resetHomePageConfig,
        mediaLibrary,
        addMediaItem,
        addMediaItemsBulk,
        updateMediaItem,
        deleteMediaItem,
        bannerAds,
        addBannerAd,
        updateBannerAd,
        deleteBannerAd,
        reorderBannerAds,
        cmsBlogs,
        addCmsBlog,
        updateCmsBlog,
        deleteCmsBlog,
        trainingBlogs,
        addTrainingBlog,
        updateTrainingBlog,
        deleteTrainingBlog,
        knowledgeHubConfig,
        updateKnowledgeHubConfig,
        brokerAccessRequests,
        requestBrokerAccess,
        updateBrokerAccessRequestStatus,
        deleteBrokerAccessRequest,
        getBrokerAccessStatus,
        brokerMessages,
        sendBrokerMessage,
        navigationConfig,
        updateNavigationConfig,
        favorites,
        toggleFavorite,
        isFavorite,
        leads,
        addLead,
        updateLeadStatus,
        deleteLead,
        selectedPropertyId,
        setSelectedPropertyId,
        selectedProjectId,
        setSelectedProjectId,
        selectedServiceId,
        setSelectedServiceId,
        selectedOfferId,
        navigateToOfferDetail,
        navigateToPropertyDetail,
        navigateToProjectDetail,
        navigateToServiceDetail,
        customServiceDetails,
        updateCustomServiceDetail,
        serviceProviderRegistrations,
        addServiceProviderRegistration,
        updateServiceProviderRegistration,
        deleteServiceProviderRegistration,
        serviceBookings,
        addServiceBooking,
        updateServiceBookingStatus,
        deleteServiceBooking,
        settings,
        updateSettings,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

