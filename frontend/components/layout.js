import React, { useEffect } from "react";
import Nav from "./nav";
import Footer from "./footer";

/**
 * Layout component with proper sticky footer
 * Uses a combination of CSS and inline styles to ensure the footer
 * stays at the bottom even with short content
 */
const Layout = ({ children, categories, seo }) => {
  // Add styles directly to ensure we're affecting the right elements
  useEffect(() => {
    // Make sure the Next.js wrapper has full height
    if (document.getElementById('__next')) {
      document.getElementById('__next').style.minHeight = '100vh';
      document.getElementById('__next').style.display = 'flex';
      document.getElementById('__next').style.flexDirection = 'column';
    }
    
    // Add styles to html and body
    document.documentElement.style.height = '100%';
    document.body.style.minHeight = '100%';
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.margin = '0';
    
    return () => {
      // Clean up styles when component unmounts
      if (document.getElementById('__next')) {
        document.getElementById('__next').style.minHeight = '';
        document.getElementById('__next').style.display = '';
        document.getElementById('__next').style.flexDirection = '';
      }
      
      document.documentElement.style.height = '';
      document.body.style.minHeight = '';
      document.body.style.display = '';
      document.body.style.flexDirection = '';
      document.body.style.margin = '';
    };
  }, []);

  return (
    <>
      <Nav categories={categories} />
      <div className="content-wrapper">
        {children}
      </div>
      <Footer />
    </>
  );
};

export default Layout;