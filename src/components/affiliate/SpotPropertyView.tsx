import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Phone, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Wallet, 
  Building2, 
  HelpCircle, 
  Check, 
  Share2,
  Navigation,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { addSpottedProperty } from '../../services/spottedPropertiesStore';

const SAMBHAJINAGAR_LOCALITIES = [
  'CIDCO N-1 to N-4',
  'CIDCO N-5 (Cannought Garden)',
  'CIDCO N-6 to N-9',
  'CIDCO N-11 & N-12',
  'Garkheda Parisar',
  'Samarth Nagar',
  'Jalna Road (Seven Hills to Akashwani)',
  'Beed Bypass Road',
  'Waluj MIDC / Bajaj Nagar',
  'Shendra MIDC / DMIC AURIC',
  'Osmanpura & Kranti Chowk',
  'Ulkanagari & Sutgirni',
  'Railway Station Road',
  'Padegaon & Cantonment',
  'Shahnoorwadi & Darga Road',
  'Chikalthana MIDC & Airport Area',
  'Khuldabad & Paithan Road',
  'Other Area in Sambhajinagar'
];

interface SpotPropertyViewProps {
  onBack?: () => void;
  onSuccess?: () => void;
  isModal?: boolean;
}

export const SpotPropertyView: React.FC<SpotPropertyViewProps> = ({ 
  onBack, 
  onSuccess,
  isModal = false 
}) => {
  const { setActiveView, showToast } = useApp();

  // Check if there is an active affiliate logged in
  const [activeAffiliate, setActiveAffiliate] = useState<any>(null);

  useEffect(() => {
    try {
      const activeId = localStorage.getItem('auricity_active_affiliate_id');
      const appsStr = localStorage.getItem('auricity_affiliate_applications_v1');
      if (activeId && appsStr) {
        const apps = JSON.parse(appsStr);
        const found = apps.find((a: any) => a.id === activeId || a.affiliateId === activeId);
        if (found) {
          setActiveAffiliate(found);
          setSpotterName(found.basic?.fullName || '');
          setSpotterMobile(found.basic?.mobile || '');
          setSpotterEmail(found.basic?.email || '');
          setSpotterAffiliateId(found.affiliateId || '');
          if (found.payout?.upiId) {
            setSpotterUpi(found.payout.upiId);
          }
        }
      }
    } catch {}
  }, []);

  // Form states
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [locality, setLocality] = useState('CIDCO N-5 (Cannought Garden)');
  const [customLocality, setCustomLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [propertyType, setPropertyType] = useState('Commercial Shop (Ground Floor)');
  const [listingPurpose, setListingPurpose] = useState<'rent' | 'sale' | 'lease'>('rent');
  const [expectedPriceOrRent, setExpectedPriceOrRent] = useState('');
  const [boardContactNumber, setBoardContactNumber] = useState('');
  const [boardContactName, setBoardContactName] = useState('');
  const [notes, setNotes] = useState('');

  // Submitter states
  const [spotterName, setSpotterName] = useState('');
  const [spotterMobile, setSpotterMobile] = useState('');
  const [spotterUpi, setSpotterUpi] = useState('');
  const [spotterEmail, setSpotterEmail] = useState('');
  const [spotterAffiliateId, setSpotterAffiliateId] = useState('');

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [submittedSpot, setSubmittedSpot] = useState<any>(null);
  const [error, setError] = useState('');

  // Handle Photo selection/capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Photo size is too large (max 8MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoPreview(event.target.result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!boardContactNumber.trim() || boardContactNumber.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number seen on the board/sign.');
      return;
    }

    if (!landmark.trim()) {
      setError('Please enter the landmark or exact street address so our team can locate it.');
      return;
    }

    if (!spotterName.trim() || !spotterMobile.trim()) {
      setError('Please provide your name and mobile number so we can contact you and credit your bounty.');
      return;
    }

    setSubmitting(true);
    try {
      const finalLocality = locality === 'Other Area in Sambhajinagar' && customLocality.trim()
        ? customLocality.trim()
        : locality;

      const fallbackPhoto = 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&auto=format&fit=crop&q=80';

      const result = await addSpottedProperty({
        photoUrl: photoPreview || fallbackPhoto,
        locality: finalLocality,
        landmark: landmark.trim(),
        propertyType,
        listingPurpose,
        expectedPriceOrRent: expectedPriceOrRent.trim() || undefined,
        boardContactNumber: boardContactNumber.trim(),
        boardContactName: boardContactName.trim() || undefined,
        notes: notes.trim() || undefined,
        spotter: {
          name: spotterName.trim(),
          mobile: spotterMobile.trim(),
          upiId: spotterUpi.trim() || undefined,
          affiliateId: spotterAffiliateId.trim() || undefined,
          email: spotterEmail.trim() || undefined
        }
      });

      setSubmittedSpot(result);
      showToast('🎉 Property spotted successfully! Admin will verify and contact the owner.', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError('Failed to submit property. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedSpot(null);
    setPhotoPreview('');
    setLandmark('');
    setBoardContactNumber('');
    setBoardContactName('');
    setExpectedPriceOrRent('');
    setNotes('');
  };

  if (submittedSpot) {
    return (
      <div className="mx-auto max-w-xl p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <span className="mt-4 inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
          Lead Submitted · ₹ Bounty Eligible
        </span>
        <h2 className="mt-2 text-2xl font-black text-slate-900">
          प्रॉपर्टी यशस्वीरित्या सबमिट केली!
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          धन्यवाद <span className="font-bold text-slate-900">{spotterName}</span>. तुमची सबमिशन आयडी आहे: <span className="font-mono font-black text-[#214E9B]">{submittedSpot.id}</span>.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold">स्थान / Locality:</span>
            <span className="font-black text-slate-900">{submittedSpot.locality}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold">बोर्डवरील नंबर:</span>
            <span className="font-black text-slate-900">{submittedSpot.boardContactNumber}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold">अपेक्षित रिवॉर्ड / Bounty:</span>
            <span className="font-black text-emerald-600 font-mono text-sm">
              ₹{submittedSpot.listingPurpose === 'rent' ? '1,500 - ₹5,000' : '₹5,000 - ₹25,000+'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">पुढील पायरी:</span>
            <span className="font-bold text-blue-700">आमची टीम २४ तासांत मालकाशी संपर्क साधेल</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 px-4 rounded-xl bg-[#102B59] hover:bg-[#1a4185] text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>दुसरी जागा कळवा / Spot Another</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else setActiveView('affiliate-dashboard');
            }}
            className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            डॅशबोर्डवर जा &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-3xl ${isModal ? 'p-1' : 'py-8 px-4 sm:px-6'}`}>
      {/* Top Banner / Heading */}
      <div className="rounded-3xl bg-gradient-to-br from-[#102B59] to-[#0A1B38] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/20 px-3.5 py-1.5 text-xs font-black text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            AURICITY STREET SCOUT & EARN
          </span>
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">
          सड़क पर दिखी खाली जगह? फोटो व नंबर भेजो और <span className="text-amber-400">कैश रिवॉर्ड पाओ!</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          छत्रपती संभाजीनगरमध्ये रस्त्याने फिरताना 'To-Let', 'दुकान भाड्याने देणे आहे', किंवा 'प्लॉट विकणे आहे' चा बोर्ड दिसला? त्याचा फोटो आणि बोर्डवरील फोन नंबर येथे अपलोड करा. डील फायनल झाल्यावर तुम्हाला थेट कमिशन/रिवॉर्ड मिळेल!
        </p>

        {/* 3 Step Mini Flow */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 border-t border-white/10 pt-4 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950">1</span>
            <span>बोर्डचा फोटो काढा</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950">2</span>
            <span>मालकाचा नंबर टाका</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950">3</span>
            <span>UPI वर पैसे मिळवा</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* SECTION 1: PHOTO UPLOAD */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
            १. जागेचा किंवा बोर्डचा फोटो (Photo of Board / Building)
            <span className="text-red-500 ml-1">*</span>
          </label>

          <div className="relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 p-4 bg-slate-50/70 transition-all text-center">
            {photoPreview ? (
              <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <img
                  src={photoPreview}
                  alt="Spotted Property Preview"
                  className="w-full h-52 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview('')}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-xs px-2.5 py-1 rounded-lg font-bold"
                >
                  बदला / Remove
                </button>
              </div>
            ) : (
              <div>
                <Camera className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-xs font-black text-slate-800">
                  कॅमेराने फोटो काढा किंवा गॅलरीतून निवडा
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  (Capture photo of the To-Let board, shutter, or building entrance)
                </p>

                <div className="mt-3 flex justify-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102B59] hover:bg-[#1a4185] text-white text-xs font-bold transition-all shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>कॅमेरा / फोटो निवडा</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: CONTACT DETAILS SEEN ON THE BOARD */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-[#214E9B]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              २. बोर्डवर लिहिलेला मालक / ब्रोकरचा संपर्क (Contact Written on Board)
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                बोर्डवरील मोबाईल नंबर (Mobile Number on Sign) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="उदा. 9822012345"
                value={boardContactNumber}
                onChange={e => setBoardContactNumber(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                आमची टीम याच नंबरवर फोन करून जागेची खात्री करेल.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                बोर्डवरील नाव (Name on Board, If Any)
              </label>
              <input
                type="text"
                placeholder="उदा. Mr. Patil / Owner / Builder"
                value={boardContactName}
                onChange={e => setBoardContactName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LOCATION & PROPERTY DETAILS */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#214E9B]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              ३. जागेचे ठिकाण व प्रकार (Location & Space Type)
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                परिसर / एरिया (Locality in Sambhajinagar) <span className="text-red-500">*</span>
              </label>
              <select
                value={locality}
                onChange={e => setLocality(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100"
              >
                {SAMBHAJINAGAR_LOCALITIES.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {locality === 'Other Area in Sambhajinagar' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  विशिष्ट एरियाचे नाव टाका (Specify Area) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. सातारा परिसर / कांचनवाडी / पडेगाव"
                  value={customLocality}
                  onChange={e => setCustomLocality(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            <div className={locality === 'Other Area in Sambhajinagar' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                नजीकची खूण किंवा अचूक रस्ता (Landmark / Street) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="उदा. प्रोझोन मॉल समोर, ऍक्सिस बँक शेजारी, मुख्य रस्ता"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                प्रॉपर्टीचा प्रकार (Property Type)
              </label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100"
              >
                <option value="Commercial Shop (Ground Floor)">Commercial Shop (दुकान)</option>
                <option value="Commercial Office Space">Office Space (ऑफिस जागा)</option>
                <option value="2 BHK Apartment / Flat">2 BHK Flat (फ्लॅट)</option>
                <option value="3 BHK Apartment / Flat">3 BHK Flat</option>
                <option value="Independent House / Row House">Row House / Bungalow</option>
                <option value="Commercial Plot / Land">Plot / Land (प्लॉट/जमीन)</option>
                <option value="Warehouse / Godown / Shed">Warehouse / गोडाऊन</option>
                <option value="Commercial Entire Building">Full Building (संपूर्ण इमारत)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                कशासाठी उपलब्ध आहे? (For Rent / Sale)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['rent', 'sale', 'lease'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setListingPurpose(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                      listingPurpose === p 
                        ? 'bg-[#102B59] text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p === 'rent' ? 'भाड्याने (Rent)' : p === 'sale' ? 'विक्री (Sale)' : 'लीज (Lease)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                अपेक्षित भाडे किंवा किंमत (Expected Rent / Price - If Mentioned)
              </label>
              <input
                type="text"
                placeholder="उदा. ₹25,000 / महिना किंवा ₹65 लाख (माहीत नसल्यास रिकामे ठेवा)"
                value={expectedPriceOrRent}
                onChange={e => setExpectedPriceOrRent(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                इतर काही माहिती (Additional Notes)
              </label>
              <textarea
                rows={2}
                placeholder="उदा. ग्राउंड फ्लोअर, 300 चौ.फूट, शटर बंद आहे, बाजूला चहाचे दुकान आहे..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: YOUR DETAILS & PAYOUT UPI */}
        <div className="pt-2 border-t border-slate-100 bg-blue-50/40 p-5 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#214E9B]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                ४. तुमचे तपशील आणि रिवॉर्ड UPI (Where to Pay Your Bounty)
              </h2>
            </div>
            {activeAffiliate && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Partner: {activeAffiliate.affiliateId}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                तुमचे पूर्ण नाव (Your Full Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="उदा. Aman Shaikh / Rahul Patil"
                value={spotterName}
                onChange={e => setSpotterName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                तुमचा मोबाईल नंबर (WhatsApp Number) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="उदा. 4668430420"
                value={spotterMobile}
                onChange={e => setSpotterMobile(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                UPI ID (पैसे थेट जमा करण्यासाठी - GPay / PhonePe / Paytm)
              </label>
              <input
                type="text"
                placeholder="उदा. yourname@oksbi किंवा 9822012345@paytm"
                value={spotterUpi}
                onChange={e => setSpotterUpi(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                डील पूर्ण होताच तुमचे कमिशन थेट या UPI वर ट्रान्सफर केले जाईल.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Affiliate / Partner ID (जर असेल तर)
              </label>
              <input
                type="text"
                placeholder="उदा. AUR-AF-2026-T9T7WJ"
                value={spotterAffiliateId}
                onChange={e => setSpotterAffiliateId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#102B59] to-[#214E9B] hover:from-[#0d2348] hover:to-[#1a4185] text-white text-sm font-black transition-all cursor-pointer shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>सबमिट होत आहे... / Submitting Lead...</span>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>📸 जागेची माहिती सबमिट करा (Submit & Earn Bounty)</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2.5">
            🔒 तुमची माहिती सुरक्षित आहे. ऑरीसिटीची ॲडमिन टीम मालकाशी संपर्क करून प्रॉपर्टीची खात्री करेल.
          </p>
        </div>
      </form>
    </div>
  );
};
