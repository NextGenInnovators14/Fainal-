export type PropertyType = 
  | 'Apartment' 
  | 'Independent House / Villa' 
  | 'Residential Plot' 
  | 'Commercial Office' 
  | 'Commercial Shop' 
  | 'Industrial / MIDC Plot' 
  | 'Agricultural Land' 
  | 'Penthouse'
  | 'apartment'
  | 'row_house'
  | 'penthouse'
  | 'commercial'
  | 'plot'
  | 'Co-living / PG';

export type FurnishingStatus = 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type FacingDirection = 'East' | 'North' | 'North-East' | 'West' | 'South' | 'South-East' | 'South-West' | 'North-West';
export type ListingType = 'Buy' | 'Rent' | 'Lease' | 'Commercial' | 'Plots' | 'All' | 'sale' | 'rent' | 'pg' | 'commercial' | 'plots';
export type PropertyStatus = 'Active' | 'Pending_Approval' | 'Rejected' | 'Sold' | 'Draft';
export type PostedByType = 'Owner' | 'Broker' | 'Builder';


export type ContactMessageStatus = 'new' | 'read' | 'in_progress' | 'resolved' | 'archived';
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  inquiryType: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface ContactQuickAction {
  id: 'email' | 'phone' | 'whatsapp' | 'visit';
  label: string;
  enabled: boolean;
  value?: string;
}

export interface ContactFaq { question: string; answer: string; visible: boolean; order: number; }

