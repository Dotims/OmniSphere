/**
 * GlobeView — renders the COBE 3D globe inside a WebView (native)
 * or an iframe (web).
 *
 * All heavy logic has been extracted into sub-modules:
 *  - `globe-html/`  — HTML template, CSS, interaction & rendering scripts
 *  - `hooks/`       — data bridging & message handling
 *  - `types.ts`     — shared interfaces
 */

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AppState,
    AppStateStatus,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

import { useSettings } from "@/hooks/use-settings";
import { COBE_BUNDLE_JS } from "./cobe-source";
import { buildGlobeHTML } from "./globe-html";
import { useGlobeBridge, useGlobeMessages } from "./hooks";
import type { GlobeViewProps } from "./types";

export default function GlobeView({
  validators,
  coordinatesById,
  selectedValidatorIds,
  onSelectValidator,
  onReady,
}: GlobeViewProps) {
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const { autoRotation, activeColors, theme } = useSettings();

  const handleCrash = useCallback(() => {
    console.warn("[GlobeView] WebView process terminated. Remounting...");
    isReadyRef.current = false;
    setWebViewKey((k) => k + 1);
  }, []);

  const htmlSource = useMemo(
    () => ({ html: buildGlobeHTML(COBE_BUNDLE_JS) }),
    [],
  );

  // Bridge validator data into the WebView
  const { bridgeData, pendingDataRef } = useGlobeBridge({
    validators,
    coordinatesById,
    selectedValidatorIds,
    webviewRef,
    iframeRef,
    isReadyRef,
    autoRotation,
    theme,
    activeColors,
  });

  // Handle messages coming back from the WebView
  const { handleNativeMessage } = useGlobeMessages({
    onSelectValidator,
    onReady,
    bridgeData,
    pendingDataRef,
    isReadyRef,
  });

  // Pause globe rendering when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const isAppActive = nextAppState === "active";
      const message = JSON.stringify({
        type: "app_state",
        payload: { active: isAppActive },
      });
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(message, "*");
      } else {
        webviewRef.current?.postMessage(message);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // ── Web: iframe renderer ─────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: activeColors.background },
        ]}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlSource.html}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            height: "100%",
            backgroundColor: activeColors.background,
          }}
        />
      </View>
    );
  }

  // ── Native: WebView renderer ─────────────────────────────
  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.background }]}>
      <WebView
        key={webViewKey}
        ref={webviewRef}
        source={htmlSource}
        style={[styles.webview, { backgroundColor: activeColors.background }]}
        containerStyle={{ backgroundColor: activeColors.background }}
        onMessage={handleNativeMessage}
        onContentProcessDidTerminate={handleCrash}
        onRenderProcessGone={handleCrash}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={false}
        {...(Platform.OS === "android"
          ? {
              androidLayerType: "hardware",
              mixedContentMode: "always" as const,
            }
          : {
              allowsBackForwardNavigationGestures: false,
            })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    minWidth: 1,
    minHeight: 1,
  },
  webview: {
    flex: 1,
    width: "100%",
    height: "100%",
    minWidth: 1,
    minHeight: 1,
    opacity: 1,
    backgroundColor: "transparent",
  },
});
