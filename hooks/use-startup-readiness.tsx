import React from "react";

interface StartupReadinessContextValue {
  isReadyForNativeSplash: boolean;
  setInitialDataResolved: (resolved: boolean) => void;
  setGlobeReady: (ready: boolean) => void;
}

const StartupReadinessContext =
  React.createContext<StartupReadinessContextValue | null>(null);

export function StartupReadinessProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialDataResolved, setInitialDataResolved] = React.useState(false);
  const [isGlobeReady, setGlobeReady] = React.useState(false);

  const isReadyForNativeSplash = isInitialDataResolved && isGlobeReady;

  const value = React.useMemo(
    () => ({
      isReadyForNativeSplash,
      setInitialDataResolved,
      setGlobeReady,
    }),
    [isReadyForNativeSplash],
  );

  return (
    <StartupReadinessContext.Provider value={value}>
      {children}
    </StartupReadinessContext.Provider>
  );
}

export function useStartupReadiness() {
  const context = React.useContext(StartupReadinessContext);

  if (!context) {
    throw new Error(
      "useStartupReadiness must be used within StartupReadinessProvider",
    );
  }

  return context;
}
