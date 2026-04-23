// Import StrictMode from React to enable additional checks and warnings for the application
import { StrictMode } from 'react'
// Import createRoot from react-dom/client to initialize the React application in the DOM
import { createRoot } from 'react-dom/client'
// Import GoogleOAuthProvider to enable Google Authentication throughout the application
import { GoogleOAuthProvider } from '@react-oauth/google'
// Import the global CSS file for base styles, variables, and typography
import './index.css'
// Import the App-specific CSS file for layout and component-level resets
import './App.css'
// Import the main App component which manages the application's structure and routing
import App from './App.jsx'

// Retrieve the Google Client ID from environment variables for authentication configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Determine if Google Login should be enabled based on the presence of the Client ID
const ENABLE_GOOGLE_LOGIN = Boolean(GOOGLE_CLIENT_ID);

// Create the root element and render the application into the 'root' div
createRoot(document.getElementById('root')).render(
  // Conditionally wrap the application with GoogleOAuthProvider if the Client ID is configured
  ENABLE_GOOGLE_LOGIN ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* StrictMode helps identify potential problems in an application during development */}
      <StrictMode>
        <App />
      </StrictMode>
    </GoogleOAuthProvider>
  ) : (
    // Render without GoogleOAuthProvider if no Client ID is available
    <StrictMode>
      <App />
    </StrictMode>
  ),
)

