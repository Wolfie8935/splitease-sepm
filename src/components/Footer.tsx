
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-background border-t mt-auto py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground text-center mb-2 md:mb-0">
          Created by Aman Goel, Rishaan Yadav and Jayanth Nair
        </p>
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} SplitEase. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
