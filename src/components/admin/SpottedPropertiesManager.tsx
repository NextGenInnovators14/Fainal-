import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  DollarSign, 
  MessageSquare, 
  ExternalLink, 
  Building2, 
  Clock, 
  User, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowUpRight, 
  Wallet,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { SpottedProperty, SpottedPropertyStatus, Property } from '../../types';
import { 
  loadSpottedProperties, 
  saveSpottedProperties, 
  updateSpottedProperty, 
  deleteSpottedProperty 
} from '../../services/spottedPropertiesStore';
import { useApp } from '../../context/AppContext';

export const SpottedPropertiesManager: React.FC = () => {
  const { showToast, addProperty } = useApp();
  const [items, setItems] = useState<SpottedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<SpottedProperty | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // Edit states for modal
  const [adminNote, setAdminNote] = useState('');
  const [bountyAmount, setBountyAmount] = useState<number>(0);
  const [bountyStatus, setBountyStatus] = useState<'pending' | 'approved' | 'paid' | 'ineligible'>('pending');
  const [bountyPaymentRef, setBountyPaymentRef] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const data = await loadSpottedProperties();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items
  const filtered = items.filter(item => {
    const matchSearch = !search || 
      item.locality.toLowerCase().includes(search.toLowerCase()) ||
      (item.landmark && item.landmark.toLowerCase().includes(search.toLowerCase())) ||
      item.boardContactNumber.includes(search) ||
      item.spotter.name.toLowerCase().includes(search.toLowerCase()) ||
      item.spotter.mobile.includes(search) ||
      (item.spotter.affiliateId && item.spotter.affiliateId.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats calculation
  const totalSpots = items.length;
  const newSpots = items.filter(i => i.status === 'new').length;
  const contactedSpots = items.filter(i => i.status === 'contacted_owner').length;
  const convertedSpots = items.filter(i => i.status === 'converted_listing' || i.status === 'deal_closed' || i.status === 'bounty_paid').length;
  const totalBountyAllocated = items.reduce((sum, i) => sum + (i.adminReview?.bountyAmount || 0), 0);

  const handleStatusChange = async (item: SpottedProperty, newStatus: SpottedPropertyStatus) => {
    const updated = await updateSpottedProperty(item.id, { 
      status: newStatus,
      adminReview: {
        ...(item.adminReview || {}),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Super Admin'
      }
    });
    setItems(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, status: newStatus });
    }
    showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
  };

  const handleSaveReview = async () => {
    if (!selectedItem) return;
    const updated = await updateSpottedProperty(selectedItem.id, {
      adminReview: {
        ...(selectedItem.adminReview || {}),
        adminNotes: adminNote,
        bountyAmount: Number(bountyAmount) || 0,
        bountyStatus,
        bountyPaymentRef: bountyPaymentRef || undefined,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Super Admin'
      }
    });
    setItems(updated);
    setSelectedItem(null);
    showToast('Review & Bounty details saved successfully.', 'success');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spotted property lead?')) return;
    const updated = await deleteSpottedProperty(id);
    setItems(updated);
    if (selectedItem?.id === id) setSelectedItem(null);
    showToast('Spotted property lead deleted.', 'info');
  };

  // 1-Click Convert to Live Auricity Property
  const handleConvertToProperty = async (item: SpottedProperty) => {
    const propId = `prop-spot-${Date.now()}`;
    const newProp: Property = {
      id: propId,
      title: `${item.propertyType} in ${item.locality}`,
      propertyType: item.propertyType.toLowerCase().includes('shop') ? 'commercial' :
                    item.propertyType.toLowerCase().includes('flat') ? 'apartment' :
                    item.propertyType.toLowerCase().includes('plot') ? 'plot' : 'commercial',
      listingType: item.listingPurpose === 'rent' ? 'rent' : 'sale',
      locality: item.locality,
      landmark: item.landmark || 'Main Road',
      price: item.listingPurpose === 'rent' ? 25000 : 5000000,
      pricePerSqFt: 5500,
      builtUpArea: 450,
      carpetArea: 380,
      bedrooms: item.propertyType.includes('2 BHK') ? 2 : item.propertyType.includes('3 BHK') ? 3 : 0,
      bathrooms: 1,
      balconies: 1,
      furnishingStatus: 'semi-furnished',
      facingDirection: 'East',
      propertyStatus: 'Active',
      postedByType: 'Owner',
      contactPhone: item.boardContactNumber,
      contactPerson: {
        name: item.boardContactName || 'Property Owner',
        phone: item.boardContactNumber,
        role: (item.boardContactRole as any) || 'Owner'
      },
      description: `Spotted on street: ${item.notes || 'Verified property available in ' + item.locality}. Board contact: ${item.boardContactNumber}. Landmark: ${item.landmark}.`,
      featuredImage: item.photoUrl,
      images: [item.photoUrl],
      amenities: ['24/7 Water', 'Road Facing', 'Power Backup'],
      isFeatured: false,
      isVerified: true,
      createdDate: new Date().toISOString().split('T')[0]
    };

    addProperty(newProp);
    const updated = await updateSpottedProperty(item.id, {
      status: 'converted_listing',
      adminReview: {
        ...(item.adminReview || {}),
        convertedPropertyId: propId,
        adminNotes: (item.adminReview?.adminNotes || '') + `\n[Converted to live listing ID: ${propId}]`
      }
    });
    setItems(updated);
    showToast(`🎉 Converted to live Auricity listing: "${newProp.title}"`, 'success');
  };

  // WhatsApp helper
  const openWhatsApp = (phone: string, text: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const full = clean.startsWith('91') || clean.length > 10 ? clean : `91${clean}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status: SpottedPropertyStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200">New Lead (नवीन)</span>;
      case 'contacted_owner':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">Owner Contacted</span>;
      case 'converted_listing':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200">Converted to Listing</span>;
      case 'deal_closed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">Deal Closed (Bounty Due)</span>;
      case 'bounty_paid':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white font-black">Bounty Paid via UPI</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-200">Rejected / Duplicate</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-50 text-[#214E9B]">
                <Camera className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">
                📸 Spot & Earn / Street Scout Management
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Properties spotted by affiliates and citizens across Chhatrapati Sambhajinagar with "To-Let" or "For Sale" boards. Verify owner details, convert to live listings, and distribute UPI cash bounties upon closed deals.
            </p>
          </div>

          <button
            onClick={fetchItems}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Leads</span>
          </button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-black text-slate-500 block">Total Spotted</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{totalSpots}</span>
            <span className="text-[10px] text-slate-400 font-medium">Street scout submissions</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-black text-amber-700 block">Needs Action</span>
            <span className="text-2xl font-black text-amber-900 block mt-1">{newSpots}</span>
            <span className="text-[10px] text-amber-600 font-medium">Pending owner contact</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-black text-purple-700 block">Converted / Active</span>
            <span className="text-2xl font-black text-purple-900 block mt-1">{convertedSpots}</span>
            <span className="text-[10px] text-purple-600 font-medium">Listed on Auricity</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-black text-emerald-700 block">Bounty Allocated</span>
            <span className="text-2xl font-black text-emerald-900 block mt-1 font-mono">₹{totalBountyAllocated.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 font-medium">UPI cash rewards</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locality, phone, scout name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'new', label: 'New' },
            { id: 'contacted_owner', label: 'Contacted' },
            { id: 'converted_listing', label: 'Converted' },
            { id: 'deal_closed', label: 'Deal Closed' },
            { id: 'bounty_paid', label: 'Bounty Paid' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#102B59] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800">No spotted properties found</h3>
          <p className="text-xs text-slate-500 mt-1">Try changing your search keywords or filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <div 
              key={item.id} 
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden group">
                  <img
                    src={item.photoUrl}
                    alt={item.locality}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setZoomPhoto(item.photoUrl)}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/70 text-white backdrop-blur-xs">
                      {item.listingPurpose}
                    </span>
                  </div>
                  {item.expectedPriceOrRent && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white/95 text-slate-900 shadow-xs">
                        {item.expectedPriceOrRent}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#214E9B] uppercase tracking-wider block">
                      {item.propertyType}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-0.5 line-clamp-1">
                      {item.locality}
                    </h4>
                    {item.landmark && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.landmark}</span>
                      </p>
                    )}
                  </div>

                  {/* Contact Seen on Board */}
                  <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                        Board Contact (Owner/Broker):
                      </span>
                      {item.boardContactName && (
                        <span className="text-[10px] text-blue-700 font-bold">{item.boardContactName}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {item.boardContactNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${item.boardContactNumber}`}
                          className="p-1 rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-50 cursor-pointer"
                          title="Call Owner"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(
                            item.boardContactNumber,
                            `नमस्ते, हमने ${item.locality} में आपकी प्रॉपर्टी का To-Let/Sale बोर्ड देखा। क्या यह Auricity Real Estate के क्लाइंट्स के लिए उपलब्ध है? कृपया विवरण साझा करें.`
                          )}
                          className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                          title="WhatsApp Owner"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Spotter (Affiliate) Details */}
                  <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Spotted By (Scout):</span>
                      {item.spotter.affiliateId ? (
                        <span className="text-[9px] font-mono font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                          {item.spotter.affiliateId}
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          Citizen Scout
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-900">{item.spotter.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{item.spotter.mobile}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${item.spotter.mobile}`}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          title="Call Scout"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(
                            item.spotter.mobile,
                            `नमस्ते ${item.spotter.name}, Auricity Real Estate की तरफ से धन्यवाद! आपने जो ${item.locality} की प्रॉपर्टी सबमिट की है, उस पर हमारी टीम ने काम शुरू कर दिया है। डील फाइनल होते ही आपका रिवॉर्ड आपके UPI पर ट्रांसफर कर दिया जाएगा.`
                          )}
                          className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          title="WhatsApp Scout"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.spotter.upiId && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Bounty UPI:</span>
                        <span className="font-mono font-black text-emerald-700">{item.spotter.upiId}</span>
                      </div>
                    )}
                  </div>

                  {/* Bounty Status & Amount */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-500 font-bold">Approved Bounty:</span>
                    <span className="font-black font-mono text-emerald-600 text-sm">
                      ₹{(item.adminReview?.bountyAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item, e.target.value as SpottedPropertyStatus)}
                    className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none"
                  >
                    <option value="new">New (नवीन)</option>
                    <option value="contacted_owner">Contacted Owner</option>
                    <option value="converted_listing">Converted to Listing</option>
                    <option value="deal_closed">Deal Closed (Bounty Due)</option>
                    <option value="bounty_paid">Bounty Paid (UPI Done)</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setAdminNote(item.adminReview?.adminNotes || '');
                      setBountyAmount(item.adminReview?.bountyAmount || (item.listingPurpose === 'rent' ? 2500 : 5000));
                      setBountyStatus(item.adminReview?.bountyStatus || 'pending');
                      setBountyPaymentRef(item.adminReview?.bountyPaymentRef || '');
                    }}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                    title="Edit Review & Bounty"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1-Click Convert to Live Listing Button */}
                {item.status !== 'converted_listing' && item.status !== 'deal_closed' && item.status !== 'bounty_paid' ? (
                  <button
                    onClick={() => handleConvertToProperty(item)}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#102B59] hover:bg-[#1a4185] text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Convert to Live Property Listing</span>
                  </button>
                ) : (
                  <div className="text-center py-1 text-[10px] font-black text-purple-700 bg-purple-50 rounded-xl">
                    ✓ Active on Auricity Inventory
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDIT REVIEW & BOUNTY DETAILS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{selectedItem.id}</span>
                <h3 className="text-base font-black text-slate-900">Review & Set Cash Bounty</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Bounty / Reward Amount (₹)
                </label>
                <input
                  type="number"
                  value={bountyAmount}
                  onChange={e => setBountyAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                  placeholder="e.g. 2500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Amount promised to {selectedItem.spotter.name} upon successful deal closure.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bounty Status
                </label>
                <select
                  value={bountyStatus}
                  onChange={e => setBountyStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending Deal Closure</option>
                  <option value="approved">Approved & Committed</option>
                  <option value="paid">Paid via UPI / Bank</option>
                  <option value="ineligible">Ineligible / Duplicate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UPI / Payment Reference (UTR #)
                </label>
                <input
                  type="text"
                  value={bountyPaymentRef}
                  onChange={e => setBountyPaymentRef(e.target.value)}
                  placeholder="e.g. UPI Ref #482910394821 or GPay Trans ID"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Internal Notes & Follow-up
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Called owner Mr. Patil. Commercial rent finalized at ₹30k. Agreement signing next Tuesday."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Review & Bounty</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      {zoomPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
          onClick={() => setZoomPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img src={zoomPhoto} alt="Zoomed spotted photo" className="w-full h-full object-contain" />
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
