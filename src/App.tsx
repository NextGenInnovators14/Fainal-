import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CategoryPills } from './components/layout/CategoryPills';
import { BottomStickyBar } from './components/layout/BottomStickyBar';

// 19 Complete Home Sections
import { HomePageCanvas } from './components/home/HomePageCanvas';

// Full Sub-Pages / Views
// Only HomePageCanvas loads eagerly — it's what every first-time visitor
// sees. Everything else below used to be a top-level static import, which
// meant a visitor who only ever looks at the homepage was still downloading
// the code for property listings, the services catalog, the AI valuator,
// the broker hub, every CMS admin screen, etc. before first paint. Routing
// them all through React.lazy() means each one is only fetched the moment
// its route is actually opened.
const PropertyListingsView = lazy(() => import('./components/properties/PropertyListingsView').then(m => ({ default: m.PropertyListingsView })));
const PostPropertyView = lazy(() => import('./components/properties/PostPropertyView').then(m => ({ default: m.PostPropertyView })));
const HomeServicesView = lazy(() => import('./components/services/HomeServicesView').then(m => ({ default: m.HomeServicesView })));
const ServiceProviderPortal = lazy(() => import('./components/services/ServiceProviderPortal').then(m => ({ default: m.ServiceProviderPortal })));
const ProjectsListingsView = lazy(() => import('./components/projects/ProjectsListingsView').then(m => ({ default: m.ProjectsListingsView })));
const SuperAdminHub = lazy(() => import('./components/admin/SuperAdminHub').then(m => ({ default: m.SuperAdminHub })));
const BrokerHub = lazy(() => import('./components/broker/BrokerHub').then(m => ({ default: m.BrokerHub })));
const BrokerPortal = lazy(() => import('./components/broker/BrokerPortal').then(m => ({ default: m.BrokerPortal })));
const AffiliatePortal = lazy(() => import('./components/affiliate/AffiliatePortal').then(m => ({ default: m.AffiliatePortal })));
const AIValuatorView = lazy(() => import('./components/ai/AIValuatorView').then(m => ({ default: m.AIValuatorView })));
const BrokerKnowledgeHubView = lazy(() => import('./components/broker/BrokerKnowledgeHubView').then(m => ({ default: m.BrokerKnowledgeHubView })));
const KnowledgeHubView = lazy(() => import('./components/knowledge/KnowledgeHubView').then(m => ({ default: m.KnowledgeHubView })));
const RealtorsDirectoryView = lazy(() => import('./components/properties/RealtorsDirectoryView').then(m => ({ default: m.RealtorsDirectoryView })));
const AboutUsView = lazy(() => import('./components/about/AboutUsView').then(m => ({ default: m.AboutUsView })));
const PropertyDetailView = lazy(() => import('./components/properties/PropertyDetailView').then(m => ({ default: m.PropertyDetailView })));
const ServiceDetailView = lazy(() => import('./components/services/ServiceDetailView').then(m => ({ default: m.ServiceDetailView })));
const OffersPortal = lazy(() => import('./components/offers/OffersPortal').then(m => ({ default: m.OffersPortal })));
const CmsPageView = lazy(() => import('./components/common/CmsPageView').then(m => ({ default: m.CmsPageView })));
const ContactPage = lazy(() => import('./components/contact/ContactPage').then(m => ({ default: m.ContactPage })));
const AccountAuthPortal = lazy(() => import('./components/auth/AccountAuthPortal').then(m => ({ default: m.AccountAuthPortal })));

// Common Overlays & Modals
import { ToastContainer } from './components/common/ToastContainer';
import { FloatingWhatsAppButton } from './components/common/FloatingWhatsAppButton';
import { SuperAdminPinModal } from './components/common/SuperAdminPinModal';
import { IconSystemModal } from './components/common/IconSystemModal';
import { FeaturesQuickMenuModal } from './components/common/FeaturesQuickMenuModal';
import { EMICalculatorModal } from './components/common/EMICalculatorModal';
import { AffiliateModal } from './components/common/AffiliateModal';
import { AdvertiseModal } from './components/common/AdvertiseModal';

