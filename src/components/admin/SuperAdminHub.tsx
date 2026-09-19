import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Property, Lead, Project } from '../../types';
import { ThemeCustomizerPanel } from './ThemeCustomizerPanel';
import { PageContentEditor } from './cms/PageContentEditor';
import { MediaLibrary } from './cms/MediaLibrary';
import { BlogNewsManager } from './cms/BlogNewsManager';
import { ProjectsPropertiesManager } from './cms/ProjectsPropertiesManager';
import { SiteWideSettingsManager } from './cms/SiteWideSettingsManager';
import { RealtorsClubCardsManager } from './cms/RealtorsClubCardsManager';
import { KnowledgeHubManager } from './cms/KnowledgeHubManager';
import { NavigationManager } from './cms/NavigationManager';
import { ServicesManager } from './cms/ServicesManager';
import { AdminHelpGuide } from './AdminHelpGuide';
import { HomePageEditor } from './cms/HomePageEditor';
import { AIWebsiteEditor } from './AIWebsiteEditor';
import { BrokerPortal } from '../broker/BrokerPortal';
import { ServiceProviderPortal } from '../services/ServiceProviderPortal';
import { AffiliatePortal } from '../affiliate/AffiliatePortal';
import { OffersManager } from './cms/OffersManager';
import { ContactManager } from './ContactManager';
import { SpottedPropertiesManager } from './SpottedPropertiesManager';
import { formatPriceINR } from '../../utils/propertyUtils';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  Trash2, 
  Settings, 
  Layers, 
  FileCheck, 
  Search, 
  Palette,
  Eye,
  FileText,
  FolderOpen,
  BookOpen,
  Sliders,
  Sparkles,
  Award,
  GraduationCap,
  Compass,
  Wrench,
  HelpCircle,
  Tag,
  Plus,
  Edit,
  ExternalLink,
  Phone,
  MessageSquare,
  X,
  Star,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  Menu,
  Briefcase,
  Camera
} from 'lucide-react';

export type AdminTab = 
  | 'overview' 
  | 'properties'
  | 'projects' 
  | 'leads' 
  | 'services'
  | 'service_provider_applications'
  | 'realtors'
  | 'broker_applications'
  | 'affiliate'
  | 'spotted_leads'
  | 'offers'
  | 'home_editor'
  | 'cms_navigation'
  | 'cms_pages' 
  | 'contact'
  | 'cms_knowledge_hub'
  | 'cms_blogs' 
  | 'cms_media' 
  | 'theme' 
  | 'settings'
  | 'ai_editor'
  | 'help';

interface TabItem {
  id: AdminTab;
  label: string;
  badge?: number | string;
  icon: React.ElementType;
}

interface TabCategory {
  title: string;
  items: TabItem[];
}

