/**
 * Hook that listens for messages from the globe WebView / iframe and
 * dispatches them to the appropriate React Native callbacks.
 *
 * Handles:
 *  - `ready`             → marks the bridge as ready, flushes pending data
 *  - `error`             → logs warnings
 *  - `VALIDATOR_CLICKED` → forwards to `onSelectValidator`
 */

import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";

interface UseGlobeMessagesOptions {
  onSelectValidator?: (id: string | null) => void;
  bridgeData: () => void;
  pendingDataRef: React.MutableRefObject<boolean>;
  isReadyRef: React.MutableRefObject<boolean>;
  validatorCount: number;
}

/**
 * Processes a parsed message object from the WebView.
 * Shared between the native WebView handler and the web iframe listener.
 */
function processMessage(
  data: Record<string, unknown>,
  {
    isReadyRef,
    pendingDataRef,
    bridgeData,
    onSelectValidator,
    validatorCount,
  }: UseGlobeMessagesOptions,
) {
  if (data.type === "ready") {
    isReadyRef.current = true;
    if (pendingDataRef.current || validatorCount > 0) {
      setTimeout(bridgeData, 100);
    }
  }

  if (data.type === "error") {
    console.warn("[GlobeView] WebView error:", data.msg);
  }

  if (data.type === "VALIDATOR_CLICKED" && onSelectValidator) {
    const payload = data.payload as Record<string, unknown> | undefined;
    onSelectValidator((payload?.id as string) || null);
  }
}

export function useGlobeMessages(options: UseGlobeMessagesOptions) {
  const {
    onSelectValidator,
    bridgeData,
    pendingDataRef,
    isReadyRef,
    validatorCount,
  } = options;

  // Web: listen on window "message" events from the iframe
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleWebMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== "string") return;
        const data = JSON.parse(event.data);
        processMessage(data, options);
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", handleWebMessage as EventListener);
    return () =>
      window.removeEventListener("message", handleWebMessage as EventListener);
  }, [onSelectValidator, bridgeData, validatorCount, pendingDataRef, isReadyRef, options]);

  // Native: WebView onMessage callback
  const handleNativeMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        processMessage(data, {
          onSelectValidator,
          bridgeData,
          pendingDataRef,
          isReadyRef,
          validatorCount,
        });
      } catch {
        // ignore
      }
    },
    [onSelectValidator, bridgeData, validatorCount, pendingDataRef, isReadyRef],
  );

  return { handleNativeMessage };
}
