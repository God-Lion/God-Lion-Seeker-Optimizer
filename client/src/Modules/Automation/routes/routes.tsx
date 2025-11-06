import { lazy } from 'react';
import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import AuthRoute from 'src/components/guards/AuthRoute';

const AutomationHub = lazy(() => import('src/Modules/Automation/screens/AutomationHub'));

const AutomationRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      <Route index element={
        <AuthRoute element={
          <AutomationHub />
        }/>
      } />
    </Routes>
  )
}
export default AutomationRoutes





