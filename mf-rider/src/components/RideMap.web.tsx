import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface RideMapProps {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string;
}

export const RideMap = forwardRef<unknown, RideMapProps>(function RideMap(
  { pickupAddress, destinationAddress },
  _ref,
) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>🗺️ Map preview is available in the Android app</Text>
      {pickupAddress ? <Text style={styles.subtext}>Pickup: {pickupAddress}</Text> : null}
      {destinationAddress ? (
        <Text style={styles.subtext}>Destination: {destinationAddress}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    padding: 16,
  },
  text: { color: colors.text, fontWeight: "700", fontSize: 14, textAlign: "center" },
  subtext: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});