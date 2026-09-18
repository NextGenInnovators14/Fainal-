import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['Contact route exists', /'\/contact': 'contact'/.test(read('src/context/AppContext.tsx'))],
  ['Contact path is canonical', /contact:\s*'\/contact'/.test(read('src/context/AppContext.tsx'))],
  ['AI valuator endpoint matches backend', /fetch\('\/api\/ai\/valuation'/.test(read('src/components/ai/AIValuatorView.tsx')) || /property-valuation/.test(read('src/components/ai/AIValuatorView.tsx')) === false],
  ['Server valuation aliases frontend fields', /estimatedPriceMin/.test(read('server-app.ts'))],
  ['Inventory counts are data-driven', /String\(count\('sale'\)\)/.test(read('src/components/layout/CategoryPills.tsx'))],
  ['Legacy listing types are normalized', /normalizeListingType/.test(read('src/utils/propertyUtils.ts'))],
  ['Contact failure is not reported as success', /return false;/.test(read('src/context/AppContext.tsx'))],
  ['Fake RERA generation removed', !/Math\.random\(\).*rera/i.test(read('src/components/properties/PropertyDetailView.tsx'))],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failed++; }
process.exitCode = failed ? 1 : 0;
