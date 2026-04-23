import { Colors, DarkPalette, LightPalette } from "@/constants/theme";
import { persistLocationCache } from "@/services/validator-location/cache-store";
import * as FileSystem from "expo-file-system/legacy";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "dark" | "light";
export type RefreshInterval = 15000 | 30000 | 60000;

export interface SettingsState {
  theme: ThemeType;
  refreshInterval: RefreshInterval;
  autoRotation: boolean;
}

export interface SettingsContextValue extends SettingsState {
  setTheme: (theme: ThemeType) => void;
  setRefreshInterval: (interval: RefreshInterval) => void;
  setAutoRotation: (auto: boolean) => void;
  clearCache: () => Promise<void>;
  activePalette: typeof DarkPalette | typeof LightPalette;
  activeColors: typeof Colors.dark | typeof Colors.light;
}

const defaultSettings: SettingsState = {
  theme: "dark",
  refreshInterval: 30000,
  autoRotation: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SETTINGS_FILE_PATH = FileSystem.documentDirectory + "omnisphere_settings.json";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const info = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
          const parsed = JSON.parse(content);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.log("Failed to load settings", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async (newSettings: SettingsState) => {
    setSettings(newSettings);
    try {
      await FileSystem.writeAsStringAsync(SETTINGS_FILE_PATH, JSON.stringify(newSettings));
    } catch (err) {
      console.log("Failed to save settings", err);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    saveSettings({ ...settings, [key]: value });
  };

  const clearCache = async () => {
    try {
      // Clears the location cache
      await persistLocationCache({ domains: {}, geo: {} } as any);
    } catch (err) {
      console.log("Failed to clear cache", err);
    }
  };

  const activePalette = settings.theme === "light" ? LightPalette : DarkPalette;
  const activeColors = settings.theme === "light" ? Colors.light : Colors.dark;

  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setTheme: (t) => updateSetting("theme", t),
        setRefreshInterval: (r) => updateSetting("refreshInterval", r),
        setAutoRotation: (a) => updateSetting("autoRotation", a),
        clearCache,
        activePalette,
        activeColors,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