export interface ContactPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  contactSectionTitle: string;
  contactSectionDescription: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  formTitle: string;
  formSubtitle: string;
  inquiryTypes: string[];
  formButtonText: string;
  mapEnabled: boolean;
  mapLocationName: string;
  mapAddress: string;
  mapEmbedUrl: string;
  quickActions: ContactQuickAction[];
  faqTitle: string;
  faqs: ContactFaq[];
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCtaButtonText: string;
  bottomCtaButtonLink: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number; // in INR
  priceDisplay: string; // e.g. "₹88.0 L" or "₹2.45 Cr"
  propertyType: PropertyType;
  type?: PropertyType; // alias
  listingType: ListingType;
  locality: string; // e.g. "CIDCO N-4", "Jalna Road", "Beed Bypass", "AURIC Shendra"
  address: string;
  location?: string; // alias
  city: string; // "Chhatrapati Sambhajinagar"
  carpetArea: number; // in sq.ft
  builtupArea?: number; // in sq.ft
  areaSqFt?: number; // alias
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | string;
  furnishedStatus?: string; // alias
  parking?: 'Covered' | 'Open' | 'None' | '2+ Covered' | string;
  floorNumber?: number;
  totalFloors?: number;
  reraNumber?: string;
  reraApproved: boolean;
  verified: boolean;
  zeroBrokerage: boolean;
  featured: boolean;
  showOnHomepage?: boolean;
  featuredOrder?: number;
  category?: 'Residential' | 'Commercial' | 'Industrial' | 'Plots' | 'Land' | string;
  status: PropertyStatus;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  published?: boolean;
  images: string[];
  amenities: string[];
  ownerContact?: {
    name: string;
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  listedBy?: {
    id?: string;
    name: string;
    type?: string;
    role?: string;
    phone?: string;
  };
  brokerId?: string; // If listed by a registered realtor
  brokerName?: string;
  postedBy: PostedByType | string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  aiEstimatedValue?: {
    minPrice: number;
    maxPrice: number;
    fairPrice: number;
    confidenceScore: number;
    trend: 'Rising' | 'Stable' | 'High Demand' | string;
  };
  readyToMove: boolean;
  possessionDate?: string;
  possession?: string; // alias
  maintenanceMonthly?: number;
  // Dynamic & Helper Compatibility Fields
  priceNumeric?: number;
  pricePerSqFt?: number;
  isZeroBrokerage?: boolean;
  reraRegistered?: boolean;
  bhk?: number;
  facing?: string;
  isFeatured?: boolean;
  floor?: number;
  floorPlanUrl?: string;
  videoUrl?: string;
  shortsUrl?: string;
  contactPerson?: {
    name: string;
    phone: string;
    email?: string;
    role?: string;
    avatar?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  title?: string; // alias
  builderName: string;
  developer?: string; // alias
  locality: string;
  address?: string;
  location?: string; // alias
  city: string;
  priceRange: string;
  minPrice: number;
  startingPrice?: number; // alias
  maxPrice: number;
  configurations: string[]; // e.g. ["2 BHK", "3 BHK", "Luxury Penthouses"]
  reraId?: string;
  reraNumber?: string; // alias
  completionDate?: string;
  possessionDate?: string; // alias
  brochureUrl?: string;
  floorPlanUrl?: string;
  videoUrl?: string;
  shortsUrl?: string;
  bannerImage?: string;
  image?: string; // alias
  images: string[];
  description: string;
  totalArea?: string;
  totalUnits?: number;
  availableUnits?: number;
  featured?: boolean;
  exclusiveOffer?: string; // e.g., "0% Stamp Duty Offer for First 10 Bookings"
  amenities: string[];
  status: 'Pre-Launch' | 'Under Construction' | 'Ready to Move' | 'Newly Launched' | 'Draft' | 'under_construction' | 'ready_to_move' | 'new_launch' | string;
  developerContact?: {
    phone: string;
    email: string;
    salesOffice: string;
  };
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionPlanTier = 'Starter' | 'Pro' | 'Elite' | 'Silver' | 'Gold' | 'Platinum Club' | string;

export interface RealtorPlan {
  id: string;
  name: string;
  tier: string;
  price: number;
  period: 'Monthly' | 'Quarterly' | 'Annual' | 'Forever Free' | string;
  description: string;
  badge?: string;
  featured?: boolean;
  published: boolean;
  subscribersCount?: number;
  limits: {
    listingsQuota: number;
    featuredQuota: number;
    leadsQuota: number;
    projectAccess: boolean;
    digitalCard: boolean;
    trainingAccess: boolean;
    analytics: boolean;
    customSubdomain: boolean;
  };
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BrokerReview {
  id: string;
  brokerId: string;
  brokerName?: string;
  userName?: string;
  clientName: string;
  userPhone?: string;
  clientPhone?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  transactionType?: string; // e.g. 'Home Purchase', 'Commercial Space', 'Collector NA Plot', 'Rental / Lease', 'Investment Advisory'
  comment?: string;
  reviewText: string;
  status: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  verifiedDeal?: boolean;
  createdAt: string;
  approvedAt?: string;
}

export interface RealtorNotification {
  id: string;
  realtorId: string;
  title: string;
  message: string;
  type: 'kyc_status' | 'property_approval' | 'property_rejected' | 'lead_assigned' | 'project_assigned' | 'site_visit' | 'plan_payment' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ProjectBrokerAssignment {
  id: string;
  projectId: string;
  projectName: string;
  brokerId: string;
  brokerName: string;
  assignedAt: string;
  status: 'Active' | 'Revoked';
  leadsGenerated?: number;
  notes?: string;
}

export interface Realtor {
  id: string;
  name: string;
  agencyName: string;
  specialty?: string;
  email: string;
  phone: string;
  whatsapp: string;
  reraNumber: string;
  experienceYears: number;
  areasCovered: string[];
  operatingTerritories?: string[];
  specialties?: string[];
  city?: string;
  locality?: string;
  plan: SubscriptionPlanTier;
  planTier?: SubscriptionPlanTier;
  planExpiry: string;
  kycStatus: 'Verified' | 'Pending' | 'Under_Review' | 'Under Review' | 'Pending Review' | 'Approved' | 'Rejected' | 'Suspended' | string;
  verifiedBadge?: boolean;
  showOnHomepage?: boolean;
  featuredOrder?: number;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  adminNotes?: string;
  documents?: {
    idProof?: string;
    reraCert?: string;
    addressProof?: string;
    businessProof?: string;
    otherDoc?: string;
  };
  documentFiles?: {
    name: string;
    type: string;
    url: string;
    submittedAt?: string;
    verified?: boolean;
  }[];
  activeListingsCount: number;
  listingsQuota: number;
  totalDeals: number;
  rating: number;
  reviewsCount: number;
  avatar: string;
  bio: string;
  slug: string;
  assignedProjectIds?: string[];
  websiteConfig: {
    enabled: boolean;
    heroTitle: string;
    tagline: string;
    themeColor: string;
    aboutText: string;
    servicesOffered: string[];
    customDomain?: string;
    slug?: string;
    primaryColor?: string;
    whatsappEnabled?: boolean;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  joinedDate: string;
}

export interface ClubCardItem {
  id: 'realtors_club' | 'affiliate_partner' | string;
  heading: string;
  subheading?: string;
  tagline?: string;
  badgeText?: string;
  benefits: string[];
  buttonText: string;
  buttonLink: string; // e.g. 'broker-hub', 'affiliate-modal', 'post-property', 'contact'
}

export interface ClubCardsConfig {
  sectionTitle?: string;
  sectionSubtitle?: string;
  realtorsClub: ClubCardItem;
  affiliatePartner: ClubCardItem;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Site Visit' | 'Negotiation' | 'Won' | 'Lost' | 'Site_Visit_Scheduled' | 'Site_Visit_Completed' | 'Closed_Won' | 'Closed_Lost' | 'new' | 'contacted' | 'site_visit_scheduled' | 'negotiation' | 'closed' | 'lost' | string;

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  customerName?: string;
  clientName?: string;
  phone?: string;
  clientPhone?: string;
  email?: string;
  clientEmail?: string;
  city?: string;
  locality?: string;
  area?: string;
  requirement?: string;
  preferredContactMethod?: 'Phone' | 'WhatsApp' | 'Email';
  preferredDate?: string;
  status: 'New' | 'In_Progress' | 'Completed' | 'Cancelled';
  assignedProviderId?: string;
  assignedProviderName?: string;
  amount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  type: 'Note' | 'Call' | 'WhatsApp' | 'Site Visit' | 'Negotiation' | string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyId?: string;
  propertyTitle?: string;
  budget?: string;
  budgetMax?: number;
  leadType?: ListingType;
  preferredLocality?: string;
  localityPreference?: string; // alias
  status: LeadStatus;
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  siteVisitDate?: string;
  siteVisitTime?: string;
  source?: 'Website Inflow' | 'Website Search' | 'Property Inquiry' | 'Site Visit Form' | 'Valuation Tool' | 'Direct Call' | 'Digital Card' | string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  realtorId: string;
  realtorName: string;
  planName: SubscriptionPlanTier | 'Property Boost' | 'KYC Verification';
  amount: number;
  currency: string;
  status: 'Success' | 'Pending' | 'Failed';
  gateway: 'Razorpay' | 'Cashfree';
  paymentMethod: string;
  timestamp: string;
  invoiceNumber: string;
}

export interface DltSmsTemplate {
  id: string;
  templateName: string;
  dltTemplateId: string;
  senderId: string;
  category: 'OTP' | 'Lead_Alert' | 'Visit_Confirmation' | 'Moderation_Status' | 'Subscription';
  messagePattern: string;
  active: boolean;
}

export interface DltSmsLog {
  id: string;
  templateId: string;
  recipientPhone: string;
  content: string;
  status: 'Delivered' | 'Submitted' | 'Failed';
  timestamp: string;
  dltReferenceId: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  name?: string; // alias
  tagline?: string; // alias
  category: string;
  priceDisplay?: string;
  priceEstimate?: string; // alias
  startingFee?: string;
  basePrice?: number;
  price?: number; // alias
  estimatedDays?: string;
  turnaroundDays?: number; // alias
  turnaroundTime?: string; // alias
  shortDescription?: string;
  description: string;
  fullDescription?: string;
  detailedDescription?: string; // alias
  benefits?: string[];
  features?: string[];
  deliverables?: string[]; // alias
  process?: string[];
  processSteps?: { title: string; description: string }[];
  image?: string;
  bannerImage?: string;
  iconName?: string;
  ctaText?: string;
  seoTitle?: string;
  seoDescription?: string;
  order?: number;
  published: boolean;
  popular?: boolean;
  isPopular?: boolean; // alias
  faqs?: { question: string; answer: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceProviderStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface ServiceProviderRegistration {
  id: string;
  name: string; // Full Name
  businessName?: string; // Business / Company Name
  serviceId?: string; // Reference to ServiceItem ID
  serviceCategory: string;
  serviceType?: string; // alias
  phone: string;
  email: string;
  experienceYears: number;
  officeAddress: string;
  city: string;
  locality?: string;
  area?: string;
  description?: string;
  bio?: string; // alias
  submittedDetails?: string;
  documents?: string[];
  portfolioUrl?: string;
  website?: string;
  additionalInfo?: string;
  registrationDate: string;
  status: ServiceProviderStatus;
  rating?: number;
  verifiedBadge?: boolean;
  published?: boolean;
  notes?: string;
  updatedAt?: string;
  approvedAt?: string;
}

export type ReferralStatus = 'new' | 'under_review' | 'verified' | 'assigned' | 'listed' | 'closed' | 'rejected';

export interface PropertyReferral {
  id: string;
  referrerName: string;
  referrerPhone: string;
  referrerEmail?: string;
  propertyType: PropertyType | string;
  location: string;
  locality: string;
  ownerName?: string;
  ownerPhone?: string;
  approxPrice?: string;
  estimatedValue?: string; // alias
  listingNature?: 'Sale' | 'Rent' | 'Lease';
  propertyImages?: string[];
  additionalDetails: string;
  notes?: string;
  submittedAt: string;
  status: ReferralStatus;
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  linkedPropertyId?: string;
  dealStatus?: 'Open' | 'In Negotiation' | 'Agreement Executed' | 'Closed' | 'Dropped';
  dealAmount?: number;
  commissionAmount?: number;
  referralReward?: number;
  brokerShare?: number;
  payoutStatus?: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
  adminNotes?: string;
  outcomeNotes?: string;
  commissionOutcome?: string;
  updatedAt?: string;
}

export type OfferStatus = 'draft' | 'scheduled' | 'published' | 'paused' | 'expired' | 'archived';
export type OfferDiscountType = 'percentage' | 'fixed' | 'none';
export type OfferCtaType = 'detail' | 'internal' | 'external' | 'claim' | 'contact' | 'whatsapp' | 'phone' | 'booking';

export interface OfferFaq { question: string; answer: string; }
export interface OfferCategory { id: string; name: string; slug: string; description?: string; image?: string; icon?: string; displayOrder: number; active: boolean; }
export interface OfferClaim { id: string; offerId: string; userId?: string; name: string; email: string; phone: string; message?: string; status: 'new'|'contacted'|'converted'|'closed'; createdAt: string; }
export interface OfferAnalyticsEvent { id: string; offerId: string; eventType: 'view'|'cta_click'|'claim'|'booking'|'conversion'; userId?: string; sessionId?: string; createdAt: string; }
export interface OffersPageConfig { heroTitle: string; heroSubtitle: string; heroImage?: string; featuredTitle: string; featuredLimit: number; listTitle: string; sections: Array<{id:string;title:string;description?:string;visible:boolean;displayOrder:number}>; footerTitle?: string; footerDescription?: string; footerCtaText?: string; footerCtaType?: OfferCtaType; footerCtaValue?: string; }

export interface OfferItem {
  id: string; title: string; slug?: string; subtitle?: string; tag?: string; discountTag?: string; discountValue?: string; discountType?: OfferDiscountType;
  shortDescription?: string; description?: string; categoryId?: string; categoryName?: string; subcategory?: string; providerId?: string; providerName?: string; providerDescription?: string; location?: string; serviceArea?: string;
  originalPrice?: number; offerPrice?: number; currency?: string; hidePricing?: boolean; mainImage?: string; imageUrl?: string; bannerUrl?: string; gallery?: string[]; videoUrl?: string;
  validTill?: string; startAt?: string; endAt?: string; startTime?: string; endTime?: string; availability?: string;
  whatsIncluded?: string; whatsExcluded?: string; eligibility?: string; howToRedeem?: string; bookingInstructions?: string; cancellationPolicy?: string; terms?: string|string[]; faqs?: OfferFaq[];
  ctaText?: string; ctaType?: OfferCtaType; ctaValue?: string; status?: OfferStatus; published: boolean; featured?: boolean; featuredOrder?: number; views?: number; claims?: number; conversions?: number;
  seoTitle?: string; metaDescription?: string; socialShareImage?: string; createdAt?: string; updatedAt?: string;
  projectId?: string; projectName?: string; applicableProjectId?: string; applicableProjectName?: string; applicableProjects?: string[]; applicableLocalities?: string[]; bannerBg?: string;
}

export interface TrainingBlog {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  summary?: string;
  content: string;
  category: 'MahaRERA Compliance' | 'Sales Mastery' | 'Digital Marketing' | 'Client Negotiations' | 'Documentation & Title Search' | 'MahaRERA Legal Rights' | 'Market Trends' | 'Investment Guides' | 'Sales Strategy' | 'RERA Compliance' | 'Client Handling' | 'Marketing Mastery' | 'AURIC Industrial' | string;
  author: string;
  authorRole?: string;
  readTimeMinutes?: number;
  readingTime?: string;
  readTime?: string;
  coverImage: string;
  publishedAt?: string;
  publishDate?: string;
  published?: boolean;
  tags?: string[];
  difficultyLevel?: string;
  targetAudience?: 'public' | 'realtor_academy';
  downloadableResourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteContentConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  brandTagline?: string;
  companyName?: string;
  supportPhone?: string;
  contactPhone?: string;
  whatsappPhone?: string;
  supportEmail?: string;
  contactEmail?: string;
  officeAddress?: string;
  announcementActive?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string;
  featuredLocalities?: string[];
  promoBannerText?: string;
  promoBannerHeading?: string;
  promoBannerDescription?: string;
  promoBannerActive?: boolean;
  legalDisclaimer?: string;
  statsCounter?: {
    propertiesListed?: string;
    happyFamilies?: string;
    activeRealtors?: string;
    brokerageSaved?: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'Market Trends' | 'Buyer Guide' | 'Legal & RERA' | 'Broker Academy' | 'AURIC & Infrastructure' | string;
  author: string;
  authorRole: string;
  readTimeMinutes: number;
  coverImage: string;
  publishedAt: string;
  published: boolean;
  tags: string[];
}

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  lastUpdated: string;
  version: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export interface PlatformSettings {
  superAdminPin: string;
  portalName: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  brandTagline?: string;
  referralWhatsappNumber?: string;
  referralDeskPhone?: string;
  enableAiAssistant?: boolean;
  enableDltSms?: boolean;
  enableWhatsAppAlerts?: boolean;
  enableAiValuation?: boolean;
  platformCommissionPercentage?: number;
  zeroBrokerageFee?: number;
  valuationBaselines?: {
    baseSqFtRate?: Record<string, number>;
  };
  paymentGateway: {
    activeProvider: 'Razorpay' | 'Cashfree';
    testMode: boolean;
    razorpayKeyId: string;
    cashfreeAppId: string;
  };
  dltConfig: {
    defaultSenderId: string;
    entityId: string;
    smsGatewayActive: boolean;
  };
  enableInstantWhatsapp: boolean;
  autoApproveVerifiedBrokers: boolean;
  aiValuationSettings?: {
    avgBaseRatePerSqft: number;
    appreciationFactorAnnual: number;
    localityMultipliers: Record<string, number>;
  };
}

export type AppSettings = PlatformSettings | {
  adminPin: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  zeroBrokerageBadgeEnabled?: boolean;
  requirePhoneForLeads?: boolean;
  [key: string]: any;
};

export type UserProfile = AuthUser;

export interface PropertyFilterParams {
  query?: string;
  locality?: string;
  listingType?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bhk?: number;
  zeroBrokerageOnly?: boolean;
}

export type UserRole = 'customer' | 'realtor' | 'service_provider' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  locality?: string;
  // Broker specific
  realtorId?: string;
  agencyName?: string;
  reraNumber?: string;
  kycStatus?: 'Verified' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended' | string;
  // Service provider specific
  providerId?: string;
  serviceCategory?: string;
  businessName?: string;
  providerStatus?: ServiceProviderStatus;
  // Intent & preferences
  intent?: 'Buy' | 'Rent' | 'Sell' | 'Invest' | string;
  savedProperties?: string[];
  createdAt: string;
  isVerified?: boolean;
}

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'admin-login' | 'otp-verify';

export interface BrokerAccessRequest {
  id: string;
  brokerId: string;
  brokerName: string;
  agencyName?: string;
  phone: string;
  email: string;
  reraNumber?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  adminNotes?: string;
}

export interface BrokerDirectMessage {
  id: string;
  brokerId: string;
  brokerName: string;
  senderRole: 'broker' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface KnowledgeHubConfig {
  titleCard: {
    badge: string;
    heading: string;
    subheading: string;
    description: string;
    ctaText: string;
    ctaView: string;
  };
  card1Broker: {
    title: string;
    badge: string;
    description: string;
    coverImage: string;
    buttonTextNotLoggedIn: string;
    buttonTextRequestAccess: string;
    buttonTextPending: string;
    buttonTextApproved: string;
  };
  card2BuyersGuide: {
    title: string;
    badge: string;
    description: string;
    coverImage: string;
    buttonText: string;
  };
  card3TrendsNews: {
    title: string;
    badge: string;
    description: string;
    coverImage: string;
    buttonText: string;
  };
}

export type ActiveView = 
  | 'home'
  | 'about'
  | 'contact'
  | 'properties'
  | 'projects'
  | 'property-detail'
  | 'project-detail'
  | 'services'
  | 'loan'
  | 'service-detail'
  | 'service-register'
  | 'referrals'
  | 'valuation'
  | 'realtors'
  | 'realtor-landing'
  | 'realtor-register'
  | 'realtor-portal'
  | 'realtor-site'
  | 'realtor-card'
  | 'realtor-desk'
  | 'realtor-dashboard'
  | 'realtor-minisite'
  | 'admin-hub'
  | 'admin-login'
  | 'broker-hub'
  | 'broker-knowledge-hub'
  | 'knowledge-hub'
  | 'auth'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'blogs'
  | 'legal'
  | 'compare'
  | 'mortgage-calculator'
  | 'mortgage-calc';

export type AdminModuleTab = 
  | 'dashboard'
  | 'overview'
  | 'pages'
  | 'media'
  | 'properties'
  | 'projects'
  | 'offers'
  | 'realtors'
  | 'leads'
  | 'services'
  | 'service-providers'
  | 'referrals'
  | 'blogs'
  | 'training-blogs'
  | 'banners'
  | 'navigation'
  | 'payments'
  | 'plans'
  | 'theme'
  | 'website'
  | 'website-content'
  | 'ai-settings'
  | 'legal'
  | 'settings';

export type MediaType = 'image' | 'floorplan' | 'video' | 'shorts' | 'document';

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: MediaType;
  category: string; // e.g. "Project: Adroit Utopia", "Category: Painting Service", "Hero Banners", "Floorplans", "Reels"
  tags: string[];
  fileSize?: string;
  uploadedAt: string;
  dimensions?: string;
  description?: string;
}

export interface BannerAdItem {
  id: string;
  tag: string;
  tagBg: string;
  title: string;
  subtitle: string;
  desc: string;
  ctaText: string;
  ctaActionType?: 'view' | 'emi_modal' | 'post_property' | 'whatsapp' | 'external';
  ctaLink?: string;
  bgGradient: string;
  titleColor: string;
  subtitleColor: string;
  descColor: string;
  badge: string;
  badgeStyle: string;
  image: string;
  active: boolean;
  order: number;
}

export interface CmsPageSection {
  id: string;
  name: string;
  heading?: string;
  subheading?: string;
  badge?: string;
  bodyText?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  videoUrl?: string;
  items?: any[];
  customFields?: Record<string, any>;
}

export interface CmsPageData {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  lastUpdated: string;
  sections: Record<string, CmsPageSection>;
}

export interface NavSubItem {
  id: string;
  label: string;
  viewOrUrl: string;
  filterParam?: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  viewOrUrl: string;
  isDropdown?: boolean;
  subItems?: NavSubItem[];
  order: number;
  published: boolean;
  badge?: string;
}

export interface PartnerLogoItem {
  id: string;
  name: string;
  category: 'app_store' | 'bank' | 'payment' | 'compliance';
  imageUrl?: string;
  linkUrl?: string;
  subtext?: string;
}

export interface NavigationConfig {
  topBarBadge: string;
  topBarText: string;
  topBarPhone: string;
  topAnnouncementPillText?: string;
  topAnnouncementPillAction?: string;
  joinAuricityText?: string;
  joinAuricityLink?: string;
  headerButtonText: string;
  headerPhoneText?: string;
  headerPhoneDisplay?: string;
  loanButtonText?: string;
  loanButtonLink?: string;
  navItems?: NavMenuItem[];
  footerTagline: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  companyAddress?: string;
  rocCin?: string;
  panNo?: string;
  contactPhones?: string[];
  contactEmails?: string[];
  disclaimerText?: string;
  copyrightText?: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    whatsapp: string;
    twitter?: string;
  };
  partnerLogos?: PartnerLogoItem[];
  footerCorporateLinks?: { id: string; label: string; viewOrUrl: string; isExternal?: boolean }[];
  footerColumns: {
    id: string;
    title: string;
    links: { label: string; viewOrUrl: string; isExternal?: boolean }[];
  }[];
}

export type SpottedPropertyStatus = 
  | 'new'
  | 'contacted_owner'
  | 'converted_listing'
  | 'deal_closed'
  | 'bounty_paid'
  | 'rejected';

export interface SpottedProperty {
  id: string;
  spottedAt: string;
  status: SpottedPropertyStatus;
  photoUrl: string;
  locality: string;
  landmark?: string;
  propertyType: string;
  listingPurpose: 'rent' | 'sale' | 'lease';
  expectedPriceOrRent?: string;
  boardContactNumber: string;
  boardContactName?: string;
  notes?: string;
  spotter: {
    name: string;
    mobile: string;
    upiId?: string;
    affiliateId?: string;
    email?: string;
  };
  adminReview?: {
    reviewedAt?: string;
    reviewedBy?: string;
    adminNotes?: string;
    bountyAmount?: number;
    bountyStatus?: 'pending' | 'approved' | 'paid' | 'ineligible';
    bountyPaymentRef?: string;
    convertedPropertyId?: string;
  };
}

