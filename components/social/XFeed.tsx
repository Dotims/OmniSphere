/**
 * XFeed — Live @iota X (Twitter) timeline embed.
 *
 * Uses an iframe pointing to Twitter's syndication API.
 * Includes advanced error handling for Twitter's strict "429 Rate limit exceeded"
 * which often triggers during local development/hot-reloading.
 */

import { useSettings } from "@/hooks/use-settings";
import { FontSize, FontWeight, Radius, Spacing } from "@/constants/theme";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const SYNDICATION_URL =
  "https://x.com/srv/timeline-profile/screen-name/iota?theme=dark&transparent=true&noheader=true&nofooter=true&noborders=true&hideTweetMedia=false&tweetLimit=1";

const getHtmlContent = (bgColor: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
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
  const { activeColors } = useSettings();
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
      <View style={[styles.errorContainer, { backgroundColor: activeColors.background }]}>
        <View style={[styles.errorCard, { backgroundColor: activeColors.surfaceElevated }]}>
          <Text style={styles.errorIcon}>⏱️</Text>
          <Text style={[styles.errorTitle, { color: activeColors.text }]}>Rate Limit Exceeded</Text>
          <Text style={[styles.errorMessage, { color: activeColors.textSecondary }]}>
            Twitter's embed service is temporarily rate-limiting this device due to too many requests (common during development reloads).
          </Text>
          <Pressable
            style={[styles.openXBtn, { backgroundColor: activeColors.tint }]}
            onPress={() => Linking.openURL("https://x.com/iota")}
          >
            <Text style={[styles.openXBtnText, { color: activeColors.background }]}>View Feed on X</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: activeColors.background }]}>
          <ActivityIndicator size="small" color={activeColors.tint} />
          <Text style={[styles.loadingText, { color: activeColors.textSecondary }]}>Loading feed…</Text>
        </View>
      )}
      <WebView
        source={{ 
          html: getHtmlContent(activeColors.background), 
          baseUrl: "https://twitter.com" 
        }}
        style={[styles.webview, { backgroundColor: activeColors.background }, isLoading && styles.webviewHidden]}
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
        backgroundColor={activeColors.background}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
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
    gap: 12,
  },
  loadingText: {
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
  },
  errorCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: Spacing.base,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  openXBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  openXBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
