
import React from 'react';
import Footer from './Footer';
import Layout from './Layout';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Layout>
        <div className="flex-grow">
          {children}
        </div>
      </Layout>
      <Footer />
    </div>
  );
};

export default AppLayout;
