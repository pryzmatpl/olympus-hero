import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ children }) => {
  return (
    <h1 className="text-3xl font-bold text-center mb-4">{children}</h1>
  );
};

export default PageTitle; 