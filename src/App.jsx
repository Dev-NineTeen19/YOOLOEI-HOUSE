import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/common/ScrollToTop";
import { seedInitialDormitoriesIfEmpty } from "./utils/seedData";

function App() {
  useEffect(() => {
    seedInitialDormitoriesIfEmpty();
  }, []);
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />

      <SiteSettingsProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

export default App;