import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  BarChart3, 
  Check, 
  CheckCircle2, 
  ChevronDown, 
  Copy, 
  Link2, 
  LockKeyhole, 
  MailCheck, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users, 
  X, 
  AlertCircle,
  LogIn,
  LogOut,
  Smartphone,
  Share2,
  QrCode,
  Wallet,
  ExternalLink,
  Send,
  MessageSquare,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type Status = 'under_review' | 'approved' | 'rejected' | 'more_information_required' | 'suspended';
export type AffiliateType = 'Content Creator' | 'Blogger' | 'Social Media Creator' | 'Digital Marketer' | 'Website Owner' | 'Community Owner' | 'Real Estate Enthusiast' | 'Referral Partner' | 'Other';
export type Referral = { id: string; date: string; referral: string; status: 'signup' | 'qualified' | 'ineligible' | 'pending'; reward: string };

export type Application = {
  id: string;
  affiliateId: string;
  submittedAt: string;
  reviewedAt?: string;
  status: Status;
  basic: {
    fullName: string;
    email: string;
    mobile: string;
    country: string;
    state: string;
    city: string;
  };
  profile: {
    affiliateType: AffiliateType;
    website: string;
    socialProfile: string;
    audienceSize: string;
    primaryChannel: string;
    about: string;
  };
  promotion: {
    heardFrom: string;
    strategy: string;
    guidelines: boolean;
  };
  account: {
    emailVerified: boolean;
    password?: string;
  };
  payout?: {
    upiId?: string;
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  };
  adminNotes?: string;
  referredBy?: string;
  referralCode: string;
  referrals: Referral[];
  clicks: number;
  rewards: { amount: string; status: 'pending' | 'approved' | 'paid' | 'ineligible'; referralId: string }[];
};

type Form = Omit<Application, 'id' | 'affiliateId' | 'submittedAt' | 'reviewedAt' | 'status' | 'adminNotes' | 'referralCode' | 'referrals' | 'clicks' | 'rewards'>;

const KEY = 'auricity_affiliate_applications_v1';
const DRAFT = KEY + '_draft';
const ACTIVE_AFFILIATE_KEY = 'auricity_active_affiliate_id';

const emptyForm: Form = {
  basic: { fullName: '', email: '', mobile: '', country: 'India', state: '', city: '' },
  profile: { affiliateType: 'Content Creator', website: '', socialProfile: '', audienceSize: '', primaryChannel: 'Instagram', about: '' },
  promotion: { heardFrom: 'Social Media', strategy: '', guidelines: false },
  account: { emailVerified: false }
};

const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#214E9B] focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400';

const makeId = () => `AUR-AF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

async function loadApps(): Promise<Application[]> {
  try {
    const r = await fetch(`/api/store/${KEY}`);
    if (r.ok) {
      const d = await r.json();
      const a = Array.isArray(d?.value) ? d.value : [];
      localStorage.setItem(KEY, JSON.stringify(a));
      return a;
    }
  } catch {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

async function saveApps(a: Application[]) {
  localStorage.setItem(KEY, JSON.stringify(a));
  try {
    await fetch(`/api/store/${KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: a })
    });
  } catch {}
}

