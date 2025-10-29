import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import Home from 'src/Modules/Home/screens/Home'

export default function DeefaultRoutes({
  location,
}: RoutesProps): React.ReactElement | null {
  return (
    <Routes location={location}>
      <Route index element={<Home />} />
    </Routes>
  )
}
