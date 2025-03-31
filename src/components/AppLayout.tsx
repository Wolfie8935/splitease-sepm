
import React from 'react';
import Layout from './Layout';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // AppLayout now simply passes children to Layout
  // This prevents duplicate sidebars/navigation
  return <Layout>{children}</Layout>;
};

export default AppLayout;
