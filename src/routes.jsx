import accredo from './pages/accredo.md?raw'
import accredo_prods from './pages/accredo_prods.md?raw'
import accredo_company from './pages/accredo_company.md?raw'

import corefire from './pages/corefire.md?raw'
import corefire_jobs from './pages/corefire_jobs.md?raw'
import corefire_prods from './pages/corefire_prods.md?raw'
import corefire_extras from './pages/corefire_extras.md?raw'

import random from './pages/random.md?raw'
import zerossl from './pages/zerossl.md?raw'
import cmd from './pages/cmd.md?raw'

let KIDS_accredo = [
  { label: 'Inventory Control', route: '/accredo/products', source: accredo_prods },
  { label: 'Company', route: '/accredo/company', source: accredo_company },
]

let KIDS_corefire = [
  { label: 'Jobs', route: '/corefire/jobs', source: corefire_jobs },
  { label: 'Solutions', route: '/corefire/solutions', source: corefire_prods },
  { label: 'Extras', route: '/corefire/extras', source: corefire_extras },
]

let KIDS_random = [
  { label: 'ZeroSSL', route: '/random/zerossl', source: zerossl },
  { label: 'Commands', route: '/random/cmd', source: cmd },
]

let routes = [
  { label: 'Accredo', route: '/accredo', source: accredo, children: KIDS_accredo },
  { label: 'CoreFire', route: '/corefire', source: corefire, children: KIDS_corefire },
  { label: 'Random', route: '/random', source: random, children: KIDS_random }
]

export default routes
