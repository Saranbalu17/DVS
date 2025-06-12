import { StrictMode } from "react"; // Already correct
import React from "react"; // Added explicit React import
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "intro.js/introjs.css";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
 
// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false };
 
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
 
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
 
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}
 
const root = createRoot(document.getElementById("root"));
 
root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
 
// Handle cleanup on unmount
window.addEventListener("unload", () => {
  root.unmount();
});
 