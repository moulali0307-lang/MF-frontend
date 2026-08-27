import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colors } from "../theme/colors";

interface RideMapProps {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string;
}

export const RideMap = forwardRef<MapView, RideMapProps>(function RideMap(
  {
    pickupLatitude,
    pickupLongitude,
    pickupAddress,
    destinationLatitude,
    destinationLongitude,
    destinationAddress,
  },
  ref,
) {
  return (
    <MapView
      ref={ref}
      style={styles.map}
      showsUserLocation
      showsMyLocationButton
      initialRegion={{
        latitude: pickupLatitude,
        longitude: pickupLongitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{ latitude: pickupLatitude, longitude: pickupLongitude }}
        title="Pickup"
        description={pickupAddress || "Pickup location"}
        pinColor={colors.accent}
      />

      {destinationLatitude !== null && destinationLongitude !== null ? (
        <Marker
          coordinate={{ latitude: destinationLatitude, longitude: destinationLongitude }}
          title="Destination"
          description={destinationAddress || "Destination location"}
        />
      ) : null}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: { flex: 1 },
});