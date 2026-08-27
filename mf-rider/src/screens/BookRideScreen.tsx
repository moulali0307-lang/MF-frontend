import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
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

const mfRidesHero = require("../assets/mf1.png");

const mfTheme = {
  cream: "#FBF8F1",
  white: "#FFFFFF",
  navy: "#172033",
  gold: "#E3A321",
  goldDark: "#C98A13",
  goldSoft: "#FFF1C9",
  border: "#E8DDC9",
  muted: "#747887",
  danger: "#D93A2B",
};

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

  const pollTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

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
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat",
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
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error(
      "Please enter a location.",
    );
  }

  const suggestions =
    await searchGooglePlaces(trimmed);

  if (
    !suggestions ||
    suggestions.length === 0
  ) {
    throw new Error(
      `Location "${trimmed}" could not be found. Please select a valid location.`,
    );
  }

  const firstSuggestion =
    suggestions[0];

  return await getGooglePlaceDetails(
    firstSuggestion.placeId,
  );
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
  if (!token) {
    return;
  }

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
        "Please select a pickup location.",
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
  // 👇 NEW PICKUP CODE
      let finalPickupAddress = pickupAddress.trim();
      let finalPickupLatitude = pickupLatitude;
      let finalPickupLongitude = pickupLongitude;

      if (
        finalPickupLatitude === null ||
        finalPickupLongitude === null
      ) {
        const pickupPlace = await geocodeAddress(
          finalPickupAddress,
        );

        finalPickupAddress = pickupPlace.address;
        finalPickupLatitude = pickupPlace.latitude;
        finalPickupLongitude = pickupPlace.longitude;

        setPickupAddress(pickupPlace.address);
        setPickupLatitude(pickupPlace.latitude);
        setPickupLongitude(pickupPlace.longitude);
      }

  // 👇 EXISTING DESTINATION CODE
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
      
      console.log("🚕 CREATING RIDE");

      if (
        finalPickupLatitude === null ||
        finalPickupLongitude === null
      ) {
        throw new Error(
          "Unable to get pickup location coordinates.",
        );
      }

      if (
        finalDestinationLatitude === null ||
        finalDestinationLongitude === null
      ) {
        throw new Error(
          "Unable to get destination coordinates.",
        );
      }

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={
          ride &&
          ACTIVE_STATUSES.includes(ride.status)
            ? undefined
            : onBack
        }
        disabled={
          loading ||
          Boolean(
            ride &&
              ACTIVE_STATUSES.includes(ride.status),
          )
        }
      >
        <Text
          style={[
            styles.backText,
            ride &&
            ACTIVE_STATUSES.includes(ride.status)
              ? styles.backTextDisabled
              : null,
          ]}
        >
          ← Back
        </Text>
      </Pressable>

      {/* BRAND + HERO */}
      <View style={styles.brandHeader}>
        <View style={styles.brandCopy}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>MF</Text>
          </View>

          <Text style={styles.brandName}>MF-RIDES</Text>

          <Text style={styles.brandTagline}>
            Smart Rides. Anytime. Anywhere.
          </Text>
        </View>

        <Image
          source={mfRidesHero}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        {ride ? "Your Ride" : "Book a Ride"}
      </Text>

      <Text style={styles.subtitle}>
        {ride
          ? "Your current ride details"
          : "Choose one pickup and one destination"}
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

      {/* LOCATION PREVIEW */}
      {!ride &&
      pickupLatitude !== null &&
      pickupLongitude !== null ? (
        <View style={styles.mapPreviewCard}>
          <Text style={styles.mapPreviewIcon}>📍</Text>
          <Text style={styles.mapPreviewTitle}>Ride Locations</Text>

          <View style={styles.mapRoute}>
            <View style={styles.mapDotGold} />
            <View style={styles.mapRouteLine} />
            <View style={styles.mapDotNavy} />
          </View>

          <View style={styles.mapLocationBox}>
            <Text style={styles.mapLocationLabel}>PICKUP</Text>
            <Text style={styles.mapLocationText} numberOfLines={1}>
              {pickupAddress || "Pickup location"}
            </Text>
          </View>

          <View style={styles.mapLocationBox}>
            <Text style={styles.mapLocationLabel}>DESTINATION</Text>
            <Text style={styles.mapLocationText} numberOfLines={1}>
              {destinationAddress || "Choose destination"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* NEW BOOKING */}
      {!ride ? (
        <View style={styles.bookingCard}>
          <View style={styles.bookingTimeline}>
            <View style={styles.timelineIconNavy}>
              <Text style={styles.timelineIconText}>●</Text>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineIconGold}>
              <Text style={styles.timelineIconTextDark}>⚑</Text>
            </View>
          </View>

          <View style={styles.bookingFields}>
            {/* PICKUP */}
            <Text style={styles.label}>
              PICKUP LOCATION
            </Text>

            <View style={styles.locationInputBox}>
              <TextInput
                style={[
                  styles.locationInput,
                  Platform.OS === "web"
                    ? ({
                        outline: "none",
                        outlineStyle: "none",
                        outlineWidth: 0,
                        borderWidth: 0,
                        boxShadow: "none",
                      } as any)
                    : null,
                ]}
                placeholder="Search pickup location"
                placeholderTextColor={mfTheme.muted}
                value={pickupAddress}
                onChangeText={handlePickupChange}
                editable={!loading}
                selectionColor={mfTheme.gold}
              />

              {searchingPickup ? (
                <ActivityIndicator
                  size="small"
                  color={mfTheme.gold}
                />
              ) : null}

              <Pressable
                onPress={detectCurrentLocation}
                disabled={
                  locationLoading || loading
                }
                style={styles.locationButton}
              >
                {locationLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={mfTheme.gold}
                  />
                ) : (
                  <Text style={styles.locationIcon}>
                    ◎
                  </Text>
                )}
              </Pressable>
            </View>

            {pickupSuggestions.length > 0 ? (
              <PlaceSuggestions
                suggestions={pickupSuggestions}
                onSelect={selectPickupPlace}
              />
            ) : null}

            {pickupLatitude !== null &&
            pickupLongitude !== null ? (
              <Text style={styles.selectedText}>
                ✓ Pickup selected
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Search a place or use your current location
              </Text>
            )}

            {/* DESTINATION */}
            <Text style={styles.label}>
              DESTINATION
            </Text>

            <View style={styles.locationInputBox}>
              <TextInput
                style={[
                  styles.locationInput,
                  Platform.OS === "web"
                    ? ({
                        outline: "none",
                        outlineStyle: "none",
                        outlineWidth: 0,
                        borderWidth: 0,
                        boxShadow: "none",
                      } as any)
                    : null,
                ]}
                placeholder="Where do you want to go?"
                placeholderTextColor={mfTheme.muted}
                value={destinationAddress}
                onChangeText={handleDestinationChange}
                editable={!loading}
                selectionColor={mfTheme.gold}
              />

              {searchingDestination ? (
                <ActivityIndicator
                  size="small"
                  color={mfTheme.gold}
                />
              ) : null}
            </View>   

            {destinationSuggestions.length > 0 ? (
              <PlaceSuggestions
                suggestions={destinationSuggestions}
                onSelect={selectDestinationPlace}
              />
            ) : null}

            {destinationLatitude !== null &&
            destinationLongitude !== null ? (
              <Text style={styles.selectedText}>
                ✓ Destination selected
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Type a city, area or place and choose a Google suggestion.
              </Text>
            )}

            {/* CONFIRM */}
            <Pressable
              style={[
                styles.button,
                (loading ||
                  !pickupAddress.trim() ||
                  !destinationAddress.trim()) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleBookRide}
              disabled={
                loading ||
                !pickupAddress.trim() ||
                !destinationAddress.trim()
              }
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "Requesting Ride..."
                  : "Confirm Ride"}
              </Text>

              <View style={styles.buttonArrow}>
                <Text style={styles.buttonArrowText}>
                  →
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* SERVICE BENEFITS */}
      {!ride ? (
        <View style={styles.benefitsCard}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitTitle}>
              Safe & Secure
            </Text>
            <Text style={styles.benefitText}>
              Verified partners
            </Text>
          </View>

          <View style={styles.benefitDivider} />

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitTitle}>
              Quick Booking
            </Text>
            <Text style={styles.benefitText}>
              Instant matching
            </Text>
          </View>

          <View style={styles.benefitDivider} />

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>◉</Text>
            <Text style={styles.benefitTitle}>
              24x7 Support
            </Text>
            <Text style={styles.benefitText}>
              We're here to help
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: mfTheme.cream,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 36,
  },

  backText: {
    color: mfTheme.navy,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },

  backTextDisabled: {
    opacity: 0.35,
  },

  brandHeader: {
    minHeight: 175,
    borderRadius: 28,
    backgroundColor: mfTheme.goldSoft,
    borderWidth: 1,
    borderColor: mfTheme.border,
    padding: 18,
    marginBottom: 22,
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },

  brandCopy: {
    flex: 1,
    zIndex: 2,
    paddingRight: 6,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: mfTheme.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  brandName: {
    color: mfTheme.navy,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2.2,
  },

  brandTagline: {
    color: mfTheme.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  heroImage: {
    position: "absolute",
    right: -20,
    bottom: -8,
    width: "62%",
    height: "90%",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: mfTheme.navy,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: mfTheme.muted,
    marginTop: 6,
    marginBottom: 18,
  },

  bookingCard: {
    backgroundColor: mfTheme.white,
    borderWidth: 1,
    borderColor: mfTheme.border,
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    shadowColor: "#172033",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  bookingTimeline: {
    width: 42,
    alignItems: "center",
    paddingTop: 3,
  },

  timelineIconNavy: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: mfTheme.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineIconGold: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: mfTheme.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineIconText: {
    color: mfTheme.gold,
    fontSize: 16,
    fontWeight: "900",
  },

  timelineIconTextDark: {
    color: mfTheme.navy,
    fontSize: 17,
    fontWeight: "900",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 82,
    marginVertical: 7,
    backgroundColor: "#EBD9AD",
  },

  bookingFields: {
    flex: 1,
    paddingLeft: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: mfTheme.navy,
    marginBottom: 8,
  },

  locationInputBox: {
    minHeight: 58,
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: mfTheme.border,
    borderRadius: 17,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  locationInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: mfTheme.navy,
  },

  locationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: mfTheme.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  locationIcon: {
    fontSize: 22,
    color: mfTheme.goldDark,
    fontWeight: "900",
  },

  suggestionsBox: {
    backgroundColor: mfTheme.white,
    borderWidth: 1,
    borderColor: mfTheme.border,
    borderRadius: 15,
    marginTop: 5,
    maxHeight: 210,
    overflow: "hidden",
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: mfTheme.border,
  },

  suggestionIcon: {
    fontSize: 19,
    marginRight: 9,
    color: mfTheme.goldDark,
  },

  suggestionTextBox: {
    flex: 1,
  },

  suggestionTitle: {
    color: mfTheme.navy,
    fontSize: 14,
    fontWeight: "800",
  },

  suggestionSubtitle: {
    color: mfTheme.muted,
    fontSize: 12,
    marginTop: 3,
  },

  selectedText: {
    color: "#159A62",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 4,
  },

  helperText: {
    fontSize: 11,
    color: mfTheme.muted,
    marginTop: 6,
    marginBottom: 17,
    lineHeight: 17,
  },

  button: {
    minHeight: 58,
    backgroundColor: mfTheme.gold,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
    position: "relative",
    paddingHorizontal: 58,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  buttonArrow: {
    position: "absolute",
    right: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: mfTheme.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonArrowText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  benefitsCard: {
    marginTop: 18,
    minHeight: 118,
    backgroundColor: mfTheme.navy,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  benefitItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: mfTheme.gold,
    color: mfTheme.gold,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 31,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 7,
  },

  benefitTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  benefitText: {
    color: "#F3D68D",
    fontSize: 9,
    marginTop: 3,
    textAlign: "center",
  },

  benefitDivider: {
    width: 1,
    height: 52,
    backgroundColor: "rgba(227,163,33,0.55)",
  },

  mapPreviewCard: {
    height: 250,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: mfTheme.border,
    backgroundColor: mfTheme.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  mapPreviewIcon: {
    fontSize: 28,
    marginBottom: 2,
  },

  mapPreviewTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: mfTheme.navy,
    marginBottom: 10,
  },

  mapRoute: {
    width: "70%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  mapDotGold: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: mfTheme.gold,
  },

  mapRouteLine: {
    flex: 1,
    height: 3,
    backgroundColor: mfTheme.gold,
    marginHorizontal: 8,
  },

  mapDotNavy: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: mfTheme.navy,
  },

  mapLocationBox: {
    width: "100%",
    backgroundColor: mfTheme.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
  },

  mapLocationLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: mfTheme.goldDark,
  },

  mapLocationText: {
    fontSize: 12,
    fontWeight: "700",
    color: mfTheme.navy,
    marginTop: 2,
  },

  locationErrorBox: {
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#E8B3A8",
    borderRadius: 17,
    padding: 14,
    marginBottom: 14,
  },

  locationErrorTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: mfTheme.danger,
  },

  locationErrorText: {
    marginTop: 4,
    color: mfTheme.navy,
    fontSize: 12,
    lineHeight: 18,
  },

  errorBox: {
    backgroundColor: "#FFF8F6",
    borderWidth: 1,
    borderColor: "#E8B3A8",
    borderRadius: 17,
    padding: 15,
    marginBottom: 14,
  },

  errorTitle: {
    color: mfTheme.danger,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
  },

  errorText: {
    color: mfTheme.navy,
    fontSize: 13,
    lineHeight: 20,
  },

  successBox: {
    backgroundColor: mfTheme.white,
    borderWidth: 1,
    borderColor: mfTheme.gold,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },

  successTitle: {
    color: mfTheme.navy,
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 7,
  },

  successText: {
    color: mfTheme.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  detailsBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: mfTheme.goldSoft,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: mfTheme.goldDark,
    letterSpacing: 1,
  },

  destinationLabel: {
    marginTop: 15,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: mfTheme.navy,
    marginTop: 4,
    lineHeight: 20,
  },

  partnerBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#F7F3EA",
  },

  partnerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: mfTheme.navy,
  },

  partnerName: {
    fontSize: 17,
    fontWeight: "800",
    color: mfTheme.navy,
    marginTop: 6,
  },

  partnerPhone: {
    fontSize: 14,
    color: mfTheme.muted,
    marginTop: 4,
  },

  otpBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: mfTheme.goldSoft,
    borderWidth: 1,
    borderColor: mfTheme.gold,
    alignItems: "center",
  },

  otpLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: mfTheme.navy,
    marginBottom: 7,
  },

  otpCode: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 10,
    color: mfTheme.goldDark,
    marginVertical: 7,
  },

  otpHint: {
    fontSize: 12,
    color: mfTheme.muted,
    textAlign: "center",
    lineHeight: 18,
  },

  waitingBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#F7F3EA",
  },

  waitingTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: mfTheme.navy,
  },

  waitingText: {
    marginTop: 4,
    fontSize: 13,
    color: mfTheme.muted,
    lineHeight: 19,
  },

  acceptedBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: mfTheme.goldSoft,
  },

  acceptedTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: mfTheme.goldDark,
  },

  acceptedText: {
    marginTop: 4,
    fontSize: 13,
    color: mfTheme.navy,
    lineHeight: 19,
  },

  startedBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#F7F3EA",
    borderWidth: 1,
    borderColor: mfTheme.gold,
  },

  startedTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: mfTheme.goldDark,
  },

  startedText: {
    marginTop: 4,
    fontSize: 13,
    color: mfTheme.navy,
    lineHeight: 19,
  },

  cancelButton: {
    backgroundColor: mfTheme.danger,
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },

  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  cancelledText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
    color: mfTheme.muted,
  },

  homeButton: {
    backgroundColor: mfTheme.navy,
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },

  restoreBox: {
    marginTop: 24,
    padding: 24,
    borderRadius: 22,
    backgroundColor: mfTheme.white,
    borderWidth: 1,
    borderColor: mfTheme.border,
    alignItems: "center",
  },

  restoreTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "900",
    color: mfTheme.navy,
    textAlign: "center",
  },

  restoreText: {
    marginTop: 8,
    fontSize: 13,
    color: mfTheme.muted,
    textAlign: "center",
    lineHeight: 19,
  },
});