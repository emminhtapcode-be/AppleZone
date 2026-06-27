import React from 'react';

const Footer = () => {
  return (
    <footer style={{ padding: '1rem', background: '#333', color: '#ccc', textAlign: 'center', marginTop: 'auto' }}>
      <p>&copy; {new Date().getFullYear()} AppleZone. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
