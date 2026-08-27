import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";

interface HomeScreenProps {
  onBookRide: () => void;
  onMoreServices?: () => void;
  onMenu?: () => void;
}

const COLORS = {
  bg: "#F8F6F1",
  white: "#FFFFFF",
  cream: "#FFF2D3",
  creamStrong: "#F9D987",
  gold: "#E7A400",
  goldDark: "#B97800",
  navy: "#0C172A",
  text: "#152238",
  muted: "#717A89",
  line: "#E7E0D4",
  green: "#159A63",
  red: "#E64C4C",
  auto: "#FFF0C9",
  bike: "#E5F5F2",
  car: "#E9ECFF",
  pink: "#FCE8E7",
  recharge: "#ECF6DE",
  more: "#F1E8D9",
};

const AUTO_IMAGE = require("../assets/mf-auto.png");
const BIKE_IMAGE = require("../assets/mf-bike.png");
const CAR_IMAGE = require("../assets/mf-car.png");
const MF_LOGO = require("../assets/mf1.png");
const HERO_IMAGE = require("../assets/mf2.png");

export function HomeScreen({
  onBookRide,
  onMoreServices,
  onMenu,
}: HomeScreenProps) {
  const { user } = useAuth();

  const [locationLabel, setLocationLabel] =
    useState("Current location");

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [showMoreServices, setShowMoreServices] =
    useState(false);

  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationLabel("Tap to detect location");
        return;
      }

      const position =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const result =
        await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

      if (result.length > 0) {
        const place = result[0];

        setLocationLabel(
          place.city ||
            place.district ||
            place.subregion ||
            place.region ||
            "Current location",
        );
      }
    } catch (error) {
      console.log("Location error:", error);
      setLocationLabel("Current location");
    } finally {
      setLocationLoading(false);
    }
  };

  const displayName =
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "MF Rider";

  const openService = (service: string) => {
    console.log(`Opening ${service} service`);

    // Temporary service action.
    // Later we will connect these to real booking screens/APIs.
    alert(`${service} booking will open here.`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image
                source={MF_LOGO}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                MF RIDES
              </Text>

              <Text style={styles.brandTagline}>
                Ride. Travel. Explore.
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>

            <Pressable style={styles.offers}>
              <Text style={styles.offersIcon}>
                ✦
              </Text>

              <Text style={styles.offersText}>
                Offers
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menu,
                pressed && {
                  opacity: 0.8,
                  transform: [{ scale: 0.96 }],
                },
              ]}
              onPress={onMenu}
            >
              <Text style={styles.menuText}>
                ☰
              </Text>
            </Pressable>

          </View>
        </View>


        {/* =====================================================
            HERO
        ===================================================== */}

        <View style={styles.hero}>

          <View style={styles.heroCopy}>

            <View style={styles.badge}>
              <View style={styles.badgeDot} />

              <Text style={styles.badgeText}>
                PREMIUM RIDE SERVICE
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              MF RIDES
            </Text>

            <Text style={styles.heroGold}>
              Unlimited
            </Text>

            <Text style={styles.heroTitle}>
              journeys.
            </Text>

            <Text style={styles.heroSub}>
              From daily rides to long journeys,
              {"\n"}
              we've got you covered.
            </Text>

            <View style={styles.featureRow}>

              <Feature
                text="Safe & Secure"
                icon="✓"
              />

              <Feature
                text="Quick & Reliable"
                icon="⚡"
              />

              <Feature
                text="Verified Partners"
                icon="●"
              />

            </View>
          </View>


          {/* HERO IMAGE */}

          <View style={styles.heroVisual}>

            <Image
              source={HERO_IMAGE}
              resizeMode="contain"
              style={{
                width: "100%",
                height: "100%",
              }}
            />

            <View style={styles.heroBrandPlate}>

              <Image
                source={MF_LOGO}
                style={styles.heroBrandLogo}
                resizeMode="contain"
              />

              <View>
                <Text style={styles.heroBrandName}>
                  MF RIDES
                </Text>

                <Text style={styles.heroBrandSmall}>
                  RIDE WITH STYLE
                </Text>
              </View>

            </View>

          </View>
        </View>


        {/* =====================================================
            LOCATION / DESTINATION
        ===================================================== */}

        <Pressable
          style={styles.route}
          onPress={onBookRide}
        >

          {/* PICKUP */}

          <View style={styles.routePart}>

            <View style={styles.greenBox}>
              <View style={styles.greenDot} />
            </View>

            <View>
              <Text style={styles.routeLabel}>
                PICKUP
              </Text>

              {locationLoading ? (
                <View style={styles.loading}>

                  <ActivityIndicator
                    size="small"
                    color={COLORS.gold}
                  />

                  <Text style={styles.routeValue}>
                    Detecting...
                  </Text>

                </View>
              ) : (
                <>
                  <Text style={styles.routeValue}>
                    {locationLabel}
                  </Text>

                  <Text style={styles.routeHint}>
                    Use my location
                  </Text>
                </>
              )}
            </View>

          </View>


          {/* MIDDLE */}

          <View style={styles.routeMiddle}>

            <View style={styles.routeLine} />

            <View style={styles.swap}>
              <Text style={styles.swapText}>
                ⇄
              </Text>
            </View>

            <View style={styles.routeLine} />

          </View>


          {/* DROP */}

          <View style={styles.routePart}>

            <View style={styles.redBox}>
              <View style={styles.redDot} />
            </View>

            <View>

              <Text style={styles.routeLabel}>
                DROP
              </Text>

              <Text style={styles.routeValue}>
                Where are you going?
              </Text>

              <Text style={styles.routeHint}>
                Search destination
              </Text>

            </View>

          </View>


          {/* ARROW */}

          <View style={styles.routeArrow}>
            <Text style={styles.routeArrowText}>
              →
            </Text>
          </View>

        </Pressable>


        {/* =====================================================
            THREE MAIN RIDE SERVICES
            AUTO / BIKE / CAR
        ===================================================== */}

        <View
          style={{
            flexDirection: "row",
            gap: 14,
            marginTop: 20,
          }}
        >

          {/* ================= AUTO ================= */}

          <Pressable
            onPress={onBookRide}
            style={{
              flex: 1,
              minHeight: 160,
              backgroundColor: COLORS.auto,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#1E1E1E",
              overflow: "hidden",
              position: "relative",
              padding: 14,
            }}
          >

            <Text style={styles.cardLabel}>
              AUTO
            </Text>

            <Text style={styles.rideTitle}>
              Auto
            </Text>

            <Text style={styles.cardSub}>
              Book an auto
            </Text>

            <Image
              source={AUTO_IMAGE}
              resizeMode="contain"
              style={{
                position: "absolute",
                width: 150,
                height: 105,
                right: -8,
                bottom: -3,
              }}
            />

          </Pressable>


          {/* ================= BIKE ================= */}

          <Pressable
            onPress={onBookRide}
            style={{
              flex: 1,
              minHeight: 160,
              backgroundColor: COLORS.bike,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#1E1E1E",
              overflow: "hidden",
              position: "relative",
              padding: 14,
            }}
          >

            <Text style={styles.cardLabel}>
              BIKE
            </Text>

            <Text style={styles.rideTitle}>
              Bike
            </Text>

            <Text style={styles.cardSub}>
              Book a bike
            </Text>

            <Image
              source={BIKE_IMAGE}
              resizeMode="contain"
              style={{
                position: "absolute",
                width: 150,
                height: 105,
                right: -8,
                bottom: -3,
              }}
            />

          </Pressable>


          {/* ================= CAR ================= */}

          <Pressable
            onPress={onBookRide}
            style={{
              flex: 1,
              minHeight: 160,
              backgroundColor: COLORS.car,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#1E1E1E",
              overflow: "hidden",
              position: "relative",
              padding: 14,
            }}
          >

            <Text style={styles.cardLabel}>
              CAR
            </Text>

            <Text style={styles.rideTitle}>
              Car
            </Text>

            <Text style={styles.cardSub}>
              Book a car
            </Text>

            <Image
              source={CAR_IMAGE}
              resizeMode="contain"
              style={{
                position: "absolute",
                width: 160,
                height: 105,
                right: -10,
                bottom: -2,
              }}
            />

          </Pressable>

        </View>


        {/* =====================================================
            MORE SERVICES
        ===================================================== */}

        <Pressable
          onPress={() =>
            setShowMoreServices(!showMoreServices)
          }
          style={{
            marginTop: 14,
            minHeight: 100,
            borderRadius: 20,
            backgroundColor: COLORS.more,
            borderWidth: 1,
            borderColor: "#1E1E1E",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >

          <View style={{ flex: 1 }}>

            <Text style={styles.cardLabel}>
              MORE SERVICES
            </Text>

            <Text style={styles.rideTitle}>
              More
            </Text>

            <Text style={styles.cardSub}>
              Bus • Train • Movies • Recharge
            </Text>

          </View>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: COLORS.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: COLORS.navy,
              }}
            >
              {showMoreServices ? "↑" : "↓"}
            </Text>
          </View>

        </Pressable>


        {/* =====================================================
            MORE SERVICES PANEL
        ===================================================== */}

        {showMoreServices && (

          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 20,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.line,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >

            {/* BUS */}

            <Pressable
              onPress={() => openService("Bus Tickets")}
              style={{
                width: "48%",
                minHeight: 95,
                borderRadius: 16,
                backgroundColor: "#E8F7F6",
                padding: 12,
                justifyContent: "center",
              }}
            >

              <Text style={styles.cardLabel}>
                BUS
              </Text>

              <Text style={styles.cardTitle}>
                Bus Tickets
              </Text>

              <Text style={styles.cardSub}>
                Book bus tickets
              </Text>

            </Pressable>


            {/* TRAIN */}

            <Pressable
              onPress={() => openService("Train Tickets")}
              style={{
                width: "48%",
                minHeight: 95,
                borderRadius: 16,
                backgroundColor: "#EAF0FF",
                padding: 12,
                justifyContent: "center",
              }}
            >

              <Text style={styles.cardLabel}>
                TRAIN
              </Text>

              <Text style={styles.cardTitle}>
                Train Tickets
              </Text>

              <Text style={styles.cardSub}>
                Book train tickets
              </Text>

            </Pressable>


            {/* MOVIES */}

            <Pressable
              onPress={() => openService("Movie Tickets")}
              style={{
                width: "48%",
                minHeight: 95,
                borderRadius: 16,
                backgroundColor: COLORS.pink,
                padding: 12,
                justifyContent: "center",
              }}
            >

              <Text style={styles.cardLabel}>
                MOVIES
              </Text>

              <Text style={styles.cardTitle}>
                Movies
              </Text>

              <Text style={styles.cardSub}>
                Book movie tickets
              </Text>

            </Pressable>


            {/* RECHARGE */}

            <Pressable
              onPress={() => openService("Recharge")}
              style={{
                width: "48%",
                minHeight: 95,
                borderRadius: 16,
                backgroundColor: COLORS.recharge,
                padding: 12,
                justifyContent: "center",
              }}
            >

              <Text style={styles.cardLabel}>
                RECHARGE
              </Text>

              <Text style={styles.cardTitle}>
                Recharge
              </Text>

              <Text style={styles.cardSub}>
                Mobile & more
              </Text>

            </Pressable>

          </View>

        )}


        {/* =====================================================
            REWARDS
        ===================================================== */}

        <Pressable style={styles.rewards}>

          <View style={styles.rewardLogo}>
            <Image
              source={MF_LOGO}
              style={styles.rewardImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.rewardCopy}>

            <Text style={styles.rewardTitle}>
              MF Rewards
            </Text>

            <Text style={styles.rewardSub}>
              More rides. More rewards.
            </Text>

          </View>

          <View style={styles.points}>

            <Text style={styles.pointsNumber}>
              0
            </Text>

            <Text style={styles.pointsLabel}>
              POINTS
            </Text>

          </View>

          <Text style={styles.rewardArrow}>
            →
          </Text>

        </Pressable>


        {/* USER */}

        <Text style={styles.welcome}>
          Welcome, {displayName}
        </Text>

      </ScrollView>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function RideCard({
  label,
  title,
  subtitle,
  bg,
  image,
  onPress,
}: {
  label: string;
  title: string;
  subtitle: string;
  bg: string;
  image: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rideCard,
        { backgroundColor: bg },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.rideCopy}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.rideTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
        <View style={styles.circleArrow}>
          <Text style={styles.circleArrowText}>→</Text>
        </View>
      </View>

      <Image source={image} style={styles.rideImage} resizeMode="contain" />

      <View style={styles.cardMF}>
        <Image source={MF_LOGO} style={styles.cardMFImage} resizeMode="contain" />
      </View>
    </Pressable>
  );
}

