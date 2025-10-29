import React from 'react'

if (import.meta.env.DEV) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    
    trackHooks: true,
    
    trackExtraHooks: [[require('react-redux/lib'), 'useSelector']],
    
    logOnDifferentValues: true,
    
    collapseGroups: true,
    
    titleColor: 'green',
    
    diffNameColor: 'darkturquoise',
    
    include: [/.*/],
    
    exclude: [
      /^BrowserRouter/,
      /^Link/,
      /^Route/,
      /^Router/,
    ],
    
    notifyOnChange: false,
  })
}

export {}
