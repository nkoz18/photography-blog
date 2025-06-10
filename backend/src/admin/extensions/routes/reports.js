/**
 * Reports Management Route Configuration
 */

import ReportsManagement from '../components/ReportsManagement';

const route = {
  path: '/reports',
  title: 'Reports',
  Component: ReportsManagement,
  permissions: [
    {
      action: 'plugin::upload.read',
      subject: null,
    },
  ],
};

export default route;