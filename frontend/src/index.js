import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Initialize Capacitor
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Capacitor app initialization
const initCapacitor = async () => {
  try {
    // Hide splash screen after app loads
    await SplashScreen.hide();
    
    // Set status bar style for dark theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#09090b' });
  } catch (error) {
    // Running in browser, Capacitor plugins not available
    console.log('Running in browser mode');
  }
};

// Handle back button on Android
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    CapApp.exitApp();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Initialize Capacitor after render
initCapacitor();
