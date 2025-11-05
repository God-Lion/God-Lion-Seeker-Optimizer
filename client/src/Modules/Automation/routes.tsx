import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import AuthRoute from 'src/components/guards/AuthRoute';

const AutomationHub = lazy(() => import('./screens/AutomationHub'));

const AutomationRoutes: RouteObject[] = [
  {
    path: '/automation',
    element: (
      <AuthRoute>
        <AutomationHub />
      </AuthRoute>
    ),
  },
];

export default AutomationRoutes;
