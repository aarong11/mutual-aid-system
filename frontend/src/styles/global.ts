import { css } from '@emotion/react';

export const theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2c3e50',
    background: '#f5f6fa',
    text: '#2c3e50',
    error: '#e74c3c',
    success: '#2ecc71'
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem'
  }
};

export const globalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    background-color: #f5f6fa;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 1rem;
  }

  p {
    line-height: 1.5;
  }

  /* Leaflet map styles */
  .leaflet-container {
    height: 100%;
    width: 100%;
  }

  .leaflet-div-icon {
    background: none;
    border: none;
  }

  .marker-cluster {
    background-color: rgba(52, 152, 219, 0.6);
    border-radius: 50%;
    color: white;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;