function Pill({ status }: { status: Status }) {
  const m: Record<Status, [string, string]> = {
    under_review: ['Under Review', 'bg-amber-50 text-amber-700 border-amber-200'],
    approved: ['Approved & Active', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
    rejected: ['Rejected', 'bg-red-50 text-red-700 border-red-200'],
    more_information_required: ['More Information Required', 'bg-blue-50 text-blue-700 border-blue-200'],
    suspended: ['Suspended', 'bg-slate-100 text-slate-700 border-slate-200']
  };
  const [l, c] = m[status] || ['Pending', 'bg-slate-50 text-slate-700 border-slate-200'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${c}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {l}
    </span>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export const AffiliatePortal: React.FC<{ mode: 'landing' | 'register' | 'status' | 'dashboard' | 'admin' | 'login' }> = ({ mode }) => {
  const { setActiveView, activeRole, showToast } = useApp();
  const [apps, setApps] = useState<Application[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<Application | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [reviewNote, setReviewNote] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copy, setCopy] = useState(false);
  const [activeAffiliateId, setActiveAffiliateId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_AFFILIATE_KEY) || null;
  });
  const timer = useRef<any>(null);

  // Load apps from store
  useEffect(() => {
    loadApps().then(a => {
      setApps(a);
      setLoading(false);
    });
  }, []);

  // Track referral query param (?ref=XYZ)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    localStorage.setItem('auricity_affiliate_ref', ref);
    const marker = 'auricity_ref_seen_' + ref;
    if (sessionStorage.getItem(marker)) return;
    sessionStorage.setItem(marker, '1');
    loadApps().then(a => {
      const next = a.map(x => x.referralCode === ref && x.status === 'approved' ? { ...x, clicks: (x.clicks || 0) + 1 } : x);
      if (next.some((x, i) => (x.clicks || 0) !== (a[i]?.clicks || 0))) {
        saveApps(next);
        setApps(next);
      }
    });
  }, []);

  // Restore draft if registering
  useEffect(() => {
    if (mode === 'register') {
      try {
        const d = localStorage.getItem(DRAFT);
        if (d) setForm(JSON.parse(d));
      } catch {}
    }
  }, [mode]);

  // Auto-save registration draft
  useEffect(() => {
    if (mode !== 'register') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      localStorage.setItem(DRAFT, JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [form, mode]);

  const go = (v: string) => setActiveView(v);

  const update = (s: keyof Form, k: string, v: any) =>
    setForm(p => ({ ...p, [s]: { ...(p[s] as any), [k]: v } }));

  const valid = (s: number) => {
    if (s === 1) return ['fullName', 'email', 'mobile', 'country', 'state', 'city'].every(k => String((form.basic as any)[k]).trim());
    if (s === 2) return true;
    if (s === 3) return Boolean(form.promotion.strategy && form.promotion.guidelines);
    if (s === 4) return password.length >= 6 && password === confirm && form.account.emailVerified;
    return true;
  };

  const submit = async () => {
    if (!valid(4)) {
      showToast('Complete the required account fields before submitting.', 'error');
      return;
    }
    if (apps.some(a => a.basic.email.toLowerCase() === form.basic.email.toLowerCase())) {
      showToast('An affiliate application already exists for this email. Please log in.', 'error');
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const referredBy = localStorage.getItem('auricity_affiliate_ref') || undefined;
    const a: Application = {
      id: crypto.randomUUID?.() || `af-${Date.now()}`,
      affiliateId: makeId(),
      submittedAt: now,
      status: 'under_review',
      ...form,
      account: {
        ...form.account,
        password: password
      },
      referredBy,
      referralCode: makeCode(),
      referrals: [],
      clicks: 0,
      rewards: []
    };

    let next = [a, ...apps];
    if (referredBy) {
      next = next.map(x =>
        x.referralCode === referredBy && x.status === 'approved'
          ? {
              ...x,
              referrals: [
                ...x.referrals,
                { id: a.id, date: new Date().toLocaleDateString(), referral: a.affiliateId, status: 'pending', reward: 'Pending policy review' }
              ]
            }
          : x
      );
    }
    await saveApps(next);
    setApps(next);
    setSubmitted(a);
    // Persist this affiliate session immediately on this device
    localStorage.setItem(ACTIVE_AFFILIATE_KEY, a.id);
    setActiveAffiliateId(a.id);
    localStorage.removeItem(DRAFT);
    localStorage.removeItem('auricity_affiliate_ref');
    setSubmitting(false);
    showToast('Affiliate application submitted successfully! Your account is created.', 'success');
  };

  const updateApp = async (a: Application, p: Partial<Application>) => {
    const next = apps.map(x => (x.id === a.id ? { ...x, ...p, reviewedAt: new Date().toISOString() } : x));
    await saveApps(next);
    setApps(next);
    setSelected({ ...a, ...p });
    showToast('Affiliate application updated.', 'success');
  };

  const handleLoginSuccess = (app: Application) => {
    localStorage.setItem(ACTIVE_AFFILIATE_KEY, app.id);
    setActiveAffiliateId(app.id);
    if (app.status === 'approved') {
      showToast(`Welcome back, ${app.basic.fullName}! Your Affiliate Dashboard is ready.`, 'success');
      go('affiliate-dashboard');
    } else {
      showToast(`Logged in successfully. Your application status: ${app.status.replace(/_/g, ' ')}.`, 'info');
      go('affiliate-status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACTIVE_AFFILIATE_KEY);
    setActiveAffiliateId(null);
    showToast('Logged out of Affiliate Account.', 'info');
    go('affiliate-landing');
  };

  // Find active app for the current logged in session
  const activeApp = apps.find(a => 
    a.id === activeAffiliateId || 
    a.affiliateId === activeAffiliateId || 
    a.basic.email.toLowerCase() === (activeAffiliateId || '').toLowerCase() || 
    a.basic.mobile.replace(/[^0-9]/g, '') === (activeAffiliateId || '').replace(/[^0-9]/g, '')
  ) || apps[0]; // fallback if testing

  const hasActiveSession = Boolean(activeAffiliateId && apps.some(a => a.id === activeAffiliateId));

  if (mode === 'login') {
    return (
      <Login 
        apps={apps} 
        onLoginSuccess={handleLoginSuccess} 
        go={go} 
      />
    );
  }

  if (mode === 'landing') {
    return (
      <Landing 
        go={go} 
        activeApp={hasActiveSession ? activeApp : null} 
        onLogout={handleLogout}
      />
    );
  }

  if (mode === 'register' && submitted) {
    return <Success app={submitted} go={go} />;
  }

  if (mode === 'register') {
    return (
      <Register 
        form={form} 
        step={step} 
        setStep={setStep} 
        update={update} 
        valid={valid} 
        submit={submit} 
        submitting={submitting} 
        saved={saved} 
        password={password} 
        setPassword={setPassword} 
        confirm={confirm} 
        setConfirm={setConfirm} 
        go={go}
      />
    );
  }

  if (mode === 'status') {
    return (
      <StatusPage 
        app={hasActiveSession ? activeApp : apps[0]} 
        go={go} 
        onLogout={handleLogout}
      />
    );
  }

  if (mode === 'dashboard') {
    // If not logged in and not approved, render login prompt
    if (!hasActiveSession || (activeApp && activeApp.status !== 'approved')) {
      return (
        <div className="min-h-screen bg-[#F7F9FC] px-5 py-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800 flex items-center justify-between">
              <span>Please log in to your approved Affiliate Account to view your dashboard.</span>
              <button onClick={() => go('affiliate-landing')} className="text-amber-900 underline font-black">
                Back
              </button>
            </div>
            <Login 
              apps={apps} 
              onLoginSuccess={handleLoginSuccess} 
              go={go} 
            />
          </div>
        </div>
      );
    }

    return (
      <Dashboard 
        app={activeApp} 
        go={go} 
        copy={copy} 
        setCopy={setCopy} 
        onLogout={handleLogout}
        onUpdatePayout={async (payout) => {
          if (!activeApp) return;
          await updateApp(activeApp, { payout });
          showToast('Payout details updated successfully.', 'success');
        }}
      />
    );
  }

  return (
    <Admin 
      apps={apps} 
      loading={loading} 
      role={activeRole} 
      search={search} 
      setSearch={setSearch} 
      filter={filter} 
      setFilter={setFilter} 
      selected={selected} 
      setSelected={setSelected} 
      note={reviewNote} 
      setNote={setReviewNote} 
      updateApp={updateApp} 
      go={go}
      onImpersonate={(app) => {
        localStorage.setItem(ACTIVE_AFFILIATE_KEY, app.id);
        setActiveAffiliateId(app.id);
        showToast(`Viewing dashboard as ${app.basic.fullName} (${app.affiliateId})`, 'info');
        go('affiliate-dashboard');
      }}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                               LOGIN COMPONENT                              */
/* -------------------------------------------------------------------------- */
function Login({ apps, onLoginSuccess, go }: { apps: Application[]; onLoginSuccess: (app: Application) => void; go: (v: string) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [loginMethod, setLoginMethod] = useState<'instant' | 'password'>('instant');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('4821');

  const cleanNum = (str: string) => str.replace(/[^0-9]/g, '');

  const findApp = () => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanNum(cleanId);

    return apps.find(a => {
      const matchEmail = a.basic.email.toLowerCase() === cleanId;
      const matchAffiliateId = a.affiliateId.toLowerCase() === cleanId;
      const appPhoneClean = cleanNum(a.basic.mobile);
      const matchPhone = cleanPhone.length >= 6 && (appPhoneClean.includes(cleanPhone) || cleanPhone.includes(appPhoneClean));
      return matchEmail || matchAffiliateId || matchPhone;
    });
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = findApp();
    if (!matched) {
      setError('No affiliate account found with this Mobile / Email / Affiliate ID. Please register as a partner.');
      return;
    }
    // Generate simple 4 digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setMockOtp(code);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = findApp();
    if (!matched) {
      setError('Account could not be verified.');
      return;
    }
    if (enteredOtp.trim() !== mockOtp && enteredOtp.trim() !== '4821') {
      setError('Incorrect verification code. Please enter the 4-digit code shown.');
      return;
    }
    onLoginSuccess(matched);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = findApp();
    if (!matched) {
      setError('No affiliate account found with this Mobile / Email / Affiliate ID.');
      return;
    }
    // If account has password check it, otherwise allow instant fallback
    if (matched.account.password && matched.account.password !== password) {
      setError('Incorrect password. Or switch to "Instant Mobile OTP" to log in without a password.');
      return;
    }
    onLoginSuccess(matched);
  };

  return (
    <div className="min-h-[80vh] bg-[#F7F9FC] px-4 py-12 sm:py-16 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2.2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#214E9B]">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">Affiliate Partner Login</h1>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Log in to access your referral link, deal tracking, and commission payouts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-xl bg-slate-100 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => { setLoginMethod('instant'); setError(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMethod === 'instant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Instant Mobile / OTP
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('password'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMethod === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Password Login
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loginMethod === 'instant' ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Mobile Number / Email / Affiliate ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4668430420 or zohaib0aman@gmail.com"
                  className={inputCls}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Enter the mobile or email you registered with.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#102B59] py-3.5 text-sm font-black text-white hover:bg-[#1a4185] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Verify & Get OTP</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900">
                <p className="font-bold">Instant Verification Code:</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-base font-black tracking-widest text-[#214E9B]">{mockOtp}</span>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-bold">1-Click Auto Code</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Enter 4-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Enter 4821"
                  className={`${inputCls} text-center font-mono text-lg tracking-widest`}
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Login to Dashboard</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Registered Mobile / Email / Affiliate ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 4668430420 or zohaib0aman@gmail.com"
                className={inputCls}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-800">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('instant'); setError(''); }}
                  className="text-[11px] font-bold text-[#214E9B] hover:underline"
                >
                  Forgot Password? Use OTP
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  className={inputCls}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#102B59] py-3.5 text-sm font-black text-white hover:bg-[#1a4185] transition-all cursor-pointer"
            >
              Sign In to Affiliate Dashboard
            </button>
          </form>
        )}

        {/* Quick Helper for Admin or Testing */}
        {apps.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Test Login (Recent Creator)
            </p>
            <div className="space-y-1.5">
              {apps.slice(0, 2).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setIdentifier(a.basic.mobile || a.basic.email);
                    setLoginMethod('instant');
                    setOtpSent(false);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-black text-slate-900">{a.basic.fullName}</span>
                    <span className="text-slate-400 ml-1.5">({a.basic.mobile})</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#214E9B]">Autofill &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-600">
            Haven't registered yet?{' '}
            <button
              type="button"
              onClick={() => go('affiliate-register')}
              className="font-black text-[#214E9B] hover:underline"
            >
              Become an Affiliate Partner &rarr;
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               LANDING VIEW                                 */
/* -------------------------------------------------------------------------- */
function Landing({ go, activeApp, onLogout }: { go: (v: string) => void; activeApp: Application | null; onLogout: () => void }) {
  const benefits = [
    ['Refer & Earn', 'Earn generous cash bounties for eligible referrals upon deal registration.'],
    ['Unique Referral Link', 'Get your own trackable link and branded WhatsApp sharing message.'],
    ['Real-Time Tracking', 'Monitor clicks, buyer inquiries, and closed property conversions.'],
    ['Affiliate Dashboard', 'Manage your payouts, referrals, and commission status in one place.'],
    ['Marketing Resources', 'Access approved social media captions, banners, and ready-to-use posts.'],
    ['Direct Bank/UPI Transfer', 'Instant payments directly to your UPI ID or bank account.']
  ];
  const types = ['Content Creators', 'Social Media Influencers', 'Bloggers', 'Digital Marketers', 'Real Estate Enthusiasts', 'Local Citizens', 'Community Groups', 'Referral Partners'];
  const faqs = [
    'What is the Auricity Affiliate Program?',
    'Who can become an affiliate?',
    'How do I log in if I am already an approved partner?',
    'How does referral tracking work?',
    'How do I get my referral link?',
    'When are rewards paid?'
  ];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="overflow-hidden bg-white text-slate-900">
      {/* Top Banner if user is already logged in */}
      {activeApp && activeApp.status === 'approved' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-950">
                Welcome back, <span className="font-black">{activeApp.basic.fullName}</span>! You are an active Affiliate Partner ({activeApp.affiliateId}).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => go('affiliate-dashboard')}
                className="px-3.5 py-1.5 bg-[#102B59] hover:bg-[#1a4185] text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Go to My Dashboard &rarr;
              </button>
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-[#081B3A] text-white">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black">
              <Sparkles className="h-4 w-4 text-[#D9B45A]" />
              AURICITY AFFILIATE & CREATOR PROGRAM
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
              Turn Your Network Into <span className="text-[#D9B45A]">Earnings</span> with Auricity
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Join the Auricity Affiliate Program. Share verified property listings in Chhatrapati Sambhajinagar with your audience and earn rewards on closed deals.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {activeApp && activeApp.status === 'approved' ? (
                <button
                  onClick={() => go('affiliate-dashboard')}
                  className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-7 py-3.5 text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Open My Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => go('affiliate-register')}
                    className="rounded-2xl bg-white hover:bg-slate-100 px-6 py-3.5 text-sm font-black text-[#102B59] flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Become an Affiliate</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => go('affiliate-login')}
                    className="rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-center text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
                  >
                    <LogIn className="h-4 w-4 text-[#D9B45A]" />
                    <span>Affiliate Login / पार्टनर लॉगिन</span>
                  </button>
                </>
              )}
            </div>

            {/* Quick Helper Text */}
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-300">
              <span>Already registered or approved by admin?</span>
              <button
                onClick={() => go('affiliate-login')}
                className="font-black text-[#D9B45A] hover:underline cursor-pointer"
              >
                Log In Here &rarr;
              </button>
            </div>
          </div>
          <Preview />
        </div>
      </div>

      {/* Benefits */}
      <section className="bg-[#F7F9FC] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Program Benefits</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Earn with every verified referral</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([t, d], i) => (
              <div key={t} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-sm font-black text-[#214E9B]">
                  0{i + 1}
                </div>
                <h3 className="mt-6 text-lg font-black">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">How It Works</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Four simple steps</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              ['01', 'Register', 'Fill out the simple partner application with your contact info.'],
              ['02', 'Admin Approval', 'Our admin reviews your application and activates your partner account.'],
              ['03', 'Share Your Link', 'Log in anytime, copy your unique referral link, and share on WhatsApp.'],
              ['04', 'Earn Rewards', 'Get paid directly via UPI/Bank transfer on every closed property transaction.']
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-3xl border border-slate-200 p-7">
                <div className="text-4xl font-black text-[#D9B45A]/70">{n}</div>
                <h3 className="mt-5 font-black">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => go('affiliate-register')}
              className="rounded-2xl bg-[#102B59] px-6 py-3.5 text-sm font-black text-white hover:bg-[#1a4185] cursor-pointer"
            >
              Start Your Affiliate Journey &rarr;
            </button>
            <button
              onClick={() => go('affiliate-login')}
              className="rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-black text-slate-800 cursor-pointer flex items-center gap-2"
            >
              <LogIn className="h-4 w-4 text-[#102B59]" />
              <span>Already an Affiliate? Log In</span>
            </button>
          </div>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="bg-[#F7F9FC] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Who Can Join</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Open to all creators & citizens</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {types.map(t => (
              <div key={t} className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
                <Users className="mx-auto h-6 w-6 text-[#214E9B]" />
                <p className="mt-3 text-sm font-black">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">FAQ</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Questions, answered</h2>
          <div className="mt-8">
            {faqs.map((q, i) => (
              <div key={q} className="border-b border-slate-200">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left text-sm font-black cursor-pointer"
                >
                  <span>{q}</span>
                  <ChevronDown className={`h-4 w-4 transition ${open === i ? 'rotate-180 text-[#214E9B]' : ''}`} />
                </button>
                {open === i && (
                  <p className="pb-5 text-sm leading-6 text-slate-600">
                    {i === 2
                      ? 'Approved affiliates can click "Affiliate Login" at the top or bottom of this page, enter their registered mobile number or email, and instantly access their dashboard.'
                      : 'Specific eligibility, attribution, reward calculation, and payout timing are governed by the current Auricity affiliate policy.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div className="bg-[#081B3A] px-5 py-20 text-center text-white">
        <h2 className="text-3xl font-black sm:text-5xl">Ready to start sharing Auricity?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Apply to the affiliate program or log in to your approved dashboard right now.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => go('affiliate-register')}
            className="w-full sm:w-auto rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-[#102B59] hover:bg-slate-100 cursor-pointer"
          >
            Become an Affiliate
          </button>
          <button
            onClick={() => go('affiliate-login')}
            className="w-full sm:w-auto rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-black text-white hover:bg-white/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4 text-[#D9B45A]" />
            <span>Affiliate Login (पार्टनर लॉगिन)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Preview() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="rounded-[1.5rem] bg-[#F8FAFD] p-5 text-slate-900">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-slate-400">Affiliate Overview</p>
            <p className="mt-1 text-xl font-black">Performance Dashboard</p>
          </div>
          <BarChart3 className="h-6 w-6 text-[#214E9B]" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {['Clicks', 'Signups', 'Qualified Referrals', 'Conversions', 'Earnings', 'Pending Rewards'].map(x => (
            <div key={x} className="rounded-2xl bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400">{x}</p>
              <p className="mt-2 text-lg font-black">{x === 'Earnings' ? '₹25,000+' : 'Active'}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-[#102B59] p-4 text-xs font-bold text-white flex items-center justify-between">
          <span>Real-time deal and referral tracking for all Auricity Partners.</span>
          <Sparkles className="h-4 w-4 text-[#D9B45A]" />
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            REGISTER COMPONENT                              */
/* -------------------------------------------------------------------------- */
function Register({ form, step, setStep, update, valid, submit, submitting, saved, password, setPassword, confirm, setConfirm, go }: any) {
  const names = ['Basic Information', 'Affiliate Profile', 'Promotion Details', 'Account Security', 'Review & Submit'];

  const next = () => {
    if (valid(step)) setStep(Math.min(5, step + 1));
    else alert('Please complete the required fields on this step.');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-12 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Auricity Affiliate Program</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Join the Auricity Affiliate Program</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Create your affiliate profile and start sharing Auricity with your network.
          </p>

          {/* Direct Login Banner for Returning Users */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
            <span>Already applied or approved?</span>
            <button
              type="button"
              onClick={() => go('affiliate-login')}
              className="font-black text-[#214E9B] underline hover:text-[#102B59] cursor-pointer"
            >
              Log In to your Dashboard &rarr;
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
          <div className="grid grid-cols-5 gap-1">
            {names.map((n, i) => (
              <div key={n} className="text-center">
                <div
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
                    step >= i + 1 ? 'bg-[#102B59] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <p className="mt-2 hidden text-[10px] font-bold text-slate-500 sm:block">{n}</p>
              </div>
            ))}
          </div>

          {saved && (
            <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
              Progress auto-saved
            </p>
          )}

          <div className="mt-8">
            {step === 1 && <Basic form={form} update={update} />}
            {step === 2 && <Profile form={form} update={update} onSkip={() => setStep(3)} />}
            {step === 3 && <Promotion form={form} update={update} />}
            {step === 4 && <Security form={form} update={update} password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />}
            {step === 5 && <Review form={form} />}
          </div>

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              disabled={step === 1}
              onClick={() => setStep(Math.max(1, step - 1))}
              className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Skip Step
                </button>
              )}
              {step < 5 ? (
                <button
                  onClick={next}
                  className="rounded-2xl bg-[#102B59] px-7 py-3 text-sm font-black text-white hover:bg-[#1a4185] cursor-pointer"
                >
                  Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={submit}
                  className="rounded-2xl bg-[#102B59] px-7 py-3 text-sm font-black text-white hover:bg-[#1a4185] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting…' : 'Submit Application'} <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Basic({ form, update }: any) {
  return (
    <>
      <h2 className="text-xl font-black">Step 1 — Basic Information</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" required>
          <input className={inputCls} value={form.basic.fullName} onChange={e => update('basic', 'fullName', e.target.value)} />
        </Field>
        <Field label="Email Address" required>
          <input type="email" className={inputCls} value={form.basic.email} onChange={e => update('basic', 'email', e.target.value)} />
        </Field>
        <Field label="Mobile Number (Used for Login & WhatsApp)" required>
          <input type="tel" className={inputCls} placeholder="e.g. 9822012345" value={form.basic.mobile} onChange={e => update('basic', 'mobile', e.target.value)} />
        </Field>
        <Field label="Country" required>
          <input className={inputCls} value={form.basic.country} onChange={e => update('basic', 'country', e.target.value)} />
        </Field>
        <Field label="State" required>
          <input className={inputCls} value={form.basic.state} onChange={e => update('basic', 'state', e.target.value)} />
        </Field>
        <Field label="City" required>
          <input className={inputCls} value={form.basic.city} onChange={e => update('basic', 'city', e.target.value)} />
        </Field>
      </div>
    </>
  );
}

function Profile({ form, update, onSkip }: any) {
  const types = ['Content Creator', 'Blogger', 'Social Media Creator', 'Digital Marketer', 'Website Owner', 'Community Owner', 'Real Estate Enthusiast', 'Referral Partner', 'Other'];
  const channels = ['Instagram', 'YouTube', 'Facebook', 'WhatsApp', 'Website/Blog', 'Telegram', 'Community', 'Other'];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-black">
            Step 2 — Affiliate Profile <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full ml-2">Optional</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Fill in how you plan to share listings, or skip to the next step.</p>
        </div>
        {onSkip && (
          <button type="button" onClick={onSkip} className="text-xs font-bold text-[#214E9B] hover:underline bg-blue-50 px-3.5 py-1.5 rounded-xl cursor-pointer">
            Skip this step &rarr;
          </button>
        )}
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Affiliate Type (Optional)">
          <select className={inputCls} value={form.profile.affiliateType} onChange={e => update('profile', 'affiliateType', e.target.value)}>
            {types.map(x => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Primary Promotion Channel (Optional)">
          <select className={inputCls} value={form.profile.primaryChannel} onChange={e => update('profile', 'primaryChannel', e.target.value)}>
            {channels.map(x => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Social Media Profile / Handle (Optional)">
          <input className={inputCls} placeholder="e.g. @instagram_handle" value={form.profile.socialProfile} onChange={e => update('profile', 'socialProfile', e.target.value)} />
        </Field>
        <Field label="Website / Blog (Optional)">
          <input className={inputCls} value={form.profile.website} onChange={e => update('profile', 'website', e.target.value)} placeholder="https://" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tell Us About Yourself (Optional)">
            <textarea rows={4} className={inputCls} value={form.profile.about} onChange={e => update('profile', 'about', e.target.value)} placeholder="Briefly describe your audience or reach (Optional)" />
          </Field>
        </div>
      </div>
    </>
  );
}

function Promotion({ form, update }: any) {
  const heard = ['Social Media', 'Friend/Referral', 'Search Engine', 'Auricity Website', 'Event', 'Other'];
  return (
    <>
      <h2 className="text-xl font-black">Step 3 — Promotion Details</h2>
      <div className="mt-6 space-y-5">
        <Field label="How did you hear about Auricity?" required>
          <select className={inputCls} value={form.promotion.heardFrom} onChange={e => update('promotion', 'heardFrom', e.target.value)}>
            {heard.map(x => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="How do you plan to promote Auricity?" required>
          <textarea rows={5} className={inputCls} value={form.promotion.strategy} onChange={e => update('promotion', 'strategy', e.target.value)} placeholder="e.g. I will share listings on my WhatsApp stories, Instagram reels, and recommend properties to friends and family." />
        </Field>
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
          <input type="checkbox" checked={form.promotion.guidelines} onChange={e => update('promotion', 'guidelines', e.target.checked)} className="mt-1 h-4 w-4 accent-[#214E9B]" />
          <span className="text-xs leading-5 text-slate-600">
            I agree to follow Auricity's affiliate promotional guidelines and only share genuine listings. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>
    </>
  );
}

function Security({ form, update, password, setPassword, confirm, setConfirm }: any) {
  return (
    <>
      <h2 className="text-xl font-black">Step 4 — Account Security</h2>
      <div className="mt-6 space-y-5">
        <Field label="Create Account Password" required>
          <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
        </Field>
        <Field label="Confirm Password" required>
          <input type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" />
        </Field>
        {confirm && password !== confirm && (
          <p className="text-xs font-bold text-red-600">Passwords do not match.</p>
        )}
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
          <input type="checkbox" checked={form.account.emailVerified} onChange={e => update('account', 'emailVerified', e.target.checked)} className="mt-1 h-4 w-4 accent-[#214E9B]" />
          <span className="text-xs leading-5 text-slate-600">
            <MailCheck className="mr-1 inline h-4 w-4 text-[#214E9B]" />
            I confirm my contact details are correct. I can also log in anytime using my Mobile Number and Instant OTP. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>
    </>
  );
}

function Review({ form }: { form: Form }) {
  return (
    <>
      <h2 className="text-xl font-black">Step 5 — Review & Submit</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Personal Information', form.basic],
          ['Affiliate Profile', form.profile],
          ['Promotion Details', form.promotion]
        ].map(([title, data]: any) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-black">{title}</h3>
            <div className="mt-4 space-y-2">
              {Object.entries(data).map(([k, v]: any) => (
                <div key={k} className="text-xs">
                  <span className="font-bold capitalize text-slate-500">{k.replace(/([A-Z])/g, ' $1')}: </span>
                  <span className="font-semibold">{typeof v === 'boolean' ? (v ? 'Confirmed' : 'Not confirmed') : String(v || '—')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-900">
        <LockKeyhole className="mr-2 inline h-4 w-4" />
        Your application will be submitted for admin review. You can log in using your Mobile Number at any time.
      </div>
    </>
  );
}

function Success({ app, go }: { app: Application; go: (v: string) => void }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-20">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h1 className="mt-6 text-3xl font-black">Application Submitted Successfully!</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Thank you for applying, <span className="font-black text-slate-900">{app.basic.fullName}</span>! Your partner profile is registered and is currently under admin review.
        </p>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Affiliate ID</p>
            <p className="mt-1 text-xs font-black">{app.affiliateId}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
            <p className="mt-1 text-xs font-black text-amber-700">Under Review</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Registered Mobile</p>
            <p className="mt-1 text-xs font-black">{app.basic.mobile}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 text-left">
          <p className="font-black">📲 How to log in on your phone anytime:</p>
          <p className="mt-1 text-slate-600">
            Open Auricity &rarr; Click <strong>Affiliate Login</strong> &rarr; Enter your mobile number <strong>{app.basic.mobile}</strong>.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => go('affiliate-status')}
            className="flex-1 rounded-2xl bg-[#102B59] px-5 py-3.5 text-sm font-black text-white hover:bg-[#1a4185] cursor-pointer"
          >
            Check Application Status
          </button>
          <button
            onClick={() => go('home')}
            className="flex-1 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black hover:bg-slate-50 cursor-pointer"
          >
            Back to Auricity
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               STATUS VIEW                                  */
/* -------------------------------------------------------------------------- */
function StatusPage({ app, go, onLogout }: { app?: Application; go: (v: string) => void; onLogout: () => void }) {
  if (!app) return <Empty title="No affiliate application found on this device" go={go} />;

  const stages = ['Application Submitted', 'Admin Review', 'Decision', 'Account Activated'];
  const done = app.status === 'approved' ? 4 : app.status === 'rejected' ? 3 : 2;

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Affiliate Status</p>
            <h1 className="mt-1 text-3xl font-black">Application Status</h1>
          </div>
          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Logout / Switch
          </button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-xs font-bold text-slate-400">Affiliate Partner</p>
              <p className="mt-1 text-lg font-black">{app.basic.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {app.affiliateId} · Mobile: {app.basic.mobile}</p>
            </div>
            <div>
              <Pill status={app.status} />
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {stages.map((s, i) => (
              <div key={s}>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    i < done ? 'bg-[#102B59] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <p className="mt-3 text-xs font-black">{s}</p>
              </div>
            ))}
          </div>

          {app.status === 'under_review' && (
            <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-5 text-amber-900">
              <p className="font-black text-sm">Your application is currently being reviewed</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Our admin team reviews partner applications within 24-48 hours. Once approved, you can log in to access your unique referral link and start earning.
              </p>
            </div>
          )}

          {app.status === 'more_information_required' && (
            <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-200 p-5">
              <p className="font-black text-blue-900">More Information Required</p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                {app.adminNotes || 'Please review the information requested by the Auricity team.'}
              </p>
            </div>
          )}

          {app.status === 'approved' && (
            <div className="mt-8 rounded-3xl bg-emerald-50 border border-emerald-200 p-6">
              <p className="text-lg font-black text-emerald-900">🎉 Your Affiliate Account is Active!</p>
              <p className="mt-1 text-xs text-emerald-800">
                Congratulations! You are officially an approved Auricity Affiliate Partner.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => go('affiliate-dashboard')}
                  className="rounded-2xl bg-[#102B59] hover:bg-[#1a4185] px-6 py-3 text-sm font-black text-white cursor-pointer"
                >
                  Open Live Affiliate Dashboard &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD VIEW                                */
/* -------------------------------------------------------------------------- */
function Dashboard({ 
  app, 
  go, 
  copy, 
  setCopy, 
  onLogout,
  onUpdatePayout 
}: { 
  app?: Application; 
  go: (v: string) => void; 
  copy: boolean; 
  setCopy: (v: boolean) => void;
  onLogout: () => void;
  onUpdatePayout: (payout: any) => void;
}) {
  if (!app || app.status !== 'approved') {
    return <Empty title="Affiliate dashboard is available after admin approval" go={go} />;
  }

  const [upiId, setUpiId] = useState(app.payout?.upiId || '');
  const [bankHolder, setBankHolder] = useState(app.payout?.accountHolder || app.basic.fullName);
  const [bankAccount, setBankAccount] = useState(app.payout?.accountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(app.payout?.ifsc || '');
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${app.referralCode}` : `auricity.com/?ref=${app.referralCode}`;

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaskar! Looking for verified flats, villas, plots, or commercial spaces in Chhatrapati Sambhajinagar with 0% brokerage? Explore verified properties on Auricity with direct owner contacts:\n\n${fullUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopy(true);
    setTimeout(() => setCopy(false), 1500);
  };

  const savePayout = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePayout({
      upiId,
      accountHolder: bankHolder,
      accountNumber: bankAccount,
      ifsc: bankIfsc
    });
    setPayoutSaved(true);
    setTimeout(() => setPayoutSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Auricity Affiliate Partner</span>
              <Pill status={app.status} />
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950">
              Welcome, {app.basic.fullName}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Affiliate ID: {app.affiliateId} · Registered Mobile: {app.basic.mobile}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(fullUrl)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-[#214E9B]" />
              <span>{copy ? 'Copied Link!' : 'Quick Copy Link'}</span>
            </button>
            <button
              onClick={onLogout}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* HERO REFERRAL SHARE CARD */}
        <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#0B1F40] to-[#102B59] p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Your Unique Tracking Link
              </span>
              <h2 className="mt-3 text-2xl font-black">Share & Earn Bounty on Property Closings</h2>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Anyone who visits Auricity using your link and inquiries or buys a property is credited to your partner account.
              </p>

              {/* Referral Link Box */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 border border-white/20 backdrop-blur-xs">
                  <Link2 className="h-4 w-4 text-amber-300 shrink-0" />
                  <span className="font-mono text-xs truncate select-all">{fullUrl}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(fullUrl)}
                  className="rounded-2xl bg-white hover:bg-slate-100 px-5 py-3 text-xs font-black text-[#102B59] cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copy ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Sharing Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
              <button
                onClick={shareWhatsApp}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3.5 text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Share on WhatsApp (1-Click)</span>
              </button>

              <button
                onClick={() => setShowQr(!showQr)}
                className="w-full rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>{showQr ? 'Hide QR Code' : 'Show Referral QR Code'}</span>
              </button>
            </div>
          </div>

          {/* QR Code expansion */}
          {showQr && (
            <div className="mt-6 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl">
              <div className="bg-white p-3 rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(fullUrl)}`}
                  alt="Referral QR Code"
                  className="w-28 h-28"
                />
              </div>
              <div>
                <h3 className="font-black text-sm">Scan to Open Referral Link</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">
                  Let your clients, buyers, or friends scan this QR code directly from your phone screen to visit Auricity with your referral code ({app.referralCode}).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* METRICS OVERVIEW */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total Link Clicks', app.clicks || 0, 'Unique visits from your link'],
            ['Inquiries & Signups', app.referrals.length, 'Submitted buyer leads'],
            ['Qualified Conversions', app.referrals.filter(r => r.status === 'qualified').length, 'Verified site visits & token deals'],
            ['Earned Rewards', `₹${app.rewards.filter(r => r.status === 'approved' || r.status === 'paid').reduce((s, r) => s + (parseInt(r.amount) || 0), 0)}`, 'Paid or approved commissions']
          ].map(([t, v, sub]) => (
            <div key={String(t)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{v}</p>
              <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
            </div>
          ))}
        </div>

        {/* PAYOUT SETTINGS & MARKETING KIT */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Payout Information (UPI / Bank) */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#214E9B]" />
              <h2 className="text-lg font-black text-slate-900">Commission Payout Settings</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Provide your UPI ID or bank account where Auricity should transfer your referral rewards.
            </p>

            {payoutSaved && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800">
                Payout settings saved successfully!
              </div>
            )}

            <form onSubmit={savePayout} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  UPI ID (Instant Transfer)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank or 9822012345@upi"
                  className={inputCls}
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={bankHolder}
                    onChange={e => setBankHolder(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Bank Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className={inputCls}
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#102B59] py-3 text-xs font-black text-white hover:bg-[#1a4185] transition-all cursor-pointer"
              >
                Save Payout Details
              </button>
            </form>
          </div>

          {/* Promotional Marketing Kit */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-[#214E9B]" />
                <h2 className="text-lg font-black text-slate-900">Ready-Made Promotional Captions</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Copy pre-written text tailored for WhatsApp and Instagram with your link included.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black text-slate-800">WhatsApp Status / Message</span>
                    <button
                      onClick={() => copyToClipboard(`Looking for verified flats, villas, plots, or shops in Chhatrapati Sambhajinagar with 0% brokerage? Check out Auricity: ${fullUrl}`)}
                      className="text-[11px] font-bold text-[#214E9B] hover:underline"
                    >
                      Copy Text
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    "Looking for verified flats, villas, plots, or shops in Chhatrapati Sambhajinagar with 0% brokerage? Check out Auricity: {fullUrl}"
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black text-slate-800">Instagram / YouTube Bio Link</span>
                    <button
                      onClick={() => copyToClipboard(`🏡 Find RERA-Verified Homes in Sambhajinagar: ${fullUrl}`)}
                      className="text-[11px] font-bold text-[#214E9B] hover:underline"
                    >
                      Copy Text
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    "🏡 Find RERA-Verified Homes in Sambhajinagar: {fullUrl}"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Need custom banner creatives?</span>
              <a
                href={`https://wa.me/918010506030?text=Hi%20Auricity%2C%20I%20am%20Affiliate%20Partner%20${app.affiliateId}%20and%20need%20marketing%20banners.`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#214E9B] hover:underline flex items-center gap-1"
              >
                <span>Request on WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* RECENT REFERRALS TABLE */}
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Your Referrals & Deal Activity</h2>
              <p className="text-xs text-slate-500">Track inquiries registered through your referral link</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {app.referrals.length} Inquiries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3">Date</th>
                  <th>Referral Inquirer</th>
                  <th>Status</th>
                  <th>Estimated Bounty</th>
                </tr>
              </thead>
              <tbody>
                {app.referrals.length ? (
                  app.referrals.map(r => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-4 font-mono">{r.date}</td>
                      <td className="font-bold text-slate-900">{r.referral}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#214E9B]">
                          {r.status}
                        </span>
                      </td>
                      <td className="font-bold text-slate-900">{r.reward}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No referral leads recorded yet. Share your link to start receiving client inquiries!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ADMIN VIEW                                  */
/* -------------------------------------------------------------------------- */
function Admin({
  apps,
  loading,
  role,
  search,
  setSearch,
  filter,
  setFilter,
  selected,
  setSelected,
  note,
  setNote,
  updateApp,
  go,
  onImpersonate
}: {
  apps: Application[];
  loading: boolean;
  role: string;
  search: string;
  setSearch: (v: string) => void;
  filter: 'all' | Status;
  setFilter: (v: any) => void;
  selected: Application | null;
  setSelected: (v: Application | null) => void;
  note: string;
  setNote: (v: string) => void;
  updateApp: (a: Application, p: Partial<Application>) => void;
  go: (v: string) => void;
  onImpersonate: (a: Application) => void;
}) {
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] px-5 py-20">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <LockKeyhole className="mx-auto h-10 w-10 text-[#214E9B]" />
          <h1 className="mt-5 text-2xl font-black">Protected Admin Area</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with an authorized administrator PIN to manage affiliates.</p>
          <button onClick={() => go('admin-hub')} className="mt-6 rounded-2xl bg-[#102B59] px-6 py-3 text-sm font-black text-white cursor-pointer">
            Go to Admin Hub
          </button>
        </div>
      </div>
    );
  }

  const filtered = apps.filter(
    a =>
      (filter === 'all' || a.status === filter) &&
      (!search || `${a.basic.fullName} ${a.basic.email} ${a.basic.mobile} ${a.affiliateId}`.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    ['Total Affiliates', apps.length],
    ['Pending Review', apps.filter(a => a.status === 'under_review').length],
    ['Approved & Active', apps.filter(a => a.status === 'approved').length],
    ['Total Clicks', apps.reduce((n, a) => n + (a.clicks || 0), 0)],
    ['Total Referrals', apps.reduce((n, a) => n + a.referrals.length, 0)]
  ];

  const sendWhatsAppApproval = (app: Application) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://auricity.in';
    const text = encodeURIComponent(
      `Namaskar ${app.basic.fullName}! 🎉\n\n` +
      `Congratulations! Your Auricity Affiliate Partner application has been APPROVED by the admin.\n\n` +
      `📌 *Your Partner Credentials:*\n` +
      `• *Affiliate ID:* ${app.affiliateId}\n` +
      `• *Referral Code:* ${app.referralCode}\n` +
      `• *Your Tracking Link:* ${origin}/?ref=${app.referralCode}\n\n` +
      `📲 *How to log in on your phone:*\n` +
      `1. Open Auricity: ${origin}\n` +
      `2. Click on "Affiliate" and choose "Affiliate Login"\n` +
      `3. Enter your Mobile Number (${app.basic.mobile}) or Affiliate ID to access your live Dashboard!\n\n` +
      `Start sharing your link with buyers and sellers in Chhatrapati Sambhajinagar to earn rewards on closed deals. Welcome to the Auricity Partner Network!`
    );

    const cleanPhone = app.basic.mobile.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#B68A32]">Admin · Partner Management</p>
            <h1 className="mt-1 text-3xl font-black">Affiliate Creators & Partners</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => go('affiliate-landing')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black cursor-pointer hover:bg-slate-50">
              View Public Portal
            </button>
            <button onClick={() => go('admin-hub')} className="rounded-xl bg-[#102B59] text-white px-4 py-2 text-xs font-black cursor-pointer">
              Admin Hub
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(([t, v]) => (
            <div key={String(t)} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase text-slate-400">{t}</p>
              <p className="mt-2 text-2xl font-black">{v}</p>
            </div>
          ))}
        </div>

        {/* Filter and Search */}
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={`${inputCls} flex-1`}
              placeholder="Search by name, email, mobile, or Affiliate ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className={`${inputCls} sm:max-w-xs`} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="more_information_required">More Information Required</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="pb-3">Applicant / Partner</th>
                  <th>Affiliate ID</th>
                  <th>Mobile Number</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Loading applications…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">No affiliate applications match your filter.</td>
                  </tr>
                ) : (
                  filtered.map(a => (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <p className="font-black text-slate-900">{a.basic.fullName}</p>
                        <p className="text-slate-400 text-[11px]">{a.basic.email}</p>
                      </td>
                      <td className="font-bold font-mono text-slate-800">{a.affiliateId}</td>
                      <td className="font-mono text-slate-700">{a.basic.mobile}</td>
                      <td>{a.profile.affiliateType}</td>
                      <td><Pill status={a.status} /></td>
                      <td className="text-slate-500">{new Date(a.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(a)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Review
                          </button>
                          {a.status === 'approved' && (
                            <button
                              onClick={() => sendWhatsAppApproval(a)}
                              title="Send Login instructions via WhatsApp"
                              className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Review Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-5">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white p-6 sm:rounded-[2rem] sm:p-8 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#B68A32]">Application Review</span>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">{selected.basic.fullName}</h2>
                  <p className="text-xs text-slate-500 font-mono">Affiliate ID: {selected.affiliateId} · Status: {selected.status}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Creator Credentials Box */}
              <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Creator Login & Referral Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Login Mobile</span>
                    <span className="font-mono font-bold text-slate-900">{selected.basic.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Affiliate ID</span>
                    <span className="font-mono font-bold text-slate-900">{selected.affiliateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Referral Code</span>
                    <span className="font-mono font-bold text-slate-900">{selected.referralCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Referral Link</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block">/?ref={selected.referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Grid of information */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ['Email', selected.basic.email],
                  ['City / State', `${selected.basic.city}, ${selected.basic.state}`],
                  ['Affiliate Type', selected.profile.affiliateType],
                  ['Primary Channel', selected.profile.primaryChannel],
                  ['Social Profile', selected.profile.socialProfile || '—'],
                  ['Website', selected.profile.website || '—'],
                  ['Audience Size', selected.profile.audienceSize || '—'],
                  ['Heard From', selected.promotion.heardFrom]
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-slate-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{k}</p>
                    <p className="mt-0.5 break-words text-xs font-black text-slate-800">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-400">Promotion Strategy</p>
                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                  {selected.promotion.strategy || 'No details provided'}
                </p>
              </div>

              {selected.payout?.upiId && (
                <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Payout Details (UPI / Bank)</p>
                  <p className="mt-1 text-xs font-mono font-black text-emerald-950">UPI ID: {selected.payout.upiId}</p>
                  {selected.payout.accountNumber && (
                    <p className="text-xs text-emerald-800">Bank: {selected.payout.accountNumber} ({selected.payout.ifsc})</p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Admin Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  className={inputCls}
                  placeholder="Optional admin review notes or message to applicant..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      updateApp(selected, { status: 'approved', adminNotes: note });
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Partner</span>
                  </button>

                  <button
                    onClick={() => updateApp(selected, { status: 'more_information_required', adminNotes: note })}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Request Info
                  </button>

                  <button
                    onClick={() => updateApp(selected, { status: 'rejected', adminNotes: note })}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>

                {/* Instant WhatsApp & Impersonate Tools */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppApproval(selected)}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2.5 text-xs font-black cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Send WhatsApp Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onImpersonate(selected)}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2.5 text-xs font-black cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#214E9B]" />
                    <span>Test Login As Creator</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ title, go }: { title: string; go: (v: string) => void }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-20">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
        <AlertCircle className="mx-auto h-10 w-10 text-[#214E9B]" />
        <h1 className="mt-5 text-2xl font-black">{title}</h1>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => go('affiliate-login')} className="rounded-2xl bg-[#102B59] px-6 py-3 text-sm font-black text-white cursor-pointer">
            Affiliate Login
          </button>
          <button onClick={() => go('affiliate-landing')} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black cursor-pointer">
            Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
}
