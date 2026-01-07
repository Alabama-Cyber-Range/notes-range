import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Custom grayscale theme for Authenticator
const grayscaleTheme: Theme = {
  name: 'grayscale-theme',
  tokens: {
    colors: {
      background: {
        primary: '#151515',
        secondary: '#2a2a2a'
      },
      font: {
        primary: '#d3d3d3',
        secondary: '#7f7f7f'
      },
      brand: {
        primary: {
          10: '#3f3f3f',
          20: '#3f3f3f',
          40: '#7f7f7f',
          60: '#bebebe',
          80: '#d3d3d3',
          90: '#d3d3d3',
          100: '#d3d3d3'
        }
      }
    },
    components: {
      authenticator: {
        router: {
          borderWidth: '0',
          backgroundColor: '#151515'
        },
        form: {
          padding: '2rem',
          backgroundColor: '#2a2a2a'
        }
      },
      button: {
        primary: {
          backgroundColor: '#bebebe',
          color: '#151515',
          _hover: {
            backgroundColor: '#d3d3d3'
          }
        }
      },
      fieldcontrol: {
        _focus: {
          borderColor: '#bebebe'
        }
      }
    }
  }
};

// Configure Amplify only if config exists
let amplifyConfigured = false;
try {
  // Try to load Amplify configuration
  const configModule = await import('./amplify_outputs.json');
  Amplify.configure(configModule.default);
  amplifyConfigured = true;
  console.log('✅ Amplify configured successfully');
} catch (e) {
  console.warn('⚠️ Amplify not configured - run `npx ampx sandbox` to enable cloud sync.');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Render with Authenticator when Amplify is configured
root.render(
  <React.StrictMode>
    {amplifyConfigured ? (
      <ThemeProvider theme={grayscaleTheme}>
        <div style={{ backgroundColor: '#151515', minHeight: '100vh' }}>
          <Authenticator
            formFields={{
              signIn: {
                username: {
                  placeholder: 'Enter your Email'
                }
              },
              signUp: {
                username: {
                  placeholder: 'Enter your Email'
                }
              }
            }}
          >
            <App />
          </Authenticator>
        </div>
      </ThemeProvider>
    ) : (
      <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#d3d3d3', minHeight: '100vh' }}>
        <h1>⚠️ Amplify Configuration Required</h1>
        <p>To use this app, you need to set up AWS Amplify:</p>
        <ol>
          <li>Run: <code>npx ampx sandbox</code></li>
          <li>This will create amplify_outputs.json</li>
          <li>Refresh this page</li>
        </ol>
      </div>
    )}
  </React.StrictMode>
);
