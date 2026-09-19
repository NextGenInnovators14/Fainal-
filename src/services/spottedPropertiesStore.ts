import { SpottedProperty } from '../types';

export const SPOTTED_STORE_KEY = 'auricity_spotted_properties_v1';

// Seed initial realistic data for Chhatrapati Sambhajinagar
const SEED_SPOTTED_PROPERTIES: SpottedProperty[] = [
  {
    id: 'spot-csn-101',
    spottedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: 'contacted_owner',
    photoUrl: 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&auto=format&fit=crop&q=80',
    locality: 'CIDCO N-5 (Cannought Garden)',
    landmark: 'Opposite Domino\'s, Near Cidco Bus Stop',
    propertyType: 'Commercial Shop (Ground Floor)',
    listingPurpose: 'rent',
    expectedPriceOrRent: '₹35,000 / month',
    boardContactNumber: '9822045612',
    boardContactName: 'Mr. Patwardhan (Owner)',
    notes: 'Ground floor corner shop with rolling shutter. "To-Let Shop Available" flex banner hanging outside with phone number.',
    spotter: {
      name: 'Aman (Zohaib Aman)',
      mobile: '4668430420',
      upiId: 'aman4668@oksbi',
      affiliateId: 'AUR-AF-2026-T9T7WJ',
      email: 'zohaib0aman@gmail.com'
    },
    adminReview: {
      reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      reviewedBy: 'Super Admin',
      adminNotes: 'Spoke with Mr. Patwardhan. Shop is 320 sqft, ready for immediate handover. Verification done. We will list it and pay ₹3,500 bounty to Aman once tenant agreement is signed.',
      bountyAmount: 3500,
      bountyStatus: 'approved'
    }
  },
  {
    id: 'spot-csn-102',
    spottedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: 'new',
    photoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    locality: 'Samarth Nagar',
    landmark: 'Near Tapadiya Natya Mandir, Lane 3',
    propertyType: '2 BHK Apartment / Flat',
    listingPurpose: 'rent',
    expectedPriceOrRent: '₹18,000 / month',
    boardContactNumber: '9423187654',
    boardContactName: 'Landlord Board',
    notes: 'Second floor balcony has a yellow To-Let board. Family only. Car parking available.',
    spotter: {
      name: 'Pooja Deshmukh',
      mobile: '9890123456',
      upiId: 'pooja.desh@okaxis',
      email: 'pooja.deshmukh@gmail.com'
    },
    adminReview: {
      bountyAmount: 1800,
      bountyStatus: 'pending'
    }
  },
  {
    id: 'spot-csn-103',
    spottedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    status: 'converted_listing',
    photoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    locality: 'Beed Bypass Road',
    landmark: 'Near MIT College Junction, Opposite HP Petrol Pump',
    propertyType: 'Commercial Corner Plot / Land',
    listingPurpose: 'sale',
    expectedPriceOrRent: '₹1.85 Cr',
    boardContactNumber: '9850987123',
    boardContactName: 'Kulkarni Builders / Owner',
    notes: 'Corner plot 3,500 sqft with boundary wall and "Commercial NA Plot For Sale" signboard on main highway touch road.',
    spotter: {
      name: 'Sachin Patil',
      mobile: '9765432109',
      upiId: 'sachin.patil@paytm',
      affiliateId: 'AUR-AF-2026-SP89',
      email: 'sachin.patil@outlook.com'
    },
    adminReview: {
      reviewedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      reviewedBy: 'Super Admin',
      adminNotes: 'Verified clear title with owner. Listed as verified commercial plot on Auricity. ₹10,000 spotter bounty allotted upon sale registry.',
      bountyAmount: 10000,
      bountyStatus: 'approved',
      convertedPropertyId: 'prop-plot-beed-103'
    }
  }
];

export async function loadSpottedProperties(): Promise<SpottedProperty[]> {
  try {
    const res = await fetch(`/api/store/${SPOTTED_STORE_KEY}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.value) && data.value.length > 0) {
        localStorage.setItem(SPOTTED_STORE_KEY, JSON.stringify(data.value));
        return data.value;
      }
    }
  } catch (err) {
    console.warn('Could not read from store API, checking localStorage', err);
  }

  try {
    const local = localStorage.getItem(SPOTTED_STORE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Seed store if empty
  await saveSpottedProperties(SEED_SPOTTED_PROPERTIES);
  return SEED_SPOTTED_PROPERTIES;
}

export async function saveSpottedProperties(items: SpottedProperty[]): Promise<void> {
  localStorage.setItem(SPOTTED_STORE_KEY, JSON.stringify(items));
  try {
    await fetch(`/api/store/${SPOTTED_STORE_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: items })
    });
  } catch (err) {
    console.warn('Could not persist to store API', err);
  }
}

export async function addSpottedProperty(
  entry: Omit<SpottedProperty, 'id' | 'spottedAt' | 'status'>
): Promise<SpottedProperty> {
  const current = await loadSpottedProperties();
  const newItem: SpottedProperty = {
    ...entry,
    id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    spottedAt: new Date().toISOString(),
    status: 'new',
    adminReview: {
      bountyStatus: 'pending',
      bountyAmount: entry.listingPurpose === 'rent' ? 2000 : 5000
    }
  };

  const next = [newItem, ...current];
  await saveSpottedProperties(next);
  return newItem;
}

export async function updateSpottedProperty(
  id: string,
  patch: Partial<SpottedProperty>
): Promise<SpottedProperty[]> {
  const current = await loadSpottedProperties();
  const next = current.map(item => {
    if (item.id !== id) return item;
    return {
      ...item,
      ...patch,
      adminReview: {
        ...(item.adminReview || {}),
        ...(patch.adminReview || {})
      }
    };
  });
  await saveSpottedProperties(next);
  return next;
}

export async function deleteSpottedProperty(id: string): Promise<SpottedProperty[]> {
  const current = await loadSpottedProperties();
  const next = current.filter(item => item.id !== id);
  await saveSpottedProperties(next);
  return next;
}
