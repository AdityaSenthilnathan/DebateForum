
import React from "react";

type PageLayoutProps = {
  children: React.ReactNode;
  darkMode?: boolean;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, darkMode }) => {
  return (
    <html className={`h-full ${darkMode ? "dark-mode" : "light-mode"}`}>
      <body className="h-full">{children}</body>
    </html>
  );
};

export default PageLayout;