export const SuperAdminHub: React.FC = () => {
  const { 
    allProperties, 
    addProperty,
    updateProperty,
    deleteProperty, 
    projects,
    leads, 
    addLead,
    updateLeadStatus, 
    deleteLead, 
    serviceBookings, 
    settings, 
    updateSettings, 
    showToast,
    setActiveView,
    localitiesList,
    activeRole,
    setActiveRole
  } = useApp();

  // Ensure active role is admin while inside the Super Admin Hub
  useEffect(() => {
    if (activeRole !== 'admin') {
      setActiveRole('admin');
    }
  }, [activeRole, setActiveRole]);

  const [activeTab, setActiveTabState] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Property Filters & Edit States
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyCategory, setPropertyCategory] = useState<string>('all');
  const [propertyLocality, setPropertyLocality] = useState<string>('all');
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyFormData, setPropertyFormData] = useState<Partial<Property>>({});

  // Lead Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredLocality: localitiesList[0] || 'CIDCO N-1 to N-4',
    propertyTitle: '',
    budget: '',
    message: '',
    status: 'new' as Lead['status']
  });

  // Browser history sync
  const hasReplacedInitialEntry = useRef(false);
  useEffect(() => {
    if (!hasReplacedInitialEntry.current) {
      hasReplacedInitialEntry.current = true;
      try {
        window.history.replaceState({ ...(window.history.state || {}), adminTab: activeTab }, '');
      } catch {}
    }

    const onPopState = (e: PopStateEvent) => {
      const tab = e.state?.adminTab as AdminTab | undefined;
      if (tab) setActiveTabState(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    setSidebarOpen(false);
    try {
      window.history.pushState({ ...(window.history.state || {}), adminTab: tab }, '');
    } catch {}
  };

  // Check persistence status
  const [storagePersistent, setStoragePersistent] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled && data) setStoragePersistent(Boolean(data.storagePersistent)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Stats calculation
  const totalProperties = allProperties.length;
  const verifiedProperties = allProperties.filter(p => p.verified).length;
  const totalProjects = projects.length;
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const totalBookings = serviceBookings.length;

  // Navigation Menu Definition
  const menuCategories: TabCategory[] = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview', label: 'Executive Dashboard', icon: Layers }
      ]
    },
    {
      title: 'Real Estate Listings',
      items: [
        { id: 'properties', label: 'Properties Inventory', badge: totalProperties, icon: Building2 },
        { id: 'projects', label: 'Mega Projects & Townships', badge: totalProjects, icon: Building2 },
        { id: 'leads', label: 'Inquiries & Leads CRM', badge: newLeads > 0 ? `${newLeads} new` : totalLeads, icon: Users }
      ]
    },
    {
      title: 'Services & Orders',
      items: [
        { id: 'services', label: 'Home Services & Orders', badge: totalBookings, icon: Wrench },
        { id: 'service_provider_applications', label: 'Service Providers', icon: Briefcase }
      ]
    },
    {
      title: 'Partners & Affiliates',
      items: [
        { id: 'realtors', label: 'Brokers & Realtors', icon: Award },
        { id: 'broker_applications', label: 'Broker Applications', icon: FileCheck },
        { id: 'affiliate', label: 'Affiliate Program', icon: Briefcase },
        { id: 'spotted_leads', label: '📸 Spotted Properties Leads', badge: 'New', icon: Camera }
      ]
    },
    {
      title: 'Website CMS & Layout',
      items: [
        { id: 'home_editor', label: 'Visual Homepage Canvas', icon: Eye },
        { id: 'cms_navigation', label: 'Header & Footer Menus', icon: Compass },
        { id: 'cms_pages', label: 'Pages Content CMS', icon: FileText },
        { id: 'contact', label: 'Contact Page & Messages', icon: PhoneCall },
        { id: 'offers', label: 'Offers & Coupons', icon: Tag },
        { id: 'cms_knowledge_hub', label: 'Knowledge Hub & Guides', icon: GraduationCap },
        { id: 'cms_blogs', label: 'News & Blog Posts', icon: BookOpen },
        { id: 'cms_media', label: 'Media & Photo Vault', icon: FolderOpen }
      ]
    },
    {
      title: 'Appearance & System',
      items: [
        { id: 'theme', label: 'Theme & Brand Colors', icon: Palette },
        { id: 'settings', label: 'Portal Master Settings', icon: Settings },
        { id: 'ai_editor', label: '✨ AI Website Assistant', icon: Sparkles },
        { id: 'help', label: 'Admin User Guide', icon: HelpCircle }
      ]
    }
  ];

  // Property Handlers
  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropertyFormData({
      id: `prop-${Date.now()}`,
      title: '',
      description: '',
      price: 5000000,
      priceDisplay: '₹ 50.0 Lakhs',
      propertyType: 'Apartment',
      listingType: 'Buy',
      locality: localitiesList[0] || 'CIDCO N-1 to N-4',
      address: '',
      city: 'Chhatrapati Sambhajinagar',
      carpetArea: 950,
      builtupArea: 1200,
      bedrooms: 2,
      bathrooms: 2,
      balconies: 1,
      furnishing: 'Semi-Furnished',
      parking: 'Covered',
      floorNumber: 2,
      totalFloors: 5,
      reraNumber: '',
      reraApproved: true,
      verified: true,
      zeroBrokerage: true,
      featured: true,
      status: 'Active',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['24/7 Security', 'Lift with Power Backup', 'Reserved Parking', 'Water Supply'],
      ownerContact: {
        name: 'Auricity Direct Team',
        phone: settings.supportPhone || '+91 80105 06030',
        whatsapp: '+918010506030',
        email: settings.supportEmail || 'support@auricity.in'
      },
      postedBy: 'Owner',
      readyToMove: true,
      tags: ['0% Brokerage', 'Verified Listing']
    });
    setIsPropertyModalOpen(true);
  };

  const handleOpenEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setPropertyFormData({ ...prop });
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyFormData.title?.trim()) {
      showToast('Please enter property title', 'error');
      return;
    }

    const priceNum = Number(propertyFormData.price) || 0;
    const finalProp: Property = {
      id: editingProperty ? editingProperty.id : (propertyFormData.id || `prop-${Date.now()}`),
      title: propertyFormData.title || 'Property',
      description: propertyFormData.description || '',
      price: priceNum,
      priceDisplay: propertyFormData.priceDisplay || formatPriceINR(priceNum),
      propertyType: propertyFormData.propertyType || 'Apartment',
      listingType: propertyFormData.listingType || 'Buy',
      locality: propertyFormData.locality || 'CIDCO',
      address: propertyFormData.address || '',
      city: propertyFormData.city || 'Chhatrapati Sambhajinagar',
      carpetArea: Number(propertyFormData.carpetArea) || 800,
      builtupArea: Number(propertyFormData.builtupArea) || 1000,
      bedrooms: propertyFormData.bedrooms ? Number(propertyFormData.bedrooms) : undefined,
      bathrooms: propertyFormData.bathrooms ? Number(propertyFormData.bathrooms) : undefined,
      balconies: propertyFormData.balconies ? Number(propertyFormData.balconies) : undefined,
      furnishing: propertyFormData.furnishing || 'Unfurnished',
      parking: propertyFormData.parking || 'Covered',
      floorNumber: propertyFormData.floorNumber !== undefined ? Number(propertyFormData.floorNumber) : undefined,
      totalFloors: propertyFormData.totalFloors !== undefined ? Number(propertyFormData.totalFloors) : undefined,
      reraNumber: propertyFormData.reraNumber,
      reraApproved: Boolean(propertyFormData.reraApproved),
      verified: Boolean(propertyFormData.verified),
      zeroBrokerage: Boolean(propertyFormData.zeroBrokerage),
      featured: Boolean(propertyFormData.featured),
      status: (propertyFormData.status as any) || 'Active',
      images: propertyFormData.images && propertyFormData.images.length > 0 
        ? propertyFormData.images 
        : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
      amenities: Array.isArray(propertyFormData.amenities) ? propertyFormData.amenities : [],
      ownerContact: propertyFormData.ownerContact || {
        name: 'Direct Contact',
        phone: settings.supportPhone || '+91 80105 06030',
        whatsapp: '+918010506030',
        email: settings.supportEmail || 'support@auricity.in'
      },
      postedBy: propertyFormData.postedBy || 'Owner',
      createdAt: editingProperty?.createdAt || new Date().toISOString(),
      readyToMove: Boolean(propertyFormData.readyToMove),
      tags: Array.isArray(propertyFormData.tags) ? propertyFormData.tags : []
    };

    if (editingProperty) {
      updateProperty(editingProperty.id, finalProp);
      showToast(`Property "${finalProp.title}" updated successfully!`, 'success');
    } else {
      addProperty(finalProp);
      showToast(`New property "${finalProp.title}" added to portal!`, 'success');
    }

    setIsPropertyModalOpen(false);
  };

  const handleDeleteProperty = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete listing "${title}"?`)) {
      deleteProperty(id);
      showToast(`Listing deleted`, 'info');
    }
  };

  // Leads Handlers
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim() || !newLeadForm.phone.trim()) {
      showToast('Name and phone number are required.', 'error');
      return;
    }
    addLead({
      name: newLeadForm.name,
      phone: newLeadForm.phone,
      email: newLeadForm.email,
      preferredLocality: newLeadForm.preferredLocality,
      propertyTitle: newLeadForm.propertyTitle || 'General Locality Inquiry',
      budget: newLeadForm.budget || 'Flexible',
      message: newLeadForm.message,
      status: newLeadForm.status
    });
    showToast('New customer inquiry recorded successfully!', 'success');
    setNewLeadForm({
      name: '',
      phone: '',
      email: '',
      preferredLocality: localitiesList[0] || 'CIDCO N-1 to N-4',
      propertyTitle: '',
      budget: '',
      message: '',
      status: 'new'
    });
    setIsLeadModalOpen(false);
  };

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return allProperties.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.locality.toLowerCase().includes(propertySearch.toLowerCase()) ||
        (p.ownerContact?.name && p.ownerContact.name.toLowerCase().includes(propertySearch.toLowerCase()));
      
      const matchesCategory = 
        propertyCategory === 'all' || 
        p.listingType.toLowerCase() === propertyCategory.toLowerCase();

      const matchesLocality = 
        propertyLocality === 'all' || 
        p.locality === propertyLocality;

      return matchesSearch && matchesCategory && matchesLocality;
    });
  }, [allProperties, propertySearch, propertyCategory, propertyLocality]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = 
        l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.phone.includes(leadSearch) ||
        (l.preferredLocality && l.preferredLocality.toLowerCase().includes(leadSearch.toLowerCase())) ||
        (l.propertyTitle && l.propertyTitle.toLowerCase().includes(leadSearch.toLowerCase()));

      const matchesStatus = 
        leadStatusFilter === 'all' || 
        l.status === leadStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, leadSearch, leadStatusFilter]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* GLOBAL TOP ADMIN BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 text-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm text-white tracking-tight">AURICITY CONTROL CENTER</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium hidden sm:block">Full Platform Management & Real-Time Customization</p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAddProperty}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>

          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Lead</span>
          </button>

          <button
            onClick={() => setActiveView('home')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Return to Public Website"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Live Website</span>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </button>
        </div>
      </header>

      {/* STORAGE PERSISTENCE WARNING (if applicable) */}
      {storagePersistent === false && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-6 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Server running in temporary mode: persistent storage not bound to a cloud database. Changes saved in browser memory and local store.</span>
          </div>
          <button onClick={() => setStoragePersistent(null)} className="text-amber-400 hover:text-white font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* MAIN CONTAINER: SIDEBAR + CONTENT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* RESPONSIVE SIDEBAR */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-200
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Sidebar Close */}
          <div className="lg:hidden p-4 flex items-center justify-between border-b border-slate-800">
            <span className="text-xs font-black uppercase text-slate-300">Navigation Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Nav Categories */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {menuCategories.map((cat) => {
              const matchingItems = cat.items.filter(item => 
                !globalSearch || 
                item.label.toLowerCase().includes(globalSearch.toLowerCase())
              );
              if (matchingItems.length === 0) return null;

              return (
                <div key={cat.title} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2.5">
                    {cat.title}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {matchingItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white font-black shadow-md'
                              : 'text-slate-200 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isActive
                                ? 'bg-blue-800 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-white">Chh. Sambhajinagar</p>
                <p className="text-[10px] text-slate-300">Portal Version 4.2</p>
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-200 hover:text-white hover:bg-slate-600 cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* BACKDROP FOR MOBILE */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/70 lg:hidden backdrop-blur-xs" 
          />
        )}

        {/* DYNAMIC CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8 text-slate-900">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* TAB: OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800/60 p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        Welcome, Administrator
                      </span>
                      <span className="text-xs text-blue-200 font-bold">100% Platform Access</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Auricity Real Estate & Local Services Hub
                    </h1>
                    <p className="text-xs text-blue-100 leading-relaxed font-medium">
                      Complete administrative authority over properties, township projects, verified realtors, customer inquiry pipelines, doorstep services, offers, website layouts, and brand themes.
                    </p>
                  </div>

                  {/* Quick Action Pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleOpenAddProperty}
                      className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Property</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Manage Projects</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('home_editor')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Edit Homepage</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    onClick={() => setActiveTab('properties')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-black uppercase tracking-wider">Active Properties</span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalProperties}</p>
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                      {verifiedProperties} Verified Listings
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('projects')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-black uppercase tracking-wider">Mega Townships</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalProjects}</p>
                    <p className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                      RERA Approved Projects
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('leads')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-black uppercase tracking-wider">Customer Inquiries</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalLeads}</p>
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                      {newLeads} Pending Follow-up
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('services')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-black uppercase tracking-wider">Service Bookings</span>
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Wrench className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalBookings}</p>
                    <p className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block border border-purple-200">
                      Doorstep Service Orders
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts & Recent Inquiries */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Latest Inquiries Feed */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Latest Customer Inquiries</h3>
                        <p className="text-xs text-slate-600 font-medium">Direct buyers and site visit booking requests</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('leads')}
                        className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View All Leads ({totalLeads})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {leads.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs font-medium">No customer inquiries received yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {leads.slice(0, 5).map((lead) => (
                          <div key={lead.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-slate-900 text-sm">{lead.name}</span>
                                <span className="font-mono text-blue-700 font-bold text-xs">{lead.phone}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  lead.status === 'new' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {lead.status}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs font-medium">
                                {lead.propertyTitle || 'General Inquiry'} • <span className="text-slate-900 font-bold">{lead.preferredLocality}</span>
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-auto">
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${lead.name}, thank you for your inquiry on Auricity regarding ${lead.propertyTitle || 'properties in Sambhajinagar'}. How may we assist you today?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1 shadow-xs transition-all"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                              <select
                                value={lead.status}
                                onChange={(e) => {
                                  updateLeadStatus(lead.id, e.target.value as any);
                                  showToast('Status updated', 'success');
                                }}
                                className="bg-white border border-slate-300 rounded-lg text-xs px-2.5 py-1 text-slate-900 font-bold focus:border-blue-600"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="site_visit_scheduled">Site Visit</option>
                                <option value="closed">Closed</option>
                                <option value="lost">Lost</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Launchpad Quick Tools */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Quick Management Access</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { tab: 'properties' as AdminTab, label: 'Add or Edit Properties', icon: Building2, desc: 'Update prices, photos, and verification' },
                          { tab: 'services' as AdminTab, label: 'Doorstep Rate Cards', icon: Wrench, desc: 'Packers, Cleaning, Legal rates' },
                          { tab: 'affiliate' as AdminTab, label: 'Affiliate Program Portal', icon: Briefcase, desc: 'Review applicants & referral codes' },
                          { tab: 'broker_applications' as AdminTab, label: 'Broker Registrations', icon: FileCheck, desc: 'Approve certified agent credentials' },
                          { tab: 'offers' as AdminTab, label: 'Offers & Stamp Duty Deals', icon: Tag, desc: 'Active coupons and festival banners' },
                          { tab: 'theme' as AdminTab, label: 'Website Colors & Theme', icon: Palette, desc: 'Branding presets and dark/light modes' }
                        ].map((btn) => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={btn.tab}
                              onClick={() => setActiveTab(btn.tab)}
                              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition-all flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-xl bg-white border border-slate-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">{btn.label}</p>
                                  <p className="text-[11px] text-slate-600 font-medium">{btn.desc}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-all" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROPERTIES INVENTORY (FULL CRUD) */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                {/* Properties Header & Search / Filter Controls */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Properties Inventory ({allProperties.length})</h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Directly create, update prices, change photos, and toggle verified status for any listing.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddProperty}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-2 self-start md:self-auto cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post New Property</span>
                  </button>
                </div>

                {/* Filters Strip */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, locality, owner..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <select
                    value={propertyCategory}
                    onChange={(e) => setPropertyCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="all">All Listing Types (Sale, Rent, Plots, Commercial)</option>
                    <option value="buy">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="commercial">Commercial</option>
                    <option value="plots">Plots & Land</option>
                    <option value="pg">PG / Co-living</option>
                  </select>

                  <select
                    value={propertyLocality}
                    onChange={(e) => setPropertyLocality(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="all">All Sambhajinagar Localities</option>
                    {localitiesList.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Properties Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-black uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Property</th>
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3">Price</th>
                          <th className="py-3 px-3">Locality</th>
                          <th className="py-3 px-3">Area (sq.ft)</th>
                          <th className="py-3 px-3 text-center">Verified</th>
                          <th className="py-3 px-3 text-center">Featured</th>
                          <th className="py-3 px-3 text-center">0% Brokerage</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-900">
                        {filteredProperties.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                              No properties match your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredProperties.map((prop) => (
                            <tr key={prop.id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=120&q=80'}
                                    alt={prop.title}
                                    className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
                                  />
                                  <div className="max-w-xs">
                                    <div className="font-bold text-slate-900 truncate" title={prop.title}>
                                      {prop.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono truncate">
                                      ID: {prop.id} • Posted by: <span className="font-semibold text-slate-700">{prop.postedBy || 'Owner'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px] uppercase">
                                  {prop.listingType}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-black text-emerald-700 whitespace-nowrap">
                                {prop.priceDisplay || formatPriceINR(prop.price)}
                              </td>
                              <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap">
                                {prop.locality}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                                {prop.carpetArea || '—'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateProperty(prop.id, { verified: !prop.verified });
                                    showToast(`Verified status updated for "${prop.title}"`, 'success');
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    prop.verified 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                  title="Click to toggle Verified badge"
                                >
                                  {prop.verified ? 'Verified ✓' : 'Unverified'}
                                </button>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateProperty(prop.id, { featured: !prop.featured });
                                    showToast(`Featured toggle updated`, 'success');
                                  }}
                                  className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                    prop.featured 
                                      ? 'text-amber-500 bg-amber-50 border border-amber-300' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                  title="Click to toggle Featured on Homepage"
                                >
                                  <Star className="w-4 h-4 fill-current" />
                                </button>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateProperty(prop.id, { zeroBrokerage: !prop.zeroBrokerage });
                                    showToast(`Zero Brokerage badge updated`, 'success');
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    prop.zeroBrokerage 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {prop.zeroBrokerage ? '0% Broker' : 'Standard'}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenEditProperty(prop)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-xs"
                                  title="Edit Listing"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-xs"
                                  title="Delete Listing"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROJECTS CMS (DEEP CMS CONTROLS) */}
            {activeTab === 'projects' && (
              <ProjectsPropertiesManager />
            )}

            {/* TAB: LEADS CRM */}
            {activeTab === 'leads' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Inquiries & Leads CRM ({leads.length})</h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Track prospective buyers, schedule site visits, and connect instantly via WhatsApp or direct phone.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLeadModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-2 self-start md:self-auto cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Manual Lead</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search lead by name, phone, locality..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="all">All Inquiry Statuses</option>
                    <option value="new">New Inquiries</option>
                    <option value="contacted">Contacted</option>
                    <option value="site_visit_scheduled">Site Visit Scheduled</option>
                    <option value="closed">Deal Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                {/* Leads Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLeads.length === 0 ? (
                    <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-500 rounded-2xl font-medium">
                      No leads matching your search criteria.
                    </div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <div key={lead.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">{lead.name}</h4>
                              <a href={`tel:${lead.phone}`} className="text-xs font-mono text-blue-700 font-bold hover:underline">
                                {lead.phone}
                              </a>
                            </div>
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                updateLeadStatus(lead.id, e.target.value as any);
                                showToast('Lead status updated', 'success');
                              }}
                              className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-2 py-1 text-slate-900 font-bold focus:border-blue-600"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="site_visit_scheduled">Site Visit</option>
                              <option value="closed">Deal Closed</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>

                          <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div><strong className="text-slate-900">Property:</strong> {lead.propertyTitle || 'General Locality Inquiry'}</div>
                            <div><strong className="text-slate-900">Locality:</strong> {lead.preferredLocality}</div>
                            <div><strong className="text-slate-900">Budget:</strong> {lead.budget || 'Flexible'}</div>
                            {lead.message && (
                              <div className="text-[11px] text-slate-800 italic pt-1.5 border-t border-slate-200 mt-1 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80">
                                "{lead.message}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${lead.name}, thank you for contacting Auricity regarding ${lead.propertyTitle || 'properties in Chhatrapati Sambhajinagar'}. Are you available for a quick call today?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() => {
                              if (confirm(`Delete lead "${lead.name}"?`)) {
                                deleteLead(lead.id);
                                showToast('Lead removed', 'info');
                              }
                            }}
                            className="text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SERVICES & RATE CARDS CMS */}
            {activeTab === 'services' && (
              <ServicesManager />
            )}

            {/* TAB: SERVICE PROVIDER APPLICATIONS */}
            {activeTab === 'service_provider_applications' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                  <h2 className="text-xl font-black text-slate-900">Service Provider Partner Registrations</h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Review incoming contractor and technician applications, verify documents, and approve active partner status.
                  </p>
                </div>
                <ServiceProviderPortal mode="admin" />
              </div>
            )}

            {/* TAB: REALTORS & CLUB CARDS */}
            {activeTab === 'realtors' && (
              <RealtorsClubCardsManager />
            )}

            {/* TAB: BROKER APPLICATIONS */}
            {activeTab === 'broker_applications' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                  <h2 className="text-xl font-black text-slate-900">Certified Broker Applications & Verification</h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Manage Marathwada real estate agent onboarding, MahaRERA certificates, and internal broker messaging access.
                  </p>
                </div>
                <BrokerPortal mode="admin" />
              </div>
            )}

            {/* TAB: AFFILIATE PROGRAM MANAGEMENT */}
            {activeTab === 'affiliate' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                  <h2 className="text-xl font-black text-slate-900">Auricity Affiliate Program Management</h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Review submitted affiliate partner profiles, approve or reject applications, assign custom referral codes, and inspect click-through & reward analytics.
                  </p>
                </div>
                <AffiliatePortal mode="admin" />
              </div>
            )}

            {/* TAB: SPOTTED PROPERTIES / STREET SCOUTS */}
            {activeTab === 'spotted_leads' && (
              <SpottedPropertiesManager />
            )}

            {/* TAB: OFFERS & PROMOTIONS */}
            {activeTab === 'offers' && (
              <OffersManager />
            )}

            {/* TAB: HOMEPAGE VISUAL CANVAS BUILDER */}
            {activeTab === 'home_editor' && (
              <HomePageEditor />
            )}

            {/* TAB: NAVIGATION & HEADER/FOOTER MENUS */}
            {activeTab === 'cms_navigation' && (
              <NavigationManager />
            )}

            {/* TAB: PAGES CONTENT CMS */}
            {activeTab === 'cms_pages' && (
              <PageContentEditor />
            )}

            {/* TAB: CONTACT PAGE & INBOX */}
            {activeTab === 'contact' && (
              <ContactManager />
            )}

            {/* TAB: KNOWLEDGE HUB & GUIDES */}
            {activeTab === 'cms_knowledge_hub' && (
              <KnowledgeHubManager />
            )}

            {/* TAB: BLOGS & NEWS */}
            {activeTab === 'cms_blogs' && (
              <BlogNewsManager />
            )}

            {/* TAB: MEDIA VAULT */}
            {activeTab === 'cms_media' && (
              <MediaLibrary />
            )}

            {/* TAB: THEME & APPEARANCE */}
            {activeTab === 'theme' && (
              <ThemeCustomizerPanel />
            )}

            {/* TAB: MASTER PORTAL SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 max-w-2xl shadow-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Master Support Helpline & Contact Info</h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    These details appear across the website header, footer, contact page, and WhatsApp direct links.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Master Support Phone</label>
                    <input
                      type="text"
                      value={settings.supportPhone}
                      onChange={(e) => updateSettings({ supportPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Support & Operations Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Office Address (Sambhajinagar)</label>
                    <input
                      type="text"
                      value={settings.officeAddress}
                      onChange={(e) => updateSettings({ officeAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => showToast('Master settings saved successfully!', 'success')}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AI WEBSITE ASSISTANT */}
            {activeTab === 'ai_editor' && (
              <AIWebsiteEditor />
            )}

            {/* TAB: ADMIN USER GUIDE */}
            {activeTab === 'help' && (
              <AdminHelpGuide onNavigate={(tab) => setActiveTab(tab as AdminTab)} />
            )}

          </div>
        </main>
      </div>

      {/* FULL PROPERTY ADD / EDIT MODAL */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingProperty ? `Edit Property: ${editingProperty.title}` : 'Post New Property Listing'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Fill in title, pricing, location, specs and image details for the live portal.
                </p>
              </div>
              <button 
                onClick={() => setIsPropertyModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Property Title *</label>
                  <input
                    type="text"
                    required
                    value={propertyFormData.title || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, title: e.target.value })}
                    placeholder="e.g., Luxury 3 BHK Flat in CIDCO N-4 near Prozone Mall"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Listing Type</label>
                  <select
                    value={propertyFormData.listingType || 'Buy'}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, listingType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    <option value="Buy">For Sale (Buy)</option>
                    <option value="Rent">For Rent</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Plots">Plot / Land</option>
                    <option value="pg">PG / Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Property Type</label>
                  <select
                    value={propertyFormData.propertyType || 'Apartment'}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, propertyType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Independent House / Villa">Row House / Villa</option>
                    <option value="Residential Plot">Residential Plot (NA 44)</option>
                    <option value="Commercial Shop">Commercial Shop</option>
                    <option value="Commercial Office">Commercial Office</option>
                    <option value="Industrial / MIDC Plot">Industrial / MIDC Plot</option>
                    <option value="Agricultural Land">Agricultural Land</option>
                    <option value="Penthouse">Luxury Penthouse</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Price (INR Number) *</label>
                  <input
                    type="number"
                    required
                    value={propertyFormData.price || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPropertyFormData({
                        ...propertyFormData,
                        price: val,
                        priceDisplay: formatPriceINR(val)
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Price Display Label</label>
                  <input
                    type="text"
                    value={propertyFormData.priceDisplay || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, priceDisplay: e.target.value })}
                    placeholder="e.g., ₹ 65.0 Lakhs or ₹ 18,500 / Month"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Locality in Sambhajinagar</label>
                  <select
                    value={propertyFormData.locality || localitiesList[0]}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, locality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    {localitiesList.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Address / Landmark</label>
                  <input
                    type="text"
                    value={propertyFormData.address || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, address: e.target.value })}
                    placeholder="e.g., Near Seven Hills Flyover, Jalna Road"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    value={propertyFormData.carpetArea || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, carpetArea: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Bedrooms / BHK</label>
                  <input
                    type="number"
                    value={propertyFormData.bedrooms || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, bedrooms: Number(e.target.value) })}
                    placeholder="e.g. 2 or 3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Primary Image URL</label>
                  <input
                    type="text"
                    value={propertyFormData.images?.[0] || ''}
                    onChange={(e) => {
                      const newImages = [...(propertyFormData.images || [])];
                      newImages[0] = e.target.value;
                      setPropertyFormData({ ...propertyFormData, images: newImages });
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                  {propertyFormData.images?.[0] && (
                    <div className="mt-2">
                      <img 
                        src={propertyFormData.images[0]} 
                        alt="Preview" 
                        className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-xs" 
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={propertyFormData.description || ''}
                    onChange={(e) => setPropertyFormData({ ...propertyFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                    placeholder="Key highlights, clear title description, nearby facilities..."
                  />
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-slate-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(propertyFormData.verified)}
                      onChange={(e) => setPropertyFormData({ ...propertyFormData, verified: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Verified by Auricity</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(propertyFormData.zeroBrokerage)}
                      onChange={(e) => setPropertyFormData({ ...propertyFormData, zeroBrokerage: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>0% Brokerage Listing</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(propertyFormData.featured)}
                      onChange={(e) => setPropertyFormData({ ...propertyFormData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingProperty ? 'Update Property' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MANUAL LEAD MODAL */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Record Customer Inquiry</h3>
              <button 
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  placeholder="e.g. Anand Deshmukh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="+91 98220 12345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Preferred Locality</label>
                <select
                  value={newLeadForm.preferredLocality}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, preferredLocality: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                >
                  {localitiesList.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Interested In (Property / Township)</label>
                <input
                  type="text"
                  value={newLeadForm.propertyTitle}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, propertyTitle: e.target.value })}
                  placeholder="e.g. 2 BHK CIDCO or General Inquiry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Budget</label>
                <input
                  type="text"
                  value={newLeadForm.budget}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                  placeholder="e.g. ₹ 45 - 60 Lakhs"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Inquiry Notes</label>
                <textarea
                  rows={2}
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Looking for immediate site visit on Sunday..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
