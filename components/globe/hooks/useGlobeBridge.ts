/**
 * Hook that bridges validator data from React Native to the globe WebView.
 *
 * Computes stake-normalised marker payloads and sends them to the
 * WebView / iframe whenever the validator list or resolved coordinates change.
 */

import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import type { WebView } from "react-native-webview";

import { hashToLatLon } from "@/utils/spherical-hash";

import type { GlobeViewProps, ValidatorMarkerPayload } from "../types";

interface UseGlobeBridgeOptions {
  validators: GlobeViewProps["validators"];
  coordinatesById: GlobeViewProps["coordinatesById"];
  selectedValidatorIds?: GlobeViewProps["selectedValidatorIds"];
  webviewRef: React.RefObject<WebView | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isReadyRef: React.MutableRefObject<boolean>;
  autoRotation: boolean;
  theme: "dark" | "light";
  activeColors: any;
}

function normalizeLatLon(lat: number, lon: number): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return [lat, lon];
  }

  // Guard against accidental payload flips during refactors.
  if (Math.abs(lon) <= 90 && Math.abs(lat) <= 180) {
    return [lon, lat];
  }

  return null;
}

export function useGlobeBridge({
  validators,
  coordinatesById,
  selectedValidatorIds,
  webviewRef,
  iframeRef,
  isReadyRef,
  autoRotation,
  theme,
  activeColors,
}: UseGlobeBridgeOptions) {
  const pendingDataRef = useRef(false);

  const getUniqueSelectionIds = useCallback(
    () =>
      Array.from(
        new Set(
          (selectedValidatorIds ?? []).filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ),
    [selectedValidatorIds],
  );

  const sendBridgeMessage = useCallback(
    (message: string) => {
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(message, "*");
      } else {
        webviewRef.current?.postMessage(message);
      }
    },
    [webviewRef, iframeRef],
  );

  const bridgeSelection = useCallback(() => {
    if (
      (Platform.OS !== "web" && !webviewRef.current) ||
      (Platform.OS === "web" && !iframeRef.current) ||
      !isReadyRef.current
    )
      return;

    sendBridgeMessage(
      JSON.stringify({
        type: "selection",
        payload: { ids: getUniqueSelectionIds() },
      }),
    );
  }, [
    webviewRef,
    iframeRef,
    isReadyRef,
    sendBridgeMessage,
    getUniqueSelectionIds,
  ]);

  const bridgeValidators = useCallback(() => {
    if (
      (Platform.OS !== "web" && !webviewRef.current) ||
      (Platform.OS === "web" && !iframeRef.current) ||
      !isReadyRef.current
    )
      return;

    // Wait for real coordinates before sending any validator data.
    // This prevents markers from appearing at wrong hashToLatLon()
    // fallback positions during the initial coordinate resolution.
    if (!coordinatesById) return;

    const stakes = validators.map((v) => {
      try {
        return Number(BigInt(v.stakingPoolIotaBalance || "0"));
      } catch {
        return 0;
      }
    });
    const maxStake = Math.max(...stakes, 1);

    const payload: ValidatorMarkerPayload[] = validators.map((v, i) => {
      const resolvedCoords = coordinatesById?.[v.iotaAddress];
      const fallbackCoords = hashToLatLon(v.iotaAddress);
      const candidateCoords = resolvedCoords
        ? [resolvedCoords.lat, resolvedCoords.lon]
        : fallbackCoords;
      const normalizedCoords = normalizeLatLon(
        candidateCoords[0],
        candidateCoords[1],
      );
      const [lat, lon] = normalizedCoords ?? fallbackCoords;

      return {
        id: v.iotaAddress,
        name: v.name || v.iotaAddress.slice(0, 12),
        lat,
        lon,
        stakeNorm: stakes[i] / maxStake,
      };
    });

    sendBridgeMessage(JSON.stringify({ type: "validators", payload }));
  }, [
    validators,
    coordinatesById,
    webviewRef,
    iframeRef,
    isReadyRef,
    sendBridgeMessage,
  ]);

  const bridgeSettings = useCallback(() => {
    if (
      (Platform.OS !== "web" && !webviewRef.current) ||
      (Platform.OS === "web" && !iframeRef.current) ||
      !isReadyRef.current
    )
      return;

    sendBridgeMessage(
      JSON.stringify({
        type: "settings",
        payload: { autoRotation, theme, activeColors },
      }),
    );
  }, [webviewRef, iframeRef, isReadyRef, sendBridgeMessage, autoRotation, theme, activeColors]);

  const bridgeData = useCallback(() => {
    bridgeValidators();
    bridgeSelection();
    bridgeSettings();
    pendingDataRef.current = false;
  }, [bridgeValidators, bridgeSelection, bridgeSettings]);

  // Push new data whenever validators or coordinates change
  useEffect(() => {
    if (isReadyRef.current) {
      bridgeValidators();
    } else {
      pendingDataRef.current = true;
    }
  }, [bridgeValidators, isReadyRef]);

  // Push lightweight selection updates without resending full validator payload.
  useEffect(() => {
    if (!isReadyRef.current) return;
    bridgeSelection();
  }, [bridgeSelection, isReadyRef]);

  // Push settings updates
  useEffect(() => {
    if (!isReadyRef.current) return;
    bridgeSettings();
  }, [bridgeSettings, isReadyRef]);

  return { bridgeData, pendingDataRef };
}
