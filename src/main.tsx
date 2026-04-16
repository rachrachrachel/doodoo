import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { CLERK_PUBLISHABLE_KEY } from '@/lib/clerk'
import { App } from './App'
import './styles/tokens.css'

const clerkAppearance = {
  variables: {
    colorPrimary: '#1B1B1B',
    colorBackground: '#F5F3EE',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#1B1B1B',
    colorText: '#1B1B1B',
    colorTextSecondary: '#888880',
    colorDanger: '#e05252',
    colorSuccess: '#4caf7d',
    borderRadius: '14px',
    fontFamily: '"DM Sans", sans-serif',
    fontFamilyButtons: '"Syne", sans-serif',
    fontSize: '15px',
  },
  elements: {
    // Fondo de la card principal
    card: {
      background: '#FFFFFF',
      boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      border: 'none',
    },
    // Header
    headerTitle: {
      fontFamily: '"Syne", sans-serif',
      fontWeight: '800',
      color: '#1B1B1B',
    },
    headerSubtitle: {
      color: '#888880',
    },
    // Botón primario (Sign in)
    formButtonPrimary: {
      background: '#1B1B1B',
      color: '#F2E840',
      fontFamily: '"Syne", sans-serif',
      fontWeight: '800',
      fontSize: '15px',
      borderRadius: '12px',
      boxShadow: 'none',
      '&:hover': {
        background: '#2d2d2d',
      },
    },
    // Inputs
    formFieldInput: {
      background: '#F5F3EE',
      border: '2px solid transparent',
      borderRadius: '12px',
      color: '#1B1B1B',
      '&:focus': {
        border: '2px solid #F2E840',
        background: '#FFFFFF',
      },
    },
    formFieldLabel: {
      color: '#1B1B1B',
      fontWeight: '500',
    },
    // Botones sociales (Google, etc.)
    socialButtonsBlockButton: {
      background: '#FFFFFF',
      border: '2px solid #ebebeb',
      borderRadius: '12px',
      color: '#1B1B1B',
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: '500',
      '&:hover': {
        background: '#F5F3EE',
        border: '2px solid #d4d4d0',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#1B1B1B',
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: '500',
    },
    // Divider
    dividerLine: {
      background: '#e8e6e0',
    },
    dividerText: {
      color: '#aaa9a3',
    },
    // Links
    footerActionLink: {
      color: '#1B1B1B',
      fontWeight: '600',
      '&:hover': {
        color: '#555',
      },
    },
    identityPreviewText: {
      color: '#1B1B1B',
    },
    // Fondo de toda la página
    rootBox: {
      width: '100%',
    },
    pageScrollBox: {
      background: '#F5F3EE',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={clerkAppearance}>
      <App />
    </ClerkProvider>
  </StrictMode>
)
