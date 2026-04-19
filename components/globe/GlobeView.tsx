/**
 * GlobeView — renders the COBE 3D globe inside a WebView (native)
 * or an iframe (web).
 *
 * All heavy logic has been extracted into sub-modules:
 *  - `globe-html/`  — HTML template, CSS, interaction & rendering scripts
 *  - `hooks/`       — data bridging & message handling
 *  - `types.ts`     — shared interfaces
 */

import React, { useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { COBE_BUNDLE_JS } from "./cobe-source";
import { buildGlobeHTML } from "./globe-html";
import { useGlobeBridge, useGlobeMessages } from "./hooks";
import type { GlobeViewProps } from "./types";

export default function GlobeView({
  validators,
  coordinatesById,
  selectedValidatorIds,
  onSelectValidator,
}: GlobeViewProps) {
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const isReadyRef = useRef(false);

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
  });

  // Handle messages coming back from the WebView
  const { handleNativeMessage } = useGlobeMessages({
    onSelectValidator,
    bridgeData,
    pendingDataRef,
    isReadyRef,
  });

  // ── Web: iframe renderer ─────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlSource.html}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  // ── Native: WebView renderer ─────────────────────────────
  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={htmlSource}
        style={styles.webview}
        onMessage={handleNativeMessage}
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
    backgroundColor: "#05060A",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
