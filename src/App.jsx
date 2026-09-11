import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
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
    <HashRouter>
      <ScrollToTop />
      <SiteSettingsProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </SiteSettingsProvider>
    </HashRouter>
  );
}

export default App;