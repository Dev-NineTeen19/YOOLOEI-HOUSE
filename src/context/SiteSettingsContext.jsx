import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/apiClient";

const SiteSettingsContext = createContext();

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    siteName: "อยู่เลย เฮาส์",
    siteNameEn: "YOOLOEI HOUSE",
    siteLogo: "/images/logo.png",
    adminEmail: "admin@yooloei.com",
    contactPhone: "042-123-456",
    autoApproveDorms: "manual"
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get("/settings");
      if (data) {
        const newSettings = {
          siteName: data.site_name || "อยู่เลย เฮาส์",
          siteNameEn: data.site_name_en || "YOOLOEI HOUSE",
          siteLogo: data.site_logo || "/images/logo.png",
          adminEmail: data.admin_email || "admin@yooloei.com",
          contactPhone: data.contact_phone || "042-123-456",
          autoApproveDorms: data.auto_approve_dorms || "manual"
        };
        setSettings(newSettings);
        if (newSettings.siteName) {
          document.title = `${newSettings.siteName} - ${newSettings.siteNameEn}`;
        }
      }
    } catch (err) {
      console.error("Failed to fetch site settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (payload) => {
    const apiPayload = {
      site_name: payload.siteName,
      site_name_en: payload.siteNameEn,
      site_logo: payload.siteLogo,
      admin_email: payload.adminEmail,
      contact_phone: payload.contactPhone,
      auto_approve_dorms: payload.autoApproveDorms
    };

    const res = await api.put("/admin/settings", apiPayload);
    if (res.settings) {
      const updated = {
        siteName: res.settings.site_name || payload.siteName,
        siteNameEn: res.settings.site_name_en || payload.siteNameEn,
        siteLogo: res.settings.site_logo || payload.siteLogo,
        adminEmail: res.settings.admin_email || payload.adminEmail,
        contactPhone: res.settings.contact_phone || payload.contactPhone,
        autoApproveDorms: res.settings.auto_approve_dorms || payload.autoApproveDorms
      };
      setSettings(updated);
      if (updated.siteName) {
        document.title = `${updated.siteName} - ${updated.siteNameEn}`;
      }
    }
    return res;
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, refreshSettings: fetchSettings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    return {
      settings: {
        siteName: "อยู่เลย เฮาส์",
        siteNameEn: "YOOLOEI HOUSE",
        siteLogo: "/images/logo.png",
        adminEmail: "admin@yooloei.com",
        contactPhone: "042-123-456",
        autoApproveDorms: "manual"
      },
      updateSettings: async () => {},
      refreshSettings: async () => {},
      loading: false
    };
  }
  return context;
};
