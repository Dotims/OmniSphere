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
  webviewRef: React.RefObject<WebView | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isReadyRef: React.MutableRefObject<boolean>;
}

export function useGlobeBridge({
  validators,
  coordinatesById,
  webviewRef,
  iframeRef,
  isReadyRef,
}: UseGlobeBridgeOptions) {
  const pendingDataRef = useRef(false);

  const bridgeData = useCallback(() => {
    if (
      (Platform.OS !== "web" && !webviewRef.current) ||
      (Platform.OS === "web" && !iframeRef.current) ||
      !isReadyRef.current ||
      validators.length === 0
    )
      return;

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
      const [lat, lon] = resolvedCoords
        ? [resolvedCoords.lat, resolvedCoords.lon]
        : hashToLatLon(v.iotaAddress);

      return {
        id: v.iotaAddress,
        name: v.name || v.iotaAddress.slice(0, 12),
        lat,
        lon,
        stakeNorm: stakes[i] / maxStake,
      };
    });

    const message = JSON.stringify({ type: "validators", payload });
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    } else {
      webviewRef.current?.postMessage(message);
    }
    pendingDataRef.current = false;
  }, [validators, coordinatesById, webviewRef, iframeRef, isReadyRef]);

  // Push new data whenever validators or coordinates change
  useEffect(() => {
    if (isReadyRef.current) {
      bridgeData();
    } else {
      pendingDataRef.current = true;
    }
  }, [bridgeData, isReadyRef]);

  return { bridgeData, pendingDataRef };
}
