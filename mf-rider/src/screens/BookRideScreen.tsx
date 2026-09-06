import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  cancelRide,
  createRide,
  getRide,
  listMyRides,
} from "../api/ride";

import type { Ride } from "../api/ride";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/colors";

interface BookRideScreenProps {
  onBack: () => void;
}

const ACTIVE_STATUSES: Ride["status"][] = [
  "REQUESTED",
  "ACCEPTED",
  "STARTED",
];

const POLL_INTERVAL_MS = 6000;

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlaceSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
}

interface SelectedPlace {
  address: string;
  latitude: number;
  longitude: number;
}

export function BookRideScreen({
  onBack,
}: BookRideScreenProps) {
  const { token } = useAuth();

  // ============================================================
  // LOCATION SEARCH STATE
  // ============================================================

  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] =
    useState("");

  const [pickupLatitude, setPickupLatitude] =
    useState<number | null>(null);

  const [pickupLongitude, setPickupLongitude] =
    useState<number | null>(null);

  const [destinationLatitude, setDestinationLatitude] =
    useState<number | null>(null);

  const [destinationLongitude, setDestinationLongitude] =
    useState<number | null>(null);

  const [pickupSuggestions, setPickupSuggestions] =
    useState<PlaceSuggestion[]>([]);

  const [destinationSuggestions, setDestinationSuggestions] =
    useState<PlaceSuggestion[]>([]);

  const [searchingPickup, setSearchingPickup] =
    useState(false);

  const [searchingDestination, setSearchingDestination] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const pickupSearchTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const destinationSearchTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================================
  // RIDE STATE
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [restoringRide, setRestoringRide] =
    useState(true);

  const [ride, setRide] = useState<Ride | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");

  // ============================================================
  // SIMPLE AI TRAVEL ASSISTANT
  // ============================================================
  // The assistant works locally even when no AI backend is configured.
  // If EXPO_PUBLIC_AI_API_URL is configured later, the same chat can use
  // your real AI service without changing this screen's UI.
  const [aiMessage, setAiMessage] = useState("");
  const [aiReply, setAiReply] = useState(
    "Hi 👋 I can help you choose a place, understand your ride, estimate your trip, or explain what to do next. You can type normally — simple words are okay."
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiChat, setShowAiChat] = useState(true);

  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeMinutes, setRouteMinutes] = useState<number | null>(null);
  const [routeEstimateReady, setRouteEstimateReady] = useState(false);

  const pollTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================================
  // SMALL DISTANCE HELPER
  // ============================================================

  function calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ============================================================
  // LOCAL AI TRAVEL ASSISTANT
  // ============================================================

  async function askTravelAssistant(overrideMessage?: string) {
    const message = (overrideMessage ?? aiMessage).trim();

    if (!message) {
      setAiReply("Please type what you need. For example: 'I want to go to Goa' or 'Is this ride expensive?'");
      return;
    }

    setAiLoading(true);

    try {
      const aiApiUrl = process.env.EXPO_PUBLIC_AI_API_URL;

      if (aiApiUrl) {
        try {
          const response = await fetch(aiApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message,
              pickup: pickupAddress.trim() || null,
              destination: destinationAddress.trim() || null,
              pickupLatitude,
              pickupLongitude,
              destinationLatitude,
              destinationLongitude,
              app: "MF Rides Rider",
              language: "simple English",
            }),
          });

          const data = await response.json();

          if (response.ok) {
            const serverReply =
              data?.reply ??
              data?.message ??
              data?.answer ??
              data?.response ??
              data?.data?.reply;

            if (typeof serverReply === "string" && serverReply.trim()) {
              setAiReply(serverReply.trim());
              setAiMessage("");
              return;
            }
          }
        } catch (aiError) {
          console.warn("⚠️ AI BACKEND UNAVAILABLE — USING LOCAL ASSISTANT:", aiError);
        }
      }

      const lower = message.toLowerCase();

      if (lower.includes("help") || lower.includes("support") || lower.includes("problem")) {
        setAiReply(
          "I can help. First tell me what happened. If this is urgent, use the 24/7 Customer Care button below. For a normal ride problem, keep your ride screen open so the latest status can be checked."
        );
      } else if (lower.includes("cheap") || lower.includes("budget") || lower.includes("price") || lower.includes("cost")) {
        setAiReply(
          "For a lower-cost trip, keep the pickup and destination exact, compare the available ride type, and avoid unnecessary stops. I can also explain the route after you choose both places."
        );
      } else if (lower.includes("where") || lower.includes("go") || lower.includes("trip") || lower.includes("journey")) {
        setAiReply(
          destinationAddress.trim()
            ? `Your destination is ${destinationAddress.trim()}. I will keep the trip simple: pickup → route → destination. Check the route preview below before confirming.`
            : "Tell me the place you want to go. Example: 'I want to go from Hyderabad to Goa'. I will help you step by step."
        );
      } else if (lower.includes("explain") || lower.includes("how")) {
        setAiReply(
          "Easy steps: 1) choose pickup, 2) choose destination, 3) check the route preview, 4) press Confirm Ride, 5) wait for a partner. You do not need to understand technical words."
        );
      } else {
        setAiReply(
          "Got it 👍 I can help with your ride. Try one of these: 'help me', 'cheapest ride', 'explain my ride', or tell me your destination."
        );
      }

      setAiMessage("");
    } finally {
      setAiLoading(false);
    }
  }

  // ============================================================
  // ROUTE PREVIEW
  // ============================================================

  function updateRoutePreview(
    nextPickupLatitude: number | null = pickupLatitude,
    nextPickupLongitude: number | null = pickupLongitude,
    nextDestinationLatitude: number | null = destinationLatitude,
    nextDestinationLongitude: number | null = destinationLongitude,
  ) {
    if (
      nextPickupLatitude === null ||
      nextPickupLongitude === null ||
      nextDestinationLatitude === null ||
      nextDestinationLongitude === null
    ) {
      setRouteDistanceKm(null);
      setRouteMinutes(null);
      setRouteEstimateReady(false);
      return;
    }

    const distance = calculateDistanceKm(
      nextPickupLatitude,
      nextPickupLongitude,
      nextDestinationLatitude,
      nextDestinationLongitude,
    );

    // This is an intentionally conservative road-time estimate, not a fare quote.
    const estimatedMinutes = Math.max(5, Math.round((distance / 28) * 60));

    setRouteDistanceKm(Number(distance.toFixed(1)));
    setRouteMinutes(estimatedMinutes);
    setRouteEstimateReady(true);
  }

  async function openRouteInMaps() {
    if (
      pickupLatitude === null ||
      pickupLongitude === null ||
      destinationLatitude === null ||
      destinationLongitude === null
    ) {
      setErrorMessage("Please select both pickup and destination first.");
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${pickupLatitude},${pickupLongitude}` +
      `&destination=${destinationLatitude},${destinationLongitude}` +
      `&travelmode=driving`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setErrorMessage("Unable to open the map on this device.");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error("❌ MAP OPEN ERROR:", error);
      setErrorMessage("Unable to open the route map.");
    }
  }

  // ============================================================
  // 24/7 CUSTOMER CARE
  // ============================================================

  async function openCustomerCare() {
    const supportPhone = process.env.EXPO_PUBLIC_SUPPORT_PHONE;

    if (!supportPhone) {
      setAiReply(
        "24/7 Customer Care is ready. The AI assistant is available here now. To enable direct phone support, add EXPO_PUBLIC_SUPPORT_PHONE to your rider .env file."
      );
      setShowAiChat(true);
      return;
    }

    const phoneUrl = `tel:${supportPhone}`;

    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error("❌ SUPPORT CALL ERROR:", error);
      setAiReply("I could not open the phone app. Please use the AI assistant here for immediate guidance.");
      setShowAiChat(true);
    }
  }

  // ============================================================
  // STOP POLLING
  // ============================================================

  function stopPolling() {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  // ============================================================
  // GOOGLE PLACES AUTOCOMPLETE
  // ============================================================

  async function searchGooglePlaces(
    input: string,
  ): Promise<PlaceSuggestion[]> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error(
        "Google Maps API key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.",
      );
    }

    const trimmed = input.trim();

    if (trimmed.length < 2) {
      return [];
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
        },
        body: JSON.stringify({
          input: trimmed,
          includedRegionCodes: ["in"],
          languageCode: "en",
        }),
      },
    );

    const data = await response.json();

    console.log(
      "📍 GOOGLE PLACES STATUS:",
      response.status,
    );

    if (!response.ok) {
      console.error(
        "❌ GOOGLE PLACES ERROR:",
        data,
      );

      throw new Error(
        data?.error?.message ||
          "Google Places search failed.",
      );
    }

    const suggestions =
      Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];

    return suggestions
      .map((item: any) => {
        const prediction =
          item?.placePrediction;

        if (!prediction?.placeId) {
          return null;
        }

        return {
          placeId: prediction.placeId,
          title:
            prediction?.structuredFormat
              ?.mainText?.text ||
            prediction?.text?.text ||
            "",
          subtitle:
            prediction?.structuredFormat
              ?.secondaryText?.text ||
            "",
        };
      })
      .filter(Boolean);
  }

  // ============================================================
  // GOOGLE PLACE DETAILS
  // ============================================================

  async function getGooglePlaceDetails(
    placeId: string,
  ): Promise<SelectedPlace> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error(
        "Google Maps API key is missing.",
      );
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(
        placeId,
      )}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "location,formattedAddress,displayName",
        },
      },
    );

    const data = await response.json();

    console.log(
      "📍 PLACE DETAILS STATUS:",
      response.status,
    );

    if (!response.ok) {
      console.error(
        "❌ PLACE DETAILS ERROR:",
        data,
      );

      throw new Error(
        data?.error?.message ||
          "Unable to get selected location.",
      );
    }

    const latitude = data?.location?.latitude;
    const longitude = data?.location?.longitude;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      throw new Error(
        "Selected location does not have valid coordinates.",
      );
    }

    return {
      address:
        data?.formattedAddress ||
        data?.displayName?.text ||
        "Selected location",
      latitude,
      longitude,
    };
  }

  // ============================================================
  // GOOGLE GEOCODING
  // ============================================================

  async function geocodeAddress(
    input: string,
  ): Promise<SelectedPlace> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error(
        "Google Maps API key is missing. Create .env in mf-rider and add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.",
      );
    }

    const trimmed = input.trim();

    if (!trimmed) {
      throw new Error("Please enter a destination.");
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        trimmed,
      )}&key=${encodeURIComponent(
        GOOGLE_MAPS_API_KEY,
      )}&region=in&language=en`;

    const response = await fetch(url);
    const data = await response.json();

    console.log(
      "📍 GEOCODING STATUS:",
      response.status,
      data?.status,
    );

    if (!response.ok || data?.status !== "OK") {
      console.error(
        "❌ GEOCODING ERROR:",
        data,
      );

      if (
        data?.status === "REQUEST_DENIED"
      ) {
        throw new Error(
          "Google Geocoding API request was denied. Check billing, API key restrictions, and Geocoding API.",
        );
      }

      if (
        data?.status === "ZERO_RESULTS"
      ) {
        throw new Error(
          `Location "${trimmed}" could not be found. Please enter a more specific place.`,
        );
      }

      throw new Error(
        data?.error_message ||
          "Unable to find this location.",
      );
    }

    const result = data?.results?.[0];

    const latitude =
      result?.geometry?.location?.lat;
    const longitude =
      result?.geometry?.location?.lng;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      throw new Error(
        "Google could not return valid coordinates for this location.",
      );
    }

    return {
      address:
        result?.formatted_address ||
        trimmed,
      latitude,
      longitude,
    };
  }

  // ============================================================
  // SEARCH PICKUP
  // ============================================================

  function handlePickupChange(value: string) {
    setPickupAddress(value);

    // Manual edit means previous coordinates are no longer trusted.
    setPickupLatitude(null);
    setPickupLongitude(null);

    setLocationError("");

    if (pickupSearchTimerRef.current !== null) {
      clearTimeout(pickupSearchTimerRef.current);
    }

    if (value.trim().length < 2) {
      setPickupSuggestions([]);
      return;
    }

    pickupSearchTimerRef.current =
      setTimeout(async () => {
        try {
          setSearchingPickup(true);

          const results =
            await searchGooglePlaces(value);

          setPickupSuggestions(results);
        } catch (error) {
          console.error(
            "❌ PICKUP SEARCH ERROR:",
            error,
          );

          setPickupSuggestions([]);
        } finally {
          setSearchingPickup(false);
        }
      }, 350);
  }

  // ============================================================
  // SEARCH DESTINATION
  // ============================================================

  function handleDestinationChange(
    value: string,
  ) {
    setDestinationAddress(value);

    // Manual edit means previous coordinates are no longer trusted.
    setDestinationLatitude(null);
    setDestinationLongitude(null);

    setErrorMessage("");

    if (
      destinationSearchTimerRef.current !== null
    ) {
      clearTimeout(
        destinationSearchTimerRef.current,
      );
    }

    if (value.trim().length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    destinationSearchTimerRef.current =
      setTimeout(async () => {
        try {
          setSearchingDestination(true);

          const results =
            await searchGooglePlaces(value);

          setDestinationSuggestions(results);
        } catch (error) {
          console.error(
            "❌ DESTINATION SEARCH ERROR:",
            error,
          );

          setDestinationSuggestions([]);
        } finally {
          setSearchingDestination(false);
        }
      }, 350);
  }

  // ============================================================
  // SELECT PICKUP
  // ============================================================

  async function selectPickupPlace(
    suggestion: PlaceSuggestion,
  ) {
    try {
      setSearchingPickup(true);
      setPickupSuggestions([]);

      const place =
        await getGooglePlaceDetails(
          suggestion.placeId,
        );

      setPickupAddress(place.address);
      setPickupLatitude(place.latitude);
      setPickupLongitude(place.longitude);
      updateRoutePreview(
        place.latitude,
        place.longitude,
        destinationLatitude,
        destinationLongitude,
      );

      console.log(
        "📍 PICKUP SELECTED:",
        place,
      );
    } catch (error) {
      console.error(
        "❌ PICKUP SELECTION ERROR:",
        error,
      );

      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to select pickup location.",
      );
    } finally {
      setSearchingPickup(false);
    }
  }

  // ============================================================
  // SELECT DESTINATION
  // ============================================================

  async function selectDestinationPlace(
    suggestion: PlaceSuggestion,
  ) {
    try {
      setSearchingDestination(true);
      setDestinationSuggestions([]);

      const place =
        await getGooglePlaceDetails(
          suggestion.placeId,
        );

      setDestinationAddress(place.address);
      setDestinationLatitude(place.latitude);
      setDestinationLongitude(place.longitude);
      updateRoutePreview(
        pickupLatitude,
        pickupLongitude,
        place.latitude,
        place.longitude,
      );

      console.log(
        "📍 DESTINATION SELECTED:",
        place,
      );
    } catch (error) {
      console.error(
        "❌ DESTINATION SELECTION ERROR:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to select destination.",
      );
    } finally {
      setSearchingDestination(false);
    }
  }

  // ============================================================
  // CURRENT DEVICE LOCATION
  // ============================================================

  async function detectCurrentLocation() {
    try {
      setLocationLoading(true);
      setLocationError("");
      setPickupSuggestions([]);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !==
        Location.PermissionStatus.GRANTED
      ) {
        setLocationError(
          "Location permission is required.",
        );
        return;
      }

      const current =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude =
        current.coords.latitude;

      const longitude =
        current.coords.longitude;

      setPickupLatitude(latitude);
      setPickupLongitude(longitude);
      updateRoutePreview(
        latitude,
        longitude,
        destinationLatitude,
        destinationLongitude,
      );

      // First try Google reverse geocoding so the rider
      // sees a real area/place name instead of coordinates.
      try {
        const url =
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(
            GOOGLE_MAPS_API_KEY || "",
          )}&language=en&region=in`;

        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error("Missing Google Maps API key");
        }

        const response = await fetch(url);
        const data = await response.json();

        console.log(
          "📍 REVERSE GEOCODING:",
          response.status,
          data?.status,
        );

        if (
          response.ok &&
          data?.status === "OK" &&
          data?.results?.[0]?.formatted_address
        ) {
          setPickupAddress(
            data.results[0].formatted_address,
          );
        } else {
          throw new Error(
            data?.error_message ||
              "Google reverse geocoding failed.",
          );
        }
      } catch (googleError) {
        console.warn(
          "⚠️ GOOGLE REVERSE GEOCODING FAILED:",
          googleError,
        );

        // Fallback to Expo's native reverse geocoder.
        try {
          const addresses =
            await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });

          if (addresses.length > 0) {
            const address = addresses[0];

            const parts = [
              address.name,
              address.street,
              address.district,
              address.city,
              address.region,
            ].filter(Boolean);

            setPickupAddress(
              parts.length > 0
                ? parts.join(", ")
                : `${latitude.toFixed(
                    6,
                  )}, ${longitude.toFixed(6)}`,
            );
          } else {
            setPickupAddress(
              `${latitude.toFixed(
                6,
              )}, ${longitude.toFixed(6)}`,
            );
          }
        } catch {
          setPickupAddress(
            `${latitude.toFixed(
              6,
            )}, ${longitude.toFixed(6)}`,
          );
        }
      }

      console.log(
        "📍 CURRENT PICKUP:",
        latitude,
        longitude,
      );
    } catch (error) {
      console.error(
        "❌ LOCATION ERROR:",
        error,
      );

      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to detect your current location.",
      );
    } finally {
      setLocationLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOCATION
  // ============================================================

  useEffect(() => {
    detectCurrentLocation();

    return () => {
      if (
        pickupSearchTimerRef.current !== null
      ) {
        clearTimeout(
          pickupSearchTimerRef.current,
        );
      }

      if (
        destinationSearchTimerRef.current !==
        null
      ) {
        clearTimeout(
          destinationSearchTimerRef.current,
        );
      }

      stopPolling();
    };
  }, []);

  // ============================================================
  // RESTORE ACTIVE RIDE
  // ============================================================

  useEffect(() => {
    if (!token) {
      setRestoringRide(false);
      return;
    }

    let cancelled = false;

    async function restoreActiveRide() {
      try {
        setRestoringRide(true);
        setErrorMessage("");

        console.log(
          "🔍 CHECKING RIDER ACTIVE RIDE...",
        );

        const result =
          await listMyRides(token);

        if (cancelled) {
          return;
        }

        const activeRide =
          result.rides.find((item) =>
            ACTIVE_STATUSES.includes(
              item.status,
            ),
          ) ?? null;

        if (activeRide) {
          console.log(
            "✅ ACTIVE RIDE RESTORED:",
            activeRide.id,
            activeRide.status,
          );

          setRide(activeRide);
        } else {
          setRide(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "❌ ACTIVE RIDE RESTORE ERROR:",
            error,
          );
        }
      } finally {
        if (!cancelled) {
          setRestoringRide(false);
        }
      }
    }

    restoreActiveRide();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ============================================================
  // RIDE STATUS POLLING
  // ============================================================

  useEffect(() => {
    stopPolling();

    if (
      !ride ||
      !token ||
      !ACTIVE_STATUSES.includes(
        ride.status,
      )
    ) {
      return;
    }

    pollTimerRef.current =
      setInterval(async () => {
        try {
          const result =
            await getRide(
              ride.id,
              token,
            );

          setRide(result.ride);
        } catch (error) {
          console.error(
            "❌ RIDE STATUS POLL ERROR:",
            error,
          );
        }
      }, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [
    ride?.id,
    ride?.status,
    token,
  ]);

  // ============================================================
  // BOOK NEW RIDE
  // ============================================================

  async function handleBookRide() {
    if (loading || restoringRide) {
      return;
    }

    setErrorMessage("");

    if (!pickupAddress.trim()) {
      setErrorMessage(
        "Please enter your pickup place or tap 📍 to use your current location.",
      );
      return;
    }

    if (!destinationAddress.trim()) {
      setErrorMessage(
        "Please enter a destination.",
      );
      return;
    }

    if (!token) {
      setErrorMessage(
        "Your login session has expired. Please login again.",
      );
      return;
    }

    if (
      ride &&
      ACTIVE_STATUSES.includes(
        ride.status,
      )
    ) {
      setErrorMessage(
        "You already have an active ride. Please finish or cancel it first.",
      );
      return;
    }

    setLoading(true);

    try {
      // If the rider typed a pickup but did not tap a Google suggestion,
      // resolve it automatically so Confirm Ride does not stay disabled.
      let finalPickupAddress = pickupAddress.trim();
      let finalPickupLatitude = pickupLatitude;
      let finalPickupLongitude = pickupLongitude;

      if (
        finalPickupLatitude === null ||
        finalPickupLongitude === null
      ) {
        const pickupPlace = await geocodeAddress(finalPickupAddress);
        finalPickupAddress = pickupPlace.address;
        finalPickupLatitude = pickupPlace.latitude;
        finalPickupLongitude = pickupPlace.longitude;

        setPickupAddress(pickupPlace.address);
        setPickupLatitude(pickupPlace.latitude);
        setPickupLongitude(pickupPlace.longitude);
      }

      updateRoutePreview(
        finalPickupLatitude,
        finalPickupLongitude,
        destinationLatitude,
        destinationLongitude,
      );

      // If the rider typed a destination but did not
      // tap a Google suggestion, resolve it automatically.
      let finalDestinationAddress =
        destinationAddress.trim();

      let finalDestinationLatitude =
        destinationLatitude;

      let finalDestinationLongitude =
        destinationLongitude;

      if (
        finalDestinationLatitude === null ||
        finalDestinationLongitude === null
      ) {
        const place =
          await geocodeAddress(
            finalDestinationAddress,
          );

        finalDestinationAddress =
          place.address;

        finalDestinationLatitude =
          place.latitude;

        finalDestinationLongitude =
          place.longitude;

        setDestinationAddress(
          place.address,
        );
        setDestinationLatitude(
          place.latitude,
        );
        setDestinationLongitude(
          place.longitude,
        );
      }

      updateRoutePreview(
        finalPickupLatitude,
        finalPickupLongitude,
        finalDestinationLatitude,
        finalDestinationLongitude,
      );

      console.log(
        "🚕 CREATING RIDE",
      );

      console.log({
        pickupAddress: finalPickupAddress,
        pickupLatitude: finalPickupLatitude,
        pickupLongitude: finalPickupLongitude,
        destinationAddress:
          finalDestinationAddress,
        destinationLatitude:
          finalDestinationLatitude,
        destinationLongitude:
          finalDestinationLongitude,
      });

      const result =
        await createRide(
          {
            pickupAddress:
              finalPickupAddress,

            pickupLatitude:
              finalPickupLatitude,

            pickupLongitude:
              finalPickupLongitude,

            destinationAddress:
              finalDestinationAddress,

            destinationLatitude:
              finalDestinationLatitude,

            destinationLongitude:
              finalDestinationLongitude,
          },
          token,
        );

      console.log(
        "✅ CREATE RIDE RESULT:",
        result,
      );

      if (!result?.ride?.id) {
        throw new Error(
          "Ride was created, but the server returned an unexpected response.",
        );
      }

      setRide(result.ride);
      setErrorMessage("");
    } catch (error) {
      console.error(
        "❌ BOOK RIDE ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create ride.";

      if (
        message
          .toLowerCase()
          .includes("active ride")
      ) {
        try {
          const result =
            await listMyRides(token);

          const activeRide =
            result.rides.find((item) =>
              ACTIVE_STATUSES.includes(
                item.status,
              ),
            ) ?? null;

          if (activeRide) {
            setRide(activeRide);
            setErrorMessage("");
            return;
          }
        } catch (restoreError) {
          console.error(
            "❌ ACTIVE RIDE RECOVERY ERROR:",
            restoreError,
          );
        }
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CANCEL RIDE CONFIRMATION
  // ============================================================

  function confirmCancelRide() {
    if (!ride || loading) {
      return;
    }

    if (
      ride.status !== "REQUESTED" &&
      ride.status !== "ACCEPTED"
    ) {
      Alert.alert(
        "Cannot Cancel",
        "This ride cannot be cancelled at the current stage.",
      );

      return;
    }

    Alert.alert(
      "Cancel Ride?",
      "Are you sure you want to cancel this ride?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: handleCancelRide,
        },
      ],
    );
  }

  // ============================================================
  // CANCEL RIDE
  // ============================================================

  async function handleCancelRide() {
    if (
      !ride ||
      !token ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result =
        await cancelRide(
          ride.id,
          token,
          "Cancelled by passenger",
        );

      if (!result?.ride) {
        throw new Error(
          "Ride cancellation response was invalid.",
        );
      }

      setRide(result.ride);

      stopPolling();
      setErrorMessage("");
    } catch (error) {
      console.error(
        "❌ CANCEL RIDE ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to cancel ride.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // BACK FROM RIDE
  // ============================================================

  function handleBackFromRide() {
    if (
      ride &&
      ACTIVE_STATUSES.includes(
        ride.status,
      )
    ) {
      return;
    }

    stopPolling();

    setRide(null);
    setErrorMessage("");

    onBack();
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (restoringRide) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          My Rides
        </Text>

        <View style={styles.restoreBox}>
          <ActivityIndicator
            size="large"
            color={colors.accent}
          />

          <Text style={styles.restoreTitle}>
            Checking your active ride...
          </Text>

          <Text style={styles.restoreText}>
            Please wait while we restore
            your current ride.
          </Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <View style={styles.container}>
      <Pressable
        onPress={
          ride &&
          ACTIVE_STATUSES.includes(
            ride.status,
          )
            ? undefined
            : onBack
        }
        disabled={
          loading ||
          Boolean(
            ride &&
              ACTIVE_STATUSES.includes(
                ride.status,
              ),
          )
        }
      >
        <Text
          style={[
            styles.backText,
            ride &&
            ACTIVE_STATUSES.includes(
              ride.status,
            )
              ? styles.backTextDisabled
              : null,
          ]}
        >
          ← Back
        </Text>
      </Pressable>

      <Text style={styles.title}>
        {ride
          ? "Your Ride"
          : "Book a Ride"}
      </Text>

      <Text style={styles.subtitle}>
        {ride
          ? "Your current ride details"
          : "Choose pickup and destination"}
      </Text>

      {/* LOCATION ERROR */}

      {locationError ? (
        <View style={styles.locationErrorBox}>
          <Text style={styles.locationErrorTitle}>
            📍 Location Problem
          </Text>

          <Text style={styles.locationErrorText}>
            {locationError}
          </Text>
        </View>
      ) : null}

      {/* ACTIVE RIDE */}

      {ride ? (
        <RideStatusCard
          ride={ride}
          onBack={handleBackFromRide}
          onCancel={confirmCancelRide}
          loading={loading}
        />
      ) : null}

      {/* ERROR */}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Something went wrong
          </Text>

          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* NEW BOOKING */}

      {!ride ? (
        <>
          {/* PICKUP */}

          <Text style={styles.label}>
            Pickup location
          </Text>

          <View style={styles.locationInputBox}>
            <TextInput
              style={styles.locationInput}
              placeholder="Search pickup location"
              placeholderTextColor={
                colors.textMuted
              }
              value={pickupAddress}
              onChangeText={
                handlePickupChange
              }
              editable={!loading}
            />

            {searchingPickup ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
              />
            ) : null}

            <Pressable
              onPress={
                detectCurrentLocation
              }
              disabled={
                locationLoading ||
                loading
              }
              style={styles.locationButton}
            >
              {locationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                />
              ) : (
                <Text
                  style={
                    styles.locationIcon
                  }
                >
                  📍
                </Text>
              )}
            </Pressable>
          </View>

          {pickupSuggestions.length >
          0 ? (
            <PlaceSuggestions
              suggestions={
                pickupSuggestions
              }
              onSelect={
                selectPickupPlace
              }
            />
          ) : null}

          {pickupLatitude !== null &&
          pickupLongitude !== null ? (
            <Text style={styles.selectedText}>
              ✓ Pickup selected
            </Text>
          ) : (
            <Text style={styles.helperText}>
              Search a place or use your
              current location
            </Text>
          )}

          {/* DESTINATION */}

          <Text style={styles.label}>
            Destination
          </Text>

          <View style={styles.locationInputBox}>
            <TextInput
              style={styles.locationInput}
              placeholder="Where do you want to go?"
              placeholderTextColor={
                colors.textMuted
              }
              value={
                destinationAddress
              }
              onChangeText={
                handleDestinationChange
              }
              editable={!loading}
            />

            {searchingDestination ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
              />
            ) : null}
          </View>

          {destinationSuggestions.length >
          0 ? (
            <PlaceSuggestions
              suggestions={
                destinationSuggestions
              }
              onSelect={
                selectDestinationPlace
              }
            />
          ) : null}

          {destinationLatitude !==
            null &&
          destinationLongitude !==
            null ? (
            <Text style={styles.selectedText}>
              ✓ Destination selected
            </Text>
          ) : (
            <Text style={styles.helperText}>
              Type a place name and tap Confirm Ride.
              I will find the location automatically, or you can select a Google suggestion.
            </Text>
          )}

          {/* ======================================================
           * EASY AI HELP
           * ====================================================== */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeaderRow}>
              <View style={styles.aiTitleWrap}>
                <Text style={styles.aiIcon}>✨</Text>
                <View>
                  <Text style={styles.aiTitle}>MF AI Travel Helper</Text>
                  <Text style={styles.aiSubtitle}>Simple help — no technical words needed</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowAiChat((value) => !value)}
                style={styles.aiToggleButton}
              >
                <Text style={styles.aiToggleText}>
                  {showAiChat ? "Hide" : "Chat"}
                </Text>
              </Pressable>
            </View>

            {showAiChat ? (
              <>
                <View style={styles.aiReplyBox}>
                  <Text style={styles.aiReplyLabel}>AI</Text>
                  <Text style={styles.aiReplyText}>{aiReply}</Text>
                </View>

                <View style={styles.quickPromptRow}>
                  <Pressable
                    style={styles.quickPromptButton}
                    onPress={() => askTravelAssistant("Help me with my ride")}>
                    <Text style={styles.quickPromptText}>Help me</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickPromptButton}
                    onPress={() => askTravelAssistant("Find the cheapest option")}>
                    <Text style={styles.quickPromptText}>Cheapest</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickPromptButton}
                    onPress={() => askTravelAssistant("Explain my ride simply")}>
                    <Text style={styles.quickPromptText}>Explain</Text>
                  </Pressable>
                </View>

                <View style={styles.aiInputRow}>
                  <TextInput
                    style={styles.aiInput}
                    value={aiMessage}
                    onChangeText={setAiMessage}
                    placeholder="Ask anything… e.g. I want to go to Goa"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    editable={!aiLoading}
                    onSubmitEditing={() => askTravelAssistant()}
                  />
                  <Pressable
                    style={[styles.aiSendButton, aiLoading && styles.buttonDisabled]}
                    onPress={() => askTravelAssistant()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.aiSendText}>Send</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>

          {/* ======================================================
           * ROUTE PREVIEW
           * ====================================================== */}
          {routeEstimateReady ? (
            <View style={styles.routeCard}>
              <View style={styles.routeHeaderRow}>
                <Text style={styles.routeTitle}>🗺️ Your journey path</Text>
                <Text style={styles.routeBadge}>READY</Text>
              </View>

              <View style={styles.routeLine}>
                <View style={styles.routeDotStart} />
                <View style={styles.routeDashedLine} />
                <View style={styles.routeDotEnd} />
              </View>

              <View style={styles.routeTextBox}>
                <Text style={styles.routeFrom} numberOfLines={1}>
                  {pickupAddress}
                </Text>
                <Text style={styles.routeArrow}>↓</Text>
                <Text style={styles.routeTo} numberOfLines={1}>
                  {destinationAddress}
                </Text>
              </View>

              <View style={styles.routeStatsRow}>
                <View style={styles.routeStat}>
                  <Text style={styles.routeStatValue}>
                    {routeDistanceKm ?? "—"} km
                  </Text>
                  <Text style={styles.routeStatLabel}>Approx. distance</Text>
                </View>
                <View style={styles.routeStat}>
                  <Text style={styles.routeStatValue}>
                    {routeMinutes ?? "—"} min
                  </Text>
                  <Text style={styles.routeStatLabel}>Approx. travel time</Text>
                </View>
              </View>

              <Text style={styles.routeNote}>
                This is a quick estimate. Actual road distance, traffic and fare can change.
              </Text>

              <Pressable style={styles.mapButton} onPress={openRouteInMaps}>
                <Text style={styles.mapButtonText}>Open full route map</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ======================================================
           * 24/7 CUSTOMER CARE
           * ====================================================== */}
          <Pressable
            style={styles.supportCard}
            onPress={openCustomerCare}
          >
            <View style={styles.supportIconCircle}>
              <Text style={styles.supportIcon}>☎</Text>
            </View>

            <View style={styles.supportTextBox}>
              <Text style={styles.supportTitle}>
                24/7 Customer Care + AI
              </Text>
              <Text style={styles.supportText}>
                Need help? Tap here. The AI helper is available anytime.
              </Text>
            </View>

            <Text style={styles.supportArrow}>›</Text>
          </Pressable>

          {/* CONFIRM */}

          <Pressable
            style={[
              styles.button,
              (loading ||
                restoringRide ||
                !pickupAddress.trim() ||
                !destinationAddress.trim()) &&
                styles.buttonDisabled,
            ]}
            onPress={handleBookRide}
            disabled={
              loading ||
              restoringRide ||
              !pickupAddress.trim() ||
              !destinationAddress.trim()
            }
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Requesting Ride..."
                : "Confirm Ride"}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

// ============================================================
// PLACE SUGGESTIONS
// ============================================================

interface PlaceSuggestionsProps {
  suggestions: PlaceSuggestion[];
  onSelect: (
    suggestion: PlaceSuggestion,
  ) => void;
}

function PlaceSuggestions({
  suggestions,
  onSelect,
}: PlaceSuggestionsProps) {
  return (
    <View style={styles.suggestionsBox}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) =>
          item.placeId
        }
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.suggestionRow}
            onPress={() =>
              onSelect(item)
            }
          >
            <Text
              style={styles.suggestionIcon}
            >
              📍
            </Text>

            <View
              style={
                styles.suggestionTextBox
              }
            >
              <Text
                style={
                  styles.suggestionTitle
                }
                numberOfLines={1}
              >
                {item.title}
              </Text>

              {item.subtitle ? (
                <Text
                  style={
                    styles.suggestionSubtitle
                  }
                  numberOfLines={2}
                >
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// ============================================================
// RIDE STATUS CARD
// ============================================================

interface RideStatusCardProps {
  ride: Ride;
  onBack: () => void;
  onCancel: () => void;
  loading: boolean;
}

function RideStatusCard({
  ride,
  onBack,
  onCancel,
  loading,
}: RideStatusCardProps) {
  const content =
    getRideStatusContent(ride);

  const showOtp =
    (ride.status === "REQUESTED" ||
      ride.status === "ACCEPTED") &&
    !!ride.otpCode;

  const canCancel =
    ride.status === "REQUESTED" ||
    ride.status === "ACCEPTED";

  return (
    <View style={styles.successBox}>
      <Text style={styles.successTitle}>
        {content.emoji}{" "}
        {content.heading}
      </Text>

      <Text style={styles.successText}>
        {content.body}
      </Text>

      <View style={styles.detailsBox}>
        <Text style={styles.detailLabel}>
          PICKUP
        </Text>

        <Text style={styles.detailValue}>
          📍 {ride.pickupAddress}
        </Text>

        <Text
          style={[
            styles.detailLabel,
            styles.destinationLabel,
          ]}
        >
          DESTINATION
        </Text>

        <Text style={styles.detailValue}>
          📍 {ride.destinationAddress}
        </Text>
      </View>

      {ride.rider ? (
        <View style={styles.partnerBox}>
          <Text style={styles.partnerTitle}>
            👤 Partner Details
          </Text>

          <Text style={styles.partnerName}>
            {ride.rider.fullName}
          </Text>

          <Text style={styles.partnerPhone}>
            📞 {ride.rider.phoneNumber}
          </Text>
        </View>
      ) : null}

      {showOtp ? (
        <View style={styles.otpBox}>
          <Text style={styles.otpLabel}>
            🔐 YOUR RIDE OTP
          </Text>

          <Text style={styles.otpCode}>
            {ride.otpCode}
          </Text>

          <Text style={styles.otpHint}>
            Share this 4-digit OTP with
            your partner when you are ready
            to start the ride.
          </Text>
        </View>
      ) : null}

      {ride.status === "REQUESTED" ? (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingTitle}>
            🔎 Looking for a partner
          </Text>

          <Text style={styles.waitingText}>
            Please wait while we find a
            nearby partner for you.
          </Text>
        </View>
      ) : null}

      {ride.status === "ACCEPTED" ? (
        <View style={styles.acceptedBox}>
          <Text style={styles.acceptedTitle}>
            ✅ Partner Accepted
          </Text>

          <Text style={styles.acceptedText}>
            Your ride is confirmed. Your
            partner will ask for the OTP
            before starting the ride.
          </Text>
        </View>
      ) : null}

      {ride.status === "STARTED" ? (
        <View style={styles.startedBox}>
          <Text style={styles.startedTitle}>
            🚗 Ride Started
          </Text>

          <Text style={styles.startedText}>
            Your OTP has been verified.
            Have a safe journey!
          </Text>
        </View>
      ) : null}

      {canCancel ? (
        <Pressable
          style={[
            styles.cancelButton,
            loading &&
              styles.buttonDisabled,
          ]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text
            style={
              styles.cancelButtonText
            }
          >
            {loading
              ? "Cancelling..."
              : "Cancel Ride"}
          </Text>
        </Pressable>
      ) : null}

      {ride.status === "COMPLETED" ? (
        <Pressable
          style={styles.homeButton}
          onPress={onBack}
        >
          <Text style={styles.buttonText}>
            Back to Home
          </Text>
        </Pressable>
      ) : null}

      {ride.status === "CANCELLED" ? (
        <View>
          <Text style={styles.cancelledText}>
            This ride has been cancelled.
          </Text>

          <Pressable
            style={styles.homeButton}
            onPress={onBack}
          >
            <Text style={styles.buttonText}>
              Book New Ride
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ============================================================
// STATUS CONTENT
// ============================================================

function getRideStatusContent(
  ride: Ride,
): {
  emoji: string;
  heading: string;
  body: string;
} {
  switch (ride.status) {
    case "REQUESTED":
      return {
        emoji: "🔎",
        heading: "Ride Requested",
        body:
          "Your ride request has been sent. We are looking for a nearby partner.",
      };

    case "ACCEPTED":
      return {
        emoji: "✅",
        heading: "Partner Assigned",
        body: ride.rider
          ? `${ride.rider.fullName} has accepted your ride.`
          : "A partner has accepted your ride.",
      };

    case "STARTED":
      return {
        emoji: "🚗",
        heading: "Ride In Progress",
        body: ride.rider
          ? `Your ride with ${ride.rider.fullName} has started.`
          : "Your ride has started.",
      };

    case "COMPLETED":
      return {
        emoji: "🏁",
        heading: "Ride Completed",
        body:
          "Thanks for riding with MF Rides!",
      };

    case "CANCELLED":
      return {
        emoji: "❌",
        heading: "Ride Cancelled",
        body: ride.cancellationReason
          ? `Reason: ${ride.cancellationReason}`
          : "This ride was cancelled.",
      };

    default:
      return {
        emoji: "🚕",
        heading: "Ride",
        body: `Ride ID: ${ride.id}`,
      };
  }
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },

  backText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },

  backTextDisabled: {
    opacity: 0.35,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },

  locationInputBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
  },

  locationInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },

  locationButton: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },

  locationIcon: {
    fontSize: 21,
  },

  suggestionsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 4,
    maxHeight: 210,
    overflow: "hidden",
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  suggestionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },

  suggestionTextBox: {
    flex: 1,
  },

  suggestionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  suggestionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  selectedText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 5,
  },

  locationErrorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#d9534f",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  locationErrorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#d9534f",
  },

  locationErrorText: {
    marginTop: 4,
    color: colors.text,
    fontSize: 13,
  },

  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#d9534f",
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  errorTitle: {
    color: "#d9534f",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },

  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },

  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  homeButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },

  successBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  successTitle: {
    color: colors.accent,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },

  successText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },

  detailsBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
  },

  destinationLabel: {
    marginTop: spacing.md,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 4,
  },

  partnerBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  partnerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  partnerName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },

  partnerPhone: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  otpBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#e0b000",
    alignItems: "center",
  },

  otpLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  otpCode: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 10,
    color: colors.accent,
    marginVertical: spacing.sm,
  },

  otpHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },

  waitingBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  waitingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },

  waitingText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },

  acceptedBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  acceptedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.accent,
  },

  acceptedText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  startedBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accent,
  },

  startedTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.accent,
  },

  startedText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  cancelButton: {
    backgroundColor: "#d9534f",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },

  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelledText: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: 14,
    color: colors.textMuted,
  },

  aiCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  aiTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  aiIcon: {
    fontSize: 25,
    marginRight: spacing.sm,
  },

  aiTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },

  aiSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  aiToggleButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.background,
  },

  aiToggleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },

  aiReplyBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  aiReplyLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4,
  },

  aiReplyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },

  quickPromptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },

  quickPromptButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#e0b000",
  },

  quickPromptText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },

  aiInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.sm,
  },

  aiInput: {
    flex: 1,
    minHeight: 45,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 14,
  },

  aiSendButton: {
    minHeight: 45,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  aiSendText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  routeCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },

  routeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  routeTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },

  routeBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
  },

  routeLine: {
    width: 24,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  routeDotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },

  routeDashedLine: {
    height: 34,
    width: 2,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    borderStyle: "dashed",
  },

  routeDotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },

  routeTextBox: {
    marginTop: -63,
    marginLeft: 34,
    marginBottom: spacing.md,
  },

  routeFrom: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  routeArrow: {
    color: colors.textMuted,
    fontSize: 16,
    marginVertical: 3,
  },

  routeTo: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  routeStatsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  routeStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  routeStatValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  routeStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  routeNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.md,
  },

  mapButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
  },

  mapButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },

  supportCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#e0b000",
    flexDirection: "row",
    alignItems: "center",
  },

  supportIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffe7a0",
  },

  supportIcon: {
    fontSize: 20,
    color: colors.text,
  },

  supportTextBox: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  supportTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  supportText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  supportArrow: {
    color: colors.accent,
    fontSize: 28,
    marginLeft: spacing.sm,
  },

  restoreBox: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  restoreTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },

  restoreText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});