
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-background border-t py-6 w-full">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground text-center mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} SplitEase. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Created by Aman Goel, Rishaan Yadav and Jayanth Nair
        </p>
      </div>
    </footer>
  );
};

export default Footer;
