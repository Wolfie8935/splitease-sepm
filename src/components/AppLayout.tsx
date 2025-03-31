
import React from 'react';
import Footer from './Footer';
import Layout from './Layout';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout>
      <div className="flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </div>
    </Layout>
  );
};

export default AppLayout;
