import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import ERR0R404 from '../screens/ERR0R404'
import NotFound from '../screens/NotFound'

const ErrorRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      <Route path='error'>
        <Route path='404' element={<ERR0R404 />} />
        <Route path='not-found' element={<NotFound />} />
        <Route index element={<NotFound />} />
      </Route>
      {/* Catch-all route for any unmatched paths */}
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default ErrorRoutes