function SimpleCard({
  label,
  title,
  subtitle,
  bg,
  image,
}: {
  label: string;
  title: string;
  subtitle: string;
  bg: string;
  image: string;
}) {
  return (
    <Pressable style={[styles.simpleCard, { backgroundColor: bg }]}>
      <View style={styles.simpleCopy}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
        <View style={styles.circleArrow}>
          <Text style={styles.circleArrowText}>→</Text>
        </View>
      </View>
      <Image source={{ uri: image }} style={styles.simpleImage} resizeMode="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 42 : 16,
    paddingTop: 12,
    paddingBottom: 38,
  },

  header: {
    height: 76,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.055,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.navy,
    marginRight: 12,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  brandName: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 1,
  },

  brandTagline: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  offers: {
    height: 43,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEDDB9",
    backgroundColor: "#FFF9EA",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  offersIcon: {
    color: COLORS.goldDark,
    fontSize: 16,
    fontWeight: "900",
  },

  offersText: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "900",
  },

  menu: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  menuText: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
  },

  hero: {
    marginTop: 12,
    minHeight: Platform.OS === "web" ? 410 : 480,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: "#EEDAAE",
    flexDirection: "row",
    position: "relative",
  },

  heroCopy: {
    width: "39%",
    paddingLeft: Platform.OS === "web" ? 46 : 24,
    paddingRight: 18,
    justifyContent: "center",
    zIndex: 3,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E9DDBF",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    marginRight: 7,
  },

  badgeText: {
    color: COLORS.navy,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: COLORS.navy,
    fontSize: Platform.OS === "web" ? 50 : 38,
    lineHeight: Platform.OS === "web" ? 53 : 42,
    fontWeight: "900",
    letterSpacing: -1.8,
  },

  heroGold: {
    color: COLORS.goldDark,
    fontSize: Platform.OS === "web" ? 50 : 38,
    lineHeight: Platform.OS === "web" ? 53 : 42,
    fontWeight: "900",
    letterSpacing: -1.8,
  },

  heroSub: {
    color: "#3D485B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 21,
  },

  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  feature: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
  },

  featureIcon: {
    color: COLORS.goldDark,
    fontSize: 11,
    fontWeight: "900",
    marginRight: 5,
  },

  featureText: {
    color: COLORS.navy,
    fontSize: 8,
    fontWeight: "900",
  },

  heroVisual: {
    flex: 1,
    minWidth: 0,
    minHeight: Platform.OS === "web" ? 400 : 270,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: Platform.OS === "web" ? 18 : 8,
    paddingBottom: Platform.OS === "web" ? 18 : 10,
  },

  heroBackgroundImage: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "76%",
    height: "100%",
    opacity: 0.95,
    zIndex: 1,
  },

  heroBackgroundImageStyle: {
    width: "100%",
    height: "100%",
  },

  heroVehicles: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    height: "72%",
    zIndex: 4,
  },

  heroAuto: {
    position: "absolute",
    width: "29%",
    height: "70%",
    left: "2%",
    bottom: 0,
    zIndex: 2,
  },

  heroBike: {
    position: "absolute",
    width: "38%",
    height: "82%",
    left: "27%",
    bottom: -2,
    zIndex: 4,
  },

  heroCar: {
    position: "absolute",
    width: "47%",
    height: "76%",
    right: "-2%",
    bottom: 0,
    zIndex: 3,
  },

  heroBrandPlate: {
    position: "absolute",
    top: 18,
    right: 18,
    minWidth: 118,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.gold,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
  },

  heroBrandLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 7,
  },

  heroBrandName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroBrandSmall: {
    color: "#AAB3C1",
    fontSize: 6,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 0.5,
  },

  route: {
    minHeight: 96,
    marginTop: 12,
    paddingHorizontal: 19,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.065,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },

  routePart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  greenBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E2F6EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  redBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FDE5E4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },

  routeLabel: {
    color: "#8B929E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  routeValue: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },

  routeHint: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  routeMiddle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  routeLine: {
    width: 36,
    height: 1,
    backgroundColor: "#DDCFB5",
  },

  swap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF2CC",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },

  swapText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: "900",
  },

  routeArrow: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  routeArrowText: {
    color: COLORS.white,
    fontSize: 28,
  },

  sectionHead: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  eyebrow: {
    color: COLORS.goldDark,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },

  sectionHint: {
    color: COLORS.muted,
    fontSize: 9,
  },

  rideGrid: {
    flexDirection: "row",
    gap: 12,
  },

  rideCard: {
    flex: 1,
    minHeight: 155,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    position: "relative",
  },

  rideCopy: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    zIndex: 3,
  },

  cardLabel: {
    color: "#667184",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  rideTitle: {
    color: COLORS.navy,
    fontSize: 22,
    fontWeight: "900",
  },

  cardTitle: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: "900",
  },

  cardSub: {
    color: "#6B7585",
    fontSize: 9,
    marginTop: 4,
  },

  circleArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  circleArrowText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "900",
  },

  rideImage: {
    width: "54%",
    height: "100%",
  },

  cardMF: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.gold,
    overflow: "hidden",
    zIndex: 5,
  },

  cardMFImage: {
    width: "100%",
    height: "100%",
  },

  secondary: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },

  simpleCard: {
    flex: 1,
    minHeight: 138,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
  },

  simpleCopy: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },

  simpleImage: {
    width: "48%",
    height: "100%",
  },

  moreCard: {
    flex: 1,
    minHeight: 138,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
  },

  moreCopy: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },

  iconGrid: {
    width: "47%",
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
    alignContent: "center",
  },

  moreIcon: {
    width: 42,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.58)",
    alignItems: "center",
    justifyContent: "center",
  },

  moreIconText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
  },

  rewards: {
    marginTop: 13,
    minHeight: 70,
    borderRadius: 19,
    paddingHorizontal: 17,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
  },

  rewardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.gold,
  },

  rewardImage: {
    width: "100%",
    height: "100%",
  },

  rewardCopy: {
    flex: 1,
    marginLeft: 12,
  },

  rewardTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  rewardSub: {
    color: "#AAB3C1",
    fontSize: 9,
    marginTop: 3,
  },

  points: {
    alignItems: "center",
    marginRight: 16,
  },

  pointsNumber: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: "900",
  },

  pointsLabel: {
    color: "#AAB3C1",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  rewardArrow: {
    color: COLORS.gold,
    fontSize: 24,
  },

  welcome: {
    textAlign: "center",
    color: "#A2A8B1",
    fontSize: 9,
    marginTop: 16,
  },
});

export default HomeScreen;