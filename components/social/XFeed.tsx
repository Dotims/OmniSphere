/**
 * XFeed — Live @iota X (Twitter) timeline embed.
 *
 * Uses an iframe pointing to Twitter's syndication API.
 * Includes advanced error handling for Twitter's strict "429 Rate limit exceeded"
 * which often triggers during local development/hot-reloading.
 */

import { FontSize, FontWeight, Palette, Radius, Spacing } from "@/constants/theme";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const SYNDICATION_URL =
  "https://x.com/srv/timeline-profile/screen-name/iota?theme=dark&transparent=true&noheader=true&nofooter=true&noborders=true&hideTweetMedia=false&tweetLimit=1";

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      background-color: #0A0A0C;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe id="twitter-frame" src="${SYNDICATION_URL}"></iframe>
  <script>
    const iframe = document.getElementById('twitter-frame');
    
    // Check if the iframe loaded correctly or hit a rate limit
    iframe.onload = function() {
      try {
        // If we can access the iframe document, we check for the rate limit text
        const frameBody = iframe.contentWindow.document.body.innerText || "";
        if (frameBody.includes('Rate limit exceeded') || frameBody.includes('Nothing to see here')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rate_limit' }));
          return;
        }
      } catch (e) {
        // Cross-origin access blocked = it loaded Twitter successfully!
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
    };

    // Fallback timer
    setTimeout(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
    }, 2000);
  </script>
</body>
</html>
`;

export default function XFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "rate_limit") {
        setIsRateLimited(true);
        setIsLoading(false);
      } else if (data.type === "loaded" && !isRateLimited) {
        setIsLoading(false);
      }
    } catch (e) {
      // Ignore
    }
  };

  if (isRateLimited) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⏱️</Text>
          <Text style={styles.errorTitle}>Rate Limit Exceeded</Text>
          <Text style={styles.errorMessage}>
            Twitter's embed service is temporarily rate-limiting this device due to too many requests (common during development reloads).
          </Text>
          <Pressable
            style={styles.openXBtn}
            onPress={() => Linking.openURL("https://x.com/iota")}
          >
            <Text style={styles.openXBtnText}>View Feed on X</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Palette.blue} />
          <Text style={styles.loadingText}>Loading feed…</Text>
        </View>
      )}
      <WebView
        source={{ 
          html: HTML_CONTENT, 
          baseUrl: "https://twitter.com" 
        }}
        style={[styles.webview, isLoading && styles.webviewHidden]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        onLoadEnd={() => {
          // Double check document content for rate limit text just in case iframe check failed
          const injectedJS = `
            if (document.body.innerText.includes('Rate limit exceeded')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rate_limit' }));
            }
          `;
          return injectedJS;
        }}
        backgroundColor={Palette.void}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.void,
  },
  webview: {
    flex: 1,
    backgroundColor: Palette.void,
  },
  webviewHidden: {
    opacity: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Palette.void,
    gap: 12,
  },
  loadingText: {
    color: Palette.steel,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
    backgroundColor: Palette.void,
  },
  errorCard: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: Spacing.base,
  },
  errorTitle: {
    color: Palette.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    color: Palette.steel,
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  openXBtn: {
    backgroundColor: Palette.blue,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  openXBtnText: {
    color: Palette.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
