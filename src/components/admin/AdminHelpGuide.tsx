import React from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';

interface GuideStep {
  emoji: string;
  title: string;
  hinglish: string;
  steps: string[];
  goToTab?: string;
  goToLabel?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    emoji: '🪄',
    title: 'Homepage ko Khud Edit Karna',
    hinglish: 'Website ko preview ke saath visually edit karo ya AI ko message likhkar change karvao',
    steps: [
      '"🏠 Home Page Editor" kholo — yahi se homepage ke sections ka order aur visibility control hota hai',
      'Kisi section ko select karke heading, description, image, layout, spacing aur auto-scroll badlo',
      'AI box mein likho: “Sale properties upar lao, Services hide karo aur hero heading change karo”',
      'Brand & Favicon mein logo/favicon badlo; Save & Publish ke baad changes persist hote hain'
    ],
    goToTab: 'home_editor',
    goToLabel: 'Home Page Editor kholo'
  },
  {
    emoji: '🏠',
    title: 'Nayi Property/Listing Daalna',
    hinglish: 'Website par ek nayi property dikhani hai',
    steps: [
      '"Sari Properties" tab kholo, ya upar "+ Create Direct Listing" button dabao',
      'Property ka title, price, area, locality, aur photos bharo',
      '"Save" dabate hi property turant website par sabko dikhne lagegi'
    ],
    goToTab: 'listings',
    goToLabel: 'Properties tab kholo'
  },
  {
    emoji: '👥',
    title: 'Customer Inquiry (Lead) Dekhna aur Reply Dena',
    hinglish: 'Jab koi customer kisi property ke baare mein poochta hai',
    steps: [
      '"Customer Inquiries" tab mein sabhi naye messages dikhte hain',
      '"WhatsApp Buyer" button dabao — seedha WhatsApp khulega us customer ke number par',
      'Baat ho jaane ke baad status badal do: New → Contacted → Site Visit → Deal Closed',
      'Galti se delete na ho isliye Delete dabane par ek baar confirm karne ko poochega'
    ],
    goToTab: 'leads',
    goToLabel: 'Customer Inquiries kholo'
  },
  {
    emoji: '📋',
    title: 'Service Booking Dekhna',
    hinglish: 'Packers, legal check, cleaning jaisi service koi book kare toh',
    steps: [
      '"Service Bookings" tab mein customer ka naam, number aur konsi service chahiye — sab dikhega',
      '"WhatsApp Pro" dabake seedha customer se baat karo'
    ],
    goToTab: 'bookings',
    goToLabel: 'Service Bookings kholo'
  },
  {
    emoji: '✏️',
    title: 'Website ka Text ya Photo Badalna',
    hinglish: 'Home page, About page, ya kisi bhi page ka likha hua ya photo change karna hai',
    steps: [
      '"Website Pages" mein jaake jo page badalna hai woh chuno',
      'Text ki jagah naya text likho, ya "Photos" tab se naya photo upload karo',
      'Save dabao — change turant website par live ho jayega'
    ],
    goToTab: 'cms_pages',
    goToLabel: 'Website Pages kholo'
  },
  {
    emoji: '🎨',
    title: 'Website ka Color/Design Badalna',
    hinglish: 'Website ka overall look-color change karna hai',
    steps: [
      '"Design" tab mein jaake naya color choose karo',
      'Right side mein turant preview dikhega ki website kaisi lagegi',
      'Pasand aaye toh apply/save kar do'
    ],
    goToTab: 'theme',
    goToLabel: 'Design tab kholo'
  },
  {
    emoji: '⚙️',
    title: 'Phone Number / Email / Address Badalna',
    hinglish: 'Support ka contact number ya office address update karna hai',
    steps: [
      '"Settings" tab kholo',
      'Naya number, email, ya address likho',
      '"Save Platform Settings" dabao'
    ],
    goToTab: 'settings',
    goToLabel: 'Settings kholo'
  }
];

export const AdminHelpGuide: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-3xl shadow-xs">
        <div className="flex items-center space-x-2 mb-1">
          <HelpCircle className="w-6 h-6" />
          <h2 className="text-lg font-black">Madad / Guide — Kaise Use Karein</h2>
        </div>
        <p className="text-xs text-emerald-50 max-w-2xl">
          Har roz ke kaam yahan simple steps mein samjhaye gaye hain. Jo karna hai uska card dhundo,
          neeche diye button se seedha uss jagah pahunch jaoge.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE_STEPS.map((g) => (
          <div key={g.title} className="bg-[var(--surface)] p-5 rounded-3xl border border-[var(--border)] shadow-xs space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-2xl leading-none">{g.emoji}</span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">{g.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">{g.hinglish}</p>
              </div>
            </div>
            <ol className="text-xs text-[var(--text-primary)] space-y-1.5 list-decimal list-inside">
              {g.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {g.goToTab && (
              <button
                onClick={() => onNavigate(g.goToTab as string)}
                className="w-full mt-1 flex items-center justify-center space-x-1.5 bg-[var(--surface-secondary)] hover:bg-slate-100 text-[var(--primary)] text-xs font-black px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>{g.goToLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-1">
        <h3 className="font-black text-sm text-amber-900">❓ Kuch Samajh Nahi Aaya Ya Problem Aaya?</h3>
        <p className="text-xs text-amber-800">
          Jo bhi page ya button confusing lage, uska screenshot lekar apne developer ko bhej do — exact
          bata do kya karna tha aur kya hua. Isse problem jaldi aur sahi tarike se theek ho payegi.
        </p>
      </div>
    </div>
  );
};
