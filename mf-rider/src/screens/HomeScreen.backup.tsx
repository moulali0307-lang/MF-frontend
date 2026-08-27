import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";

import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/colors";

interface HomeScreenProps {
  onBookRide: () => void;
}

export function HomeScreen({ onBookRide }: HomeScreenProps) {
  const { user, logout } = useAuth();

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationError("Location permission denied");
        setLocationLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);
    } catch (error) {
      console.error("Location error:", error);
      setLocationError("Unable to detect your location");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleBookRide = () => {
    onBookRide();
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>
          Hello, {user?.fullName ?? "Rider"} 👋
        </Text>

        <Text style={styles.subtitle}>
          You're signed in to MF Rides.
        </Text>

        {/* RIDER ACCOUNT INFO */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Phone number
          </Text>

          <Text style={styles.cardValue}>
            {user?.phoneNumber}
          </Text>

          {user?.email ? (
            <>
              <Text
                style={[
                  styles.cardLabel,
                  styles.cardLabelSpaced,
                ]}
              >
                Email
              </Text>

              <Text style={styles.cardValue}>
                {user.email}
              </Text>
            </>
          ) : null}

          <Text
            style={[
              styles.cardLabel,
              styles.cardLabelSpaced,
            ]}
          >
            Account type
          </Text>

          <Text style={styles.cardValue}>
            Rider
          </Text>
        </View>

        {/* LOCATION */}

        <View style={styles.locationCard}>
          <Text style={styles.locationEmoji}>
            📍
          </Text>

          <View style={styles.locationTextBox}>
            <Text style={styles.locationTitle}>
              Current Location
            </Text>

            {locationLoading ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                />

                <Text style={styles.locationSubtitle}>
                  Detecting your location...
                </Text>
              </View>
            ) : location ? (
              <>
                <Text style={styles.locationSuccess}>
                  Location detected successfully ✅
                </Text>

                <Text style={styles.coordinates}>
                  Latitude: {location.coords.latitude.toFixed(6)}
                </Text>

                <Text style={styles.coordinates}>
                  Longitude: {location.coords.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.locationError}>
                  {locationError ?? "Location not available"}
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={detectCurrentLocation}
                >
                  <Text style={styles.retryButtonText}>
                    Try Again
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* BOOK RIDE */}

        <Pressable
          style={styles.bookButton}
          onPress={handleBookRide}
>
          <Text style={styles.bookButtonText}>
           Book a Ride 🚕
          </Text>
        </Pressable>

        {/* SERVICE INFO */}

        <View style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>
            MF Rides Service Area
          </Text>

          <Text style={styles.serviceText}>
            📍 Nearby trips only
          </Text>

          <Text style={styles.serviceText}>
            📏 Maximum trip distance: 30 km
          </Text>

          <Text style={styles.serviceText}>
            🚕 Nearby partners only
          </Text>
        </View>
      </View>

      {/* LOGOUT */}

      <Pressable
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutButtonText}>
          Log out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },

  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardLabelSpaced: {
    marginTop: spacing.md,
  },

  cardValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  locationEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },

  locationTextBox: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  locationSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  locationLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 8,
  },

  locationSuccess: {
    fontSize: 13,
    color: "#15803d",
    marginTop: spacing.xs,
    fontWeight: "600",
  },

  locationError: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: spacing.xs,
  },

  coordinates: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },

  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  bookButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },

  bookButtonDisabled: {
    opacity: 0.6,
  },

  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  serviceText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  logoutButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  logoutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});