const PageLoadingSkeleton: React.FC = () => (
  <div className="min-h-[45vh] bg-[var(--background)] px-4 py-10" role="status" aria-live="polite" aria-label="Loading page">
    <div className="mx-auto max-w-7xl animate-pulse space-y-5">
      <div className="h-8 w-56 rounded-xl bg-slate-200/80" />
      <div className="h-4 w-96 max-w-full rounded bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0,1,2].map(i => <div key={i} className="h-52 rounded-3xl border border-slate-200 bg-slate-100/80" />)}
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { activeView, setActiveView, cmsPages, selectedPropertyId, selectedProjectId, selectedServiceId } = useApp();
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const [emiModalOpen, setEmiModalOpen] = useState(false);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [advertiseModalOpen, setAdvertiseModalOpen] = useState(false);

  // Scroll to top on view changes.
  //
  // This used to depend on [activeView] alone. Tapping a "Similar
  // Properties" card from inside a property detail page navigates to a
  // DIFFERENT property, but activeView stays 'property-detail' the whole
  // time — only selectedPropertyId changes. Since the effect's dependency
  // never changed, it never re-ran, so the new property's page rendered at
  // whatever scroll position the previous one was left at — exactly the
  // "screen loads already scrolled down to the footer" bug. Same issue
  // applies to jumping between projects/services. Including the selected
  // id fixes it for all three without touching every place that navigates.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView, selectedPropertyId, selectedProjectId, selectedServiceId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200 pb-16 md:pb-0">
      
      {/* 1. Navbar: Global Clean Multi-level Navigation Header */}
      <Navbar 
        onOpenIconModal={() => setIconModalOpen(true)} 
        onOpenFeaturesMenu={() => setFeaturesMenuOpen(true)}
        onOpenEMIModal={() => setEmiModalOpen(true)}
      />

      {/* 2. Category bar / pills: Clean 10 Category Sub-Navigation Bar */}
      <CategoryPills 
        onOpenFeaturesMenu={() => setFeaturesMenuOpen(true)}
        onOpenEMIModal={() => setEmiModalOpen(true)}
      />

      {/* Dynamic View Routing */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Suspense fallback={<PageLoadingSkeleton />}>
        {activeView === 'home' && (
          <HomePageCanvas
            onOpenEMIModal={() => setEmiModalOpen(true)}
            onOpenAffiliateModal={() => setActiveView('affiliate-landing')}
            onOpenAdvertiseModal={() => setAdvertiseModalOpen(true)}
          />
        )}

        {activeView === 'properties' && (
          <PropertyListingsView titleOverride="Properties for Sale in Chhatrapati Sambhajinagar" />
        )}

        {activeView === 'projects' && (<ProjectsListingsView />)}

        {activeView === 'commercial' && (
          <PropertyListingsView categoryFilter="commercial" titleOverride="Commercial Shops, Showrooms & Offices in Sambhajinagar" />
        )}

        {activeView === 'plots' && (
          <PropertyListingsView categoryFilter="plots" titleOverride="NA Plots & Sanctioned Land Parcels in Sambhajinagar" />
        )}

        {activeView === 'rentals' && (
          <PropertyListingsView typeFilter="rent" titleOverride="Direct Owner Rental Homes in Sambhajinagar" />
        )}

        {activeView === 'pgs' && (
          <PropertyListingsView typeFilter="pg" titleOverride="PG, Hostels & Co-Living in Sambhajinagar" />
        )}

        {activeView === 'about' && (
          <AboutUsView />
        )}

        {(activeView === 'property-detail' || activeView === 'project-detail') && (
          <PropertyDetailView />
        )}

        {activeView === 'service-detail' && (
          <ServiceDetailView />
        )}

        {activeView === 'services' && (<HomeServicesView />)}

        {activeView === 'service-provider' && (<ServiceProviderPortal mode="landing" />)}
        {activeView === 'service-provider-register' && (<ServiceProviderPortal mode="register" />)}
        {activeView === 'service-provider-status' && (<ServiceProviderPortal mode="status" />)}
        {activeView === 'service-provider-admin' && (<ServiceProviderPortal mode="admin" />)}

        {activeView === 'offers' && <OffersPortal mode="landing" />}
        {activeView === 'offer-detail' && <OffersPortal mode="detail" />}

        {activeView === 'blogs' && (
          <KnowledgeHubView />
        )}

        {activeView === 'contact' && <ContactPage />}

        {activeView === 'register' && <AccountAuthPortal mode="register" />}
        {activeView === 'signin' && <AccountAuthPortal mode="signin" />}

        {activeView === 'legal' && (
          <AboutUsView />
        )}

        {activeView === 'valuator' && (
          <AIValuatorView />
        )}

        {activeView === 'post-property' && (
          <PostPropertyView />
        )}

        {activeView === 'realtors' && (
          <RealtorsDirectoryView />
        )}

        {activeView === 'knowledge-hub' && (
          <KnowledgeHubView />
        )}

        {activeView === 'broker-knowledge-hub' && (
          <BrokerKnowledgeHubView />
        )}

        {activeView === 'admin-hub' && (
          <SuperAdminHub />
        )}

        {activeView === 'broker-hub' && (
          <BrokerHub />
        )}

        {activeView === 'broker-landing' && <BrokerPortal mode="landing" />}
        {activeView === 'broker-register' && <BrokerPortal mode="register" />}
        {activeView === 'broker-status' && <BrokerPortal mode="status" />}
        {activeView === 'broker-dashboard' && <BrokerPortal mode="dashboard" />}
        {activeView === 'broker-admin' && <BrokerPortal mode="admin" />}

        {activeView === 'affiliate-landing' && <AffiliatePortal mode="landing" />}
        {activeView === 'affiliate-register' && <AffiliatePortal mode="register" />}
        {activeView === 'affiliate-status' && <AffiliatePortal mode="status" />}
        {activeView === 'affiliate-dashboard' && <AffiliatePortal mode="dashboard" />}
        {activeView === 'affiliate-admin' && <AffiliatePortal mode="admin" />}

        {cmsPages?.[activeView] && !['home','properties','projects','commercial','plots','rentals','pgs','about','property-detail','project-detail','service-detail','services','offers','offer-detail','blogs','contact','legal','valuator','post-property','realtors','knowledge-hub','broker-knowledge-hub','admin-hub','broker-hub','register','signin'].includes(activeView) && (
          <CmsPageView pageId={activeView} />
        )}
        </Suspense>
      </main>

      {/* 19. Footer: Multi-column links, localities, company info, MahaRERA disclaimer, back to top */}
      <Footer onOpenIconModal={() => setIconModalOpen(true)} />

      {/* 18. Bottom Sticky Bar: Clean evenly spaced mobile navigation */}
      {activeView !== 'admin-hub' && <BottomStickyBar onOpenFeaturesMenu={() => setFeaturesMenuOpen(true)} />}

      {/* Mobile + desktop direct conversion actions */}
      {activeView !== 'admin-hub' && <FloatingWhatsAppButton />}

      {/* Global Overlays & Modals */}
      <ToastContainer />
      <SuperAdminPinModal />
      <IconSystemModal isOpen={iconModalOpen} onClose={() => setIconModalOpen(false)} />
      <FeaturesQuickMenuModal 
        isOpen={featuresMenuOpen} 
        onClose={() => setFeaturesMenuOpen(false)}
        onOpenEMIModal={() => setEmiModalOpen(true)}
        onOpenIconModal={() => setIconModalOpen(true)}
        onOpenAffiliateModal={() => setActiveView('affiliate-landing')}
        onOpenAdvertiseModal={() => setAdvertiseModalOpen(true)}
      />
      <EMICalculatorModal 
        isOpen={emiModalOpen} 
        onClose={() => setEmiModalOpen(false)} 
      />
      <AffiliateModal 
        isOpen={affiliateModalOpen} 
        onClose={() => setAffiliateModalOpen(false)} 
      />
      <AdvertiseModal 
        isOpen={advertiseModalOpen} 
        onClose={() => setAdvertiseModalOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
