
import React from 'react';
import Layout from './Layout';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
};

export default AppLayout;
