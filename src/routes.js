   let accredo = [
    { label: 'Inventory Control', route: '/accredo/products', source: require('./pages/accredo_prods.md') },
    { label: 'Invoicing System', route: '/accredo/sales', source: require('./pages/accredo_sales.md') },
    { label: 'Purchase Orders', route: '/accredo/purchasing', source: require('./pages/accredo_purchase_orders.md') },
    { label: 'Job Costing', route: '/accredo/jobs', source: require('./pages/accredo_jobs.md') },
    { label: 'Company', route: '/accredo/company', source: require('./pages/accredo_company.md') },
  ]
  
  let corefire = [
    { label: 'Jobs', route: '/corefire/jobs', source: require('./pages/corefire_jobs.md') },
    { label: 'Solutions', route: '/corefire/solutions', source: require('./pages/corefire_prods.md') },
    { label: 'Extras', route: '/corefire/extras', source: require('./pages/corefire_extras.md') },
  ]
  
  let random = [
    { label: 'ZeroSSL', route: '/random/zerossl', source: require('./pages/zerossl.md') },
    { label: 'Commands', route: '/random/cmd', source: require('./pages/random.md') },      
  ]
  
  let routes = [
        { label: 'Accredo', route: '/accredo', children: accredo },
        { label: 'CoreFire', route: '/corefire', children: corefire },
        { label: 'Random', route: '/random', children: random }
      ]

  export default routes
