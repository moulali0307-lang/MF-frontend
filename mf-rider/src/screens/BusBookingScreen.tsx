import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface BusBookingScreenProps {
  onBack: () => void;
}

type PaymentMethod = "rewards" | "online";

const COLORS = {
  background: "#F8F6F1",
  white: "#FFFFFF",
  navy: "#171B2B",
  gold: "#E7A400",
  goldLight: "#FFF1C9",
  muted: "#777B89",
  line: "#E5E1D8",
  bus: "#E8F7F6",
  green: "#19A66A",
  red: "#E64C4C",
};

const BUS_IMAGE =
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=85";

const buses = [
  {
    id: "MF Express",
    name: "MF Express",
    type: "AC Sleeper",
    time: "09:30 PM",
    arrival: "06:30 AM",
    price: 699,
  },
  {
    id: "MF Travels",
    name: "MF Travels",
    type: "AC Seater",
    time: "10:15 PM",
    arrival: "07:00 AM",
    price: 549,
  },
  {
    id: "MF Super Fast",
    name: "MF Super Fast",
    type: "Non-AC Sleeper",
    time: "08:45 PM",
    arrival: "05:45 AM",
    price: 449,
  },
];

export function BusBookingScreen({
  onBack,
}: BusBookingScreenProps) {
  /*
   * IMPORTANT:
   * No default FROM / TO location.
   * User decides the journey.
   */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedBus, setSelectedBus] =
    useState("MF Express");

  const [showBusPlatform, setShowBusPlatform] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("online");

  const [bookingConfirmed, setBookingConfirmed] =
    useState(false);

  const rewardsBalance = 850;

  const selectedBusData = useMemo(
    () =>
      buses.find(
        (bus) => bus.id === selectedBus,
      ) ?? buses[0],
    [selectedBus],
  );

  const rewardCost = selectedBusData.price;

  /*
   * Validate route before selecting a bus.
   */
  function validateJourney(): boolean {
    const pickup = from.trim();
    const destination = to.trim();

    if (!pickup) {
      Alert.alert(
        "Pickup location required",
        "Please enter where you want to start your journey.",
      );
      return false;
    }

    if (!destination) {
      Alert.alert(
        "Destination required",
        "Please enter where you want to go.",
      );
      return false;
    }

    if (
      pickup.toLowerCase() ===
      destination.toLowerCase()
    ) {
      Alert.alert(
        "Invalid journey",
        "Pickup and destination cannot be the same.",
      );
      return false;
    }

    return true;
  }

  /*
   * Swap FROM and TO.
   */
  function swapLocations() {
    setFrom(to);
    setTo(from);
  }

  /*
   * Select bus and open platform details.
   */
  function openBusPlatform(busId: string) {
    if (!validateJourney()) {
      return;
    }

    setSelectedBus(busId);
    setShowBusPlatform(true);
  }

  /*
   * Booking validation.
   */
  function handleBooking() {
    if (!validateJourney()) {
      return;
    }

    if (paymentMethod === "rewards") {
      if (rewardsBalance < rewardCost) {
        Alert.alert(
          "Insufficient MF Rewards",
          `You need ${rewardCost} points, but you have only ${rewardsBalance} points.`,
        );
        return;
      }

      setBookingConfirmed(true);
      return;
    }

    /*
     * Online payment.
     *
     * This is currently demo flow.
     * Real payment gateway can be connected later.
     */
    setBookingConfirmed(true);
  }

  /*
   * BUS PLATFORM SCREEN
   */
  if (showBusPlatform) {
    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.platformContent
          }
        >
          {/* PLATFORM HEADER */}
          <View style={styles.platformHeader}>
            <Pressable
              onPress={() =>
                setShowBusPlatform(false)
              }
              style={
                styles.platformBackButton
              }
            >
              <Text
                style={
                  styles.platformBackText
                }
              >
                ‹
              </Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.platformTitle
                }
              >
                Bus Platform
              </Text>

              <Text
                style={
                  styles.platformSub
                }
                numberOfLines={1}
              >
                {from} → {to}
              </Text>
            </View>
          </View>

          {/* BUS HERO */}
          <View style={styles.busHeroCard}>
            <Image
              source={{ uri: BUS_IMAGE }}
              style={styles.busHeroImage}
              resizeMode="cover"
            />

            <View
              style={styles.liveBadge}
            >
              <View
                style={styles.liveDot}
              />

              <Text
                style={
                  styles.liveBadgeText
                }
              >
                BUS AVAILABLE
              </Text>
            </View>
          </View>

          {/* PLATFORM DETAILS */}
          <View
            style={
              styles.platformInfoCard
            }
          >
            <Text
              style={
                styles.platformOperator
              }
            >
              {selectedBusData.name}
            </Text>

            <Text
              style={
                styles.platformType
              }
            >
              {selectedBusData.type}
            </Text>

            <View
              style={
                styles.platformRouteRow
              }
            >
              <View
                style={
                  styles.platformLocation
                }
              >
                <Text
                  style={
                    styles.platformLabel
                  }
                >
                  BOARDING
                </Text>

                <Text
                  style={
                    styles.platformTime
                  }
                >
                  {selectedBusData.time}
                </Text>

                <Text
                  style={
                    styles.platformPlace
                  }
                  numberOfLines={2}
                >
                  {from}
                </Text>
              </View>

              <View
                style={
                  styles.platformArrowBox
                }
              >
                <Text
                  style={
                    styles.platformArrow
                  }
                >
                  →
                </Text>
              </View>

              <View
                style={[
                  styles.platformLocation,
                  styles.platformRight,
                ]}
              >
                <Text
                  style={
                    styles.platformLabel
                  }
                >
                  ARRIVAL
                </Text>

                <Text
                  style={
                    styles.platformTime
                  }
                >
                  {selectedBusData.arrival}
                </Text>

                <Text
                  style={
                    styles.platformPlace
                  }
                  numberOfLines={2}
                >
                  {to}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.platformDivider
              }
            />

            <View
              style={
                styles.platformGrid
              }
            >
              <View>
                <Text
                  style={
                    styles.platformLabel
                  }
                >
                  BUS TYPE
                </Text>

                <Text
                  style={
                    styles.platformValue
                  }
                >
                  {selectedBusData.type}
                </Text>
              </View>

              <View
                style={
                  styles.platformFare
                }
              >
                <Text
                  style={
                    styles.platformLabel
                  }
                >
                  FARE
                </Text>

                <Text
                  style={
                    styles.platformValue
                  }
                >
                  ₹{selectedBusData.price}
                  /seat
                </Text>
              </View>
            </View>
          </View>

          {/* BOARDING NOTICE */}
          <View
            style={
              styles.platformNotice
            }
          >
            <Text
              style={
                styles.platformNoticeTitle
              }
            >
              🚌 Boarding information
            </Text>

            <Text
              style={
                styles.platformNoticeText
              }
            >
              Reach the boarding point 15
              minutes before departure.
              Platform/boarding-point details
              are shown when provided by the
              bus operator.
            </Text>
          </View>

          {/* CHOOSE BUS */}
          <Pressable
            onPress={() =>
              setShowBusPlatform(false)
            }
            style={({ pressed }) => [
              styles.chooseBusButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.chooseBusButtonText
              }
            >
              Choose This Bus
            </Text>

            <Text
              style={
                styles.chooseBusArrow
              }
            >
              →
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  /*
   * MAIN BUS BOOKING SCREEN
   */
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View>
            <Text
              style={styles.headerTitle}
            >
              Bus Tickets
            </Text>

            <Text
              style={styles.headerSub}
            >
              Book your bus journey
            </Text>
          </View>
        </View>

        {/* JOURNEY */}
        <View style={styles.routeCard}>
          <Text
            style={styles.sectionLabel}
          >
            JOURNEY
          </Text>

          <View style={styles.routeRow}>
            {/* FROM */}
            <View
              style={
                styles.locationBox
              }
            >
              <View
                style={styles.greenDot}
              />

              <View
                style={
                  styles.locationContent
                }
              >
                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  FROM
                </Text>

                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="Enter pickup location"
                  placeholderTextColor={
                    COLORS.muted
                  }
                  style={
                    styles.locationInput
                  }
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* SWAP */}
            <Pressable
              onPress={swapLocations}
              style={
                styles.swapButton
              }
              accessibilityRole="button"
              accessibilityLabel="Swap pickup and destination"
            >
              <Text
                style={styles.swap}
              >
                ⇄
              </Text>
            </Pressable>

            {/* TO */}
            <View
              style={
                styles.locationBox
              }
            >
              <View
                style={styles.redDot}
              />

              <View
                style={
                  styles.locationContent
                }
              >
                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  TO
                </Text>

                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="Where do you want to go?"
                  placeholderTextColor={
                    COLORS.muted
                  }
                  style={
                    styles.locationInput
                  }
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <View
            style={styles.dateRow}
          >
            <Text
              style={styles.smallLabel}
            >
              TRAVEL DATE
            </Text>

            <Text
              style={styles.dateText}
            >
              25 August 2026
            </Text>
          </View>
        </View>

        {/* ROUTE INFO */}
        {!from.trim() &&
          !to.trim() && (
            <View
              style={
                styles.routeHint
              }
            >
              <Text
                style={
                  styles.routeHintIcon
                }
              >
                ✦
              </Text>

              <View
                style={
                  styles.routeHintContent
                }
              >
                <Text
                  style={
                    styles.routeHintTitle
                  }
                >
                  Where are you going?
                </Text>

                <Text
                  style={
                    styles.routeHintText
                  }
                >
                  Enter any pickup and
                  destination to find buses.
                </Text>
              </View>
            </View>
          )}

        {/* AVAILABLE BUSES */}
        <View
          style={styles.titleRow}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Available buses
            </Text>

            <Text
              style={styles.sectionSub}
            >
              Choose your preferred bus
            </Text>
          </View>

          <Text
            style={styles.count}
          >
            {buses.length} buses
          </Text>
        </View>

        {buses.map((bus) => {
          const selected =
            selectedBus === bus.id;

          return (
            <Pressable
              key={bus.id}
              onPress={() =>
                openBusPlatform(bus.id)
              }
              style={({ pressed }) => [
                styles.busCard,
                selected &&
                  styles.busCardSelected,
                pressed &&
                  styles.busCardPressed,
              ]}
            >
              <View
                style={styles.busIcon}
              >
                <Image
                  source={{
                    uri: BUS_IMAGE,
                  }}
                  style={
                    styles.busThumbnail
                  }
                  resizeMode="cover"
                />
              </View>

              <View
                style={styles.busInfo}
              >
                <Text
                  style={styles.busName}
                >
                  {bus.name}
                </Text>

                <Text
                  style={styles.busType}
                >
                  {bus.type}
                </Text>

                <View
                  style={
                    styles.timeRow
                  }
                >
                  <Text
                    style={styles.time}
                  >
                    {bus.time}
                  </Text>

                  <Text
                    style={styles.arrow}
                  >
                    →
                  </Text>

                  <Text
                    style={styles.time}
                  >
                    {bus.arrival}
                  </Text>
                </View>
              </View>

              <View
                style={styles.priceBox}
              >
                <Text
                  style={styles.price}
                >
                  ₹{bus.price}
                </Text>

                <Text
                  style={styles.perSeat}
                >
                  /seat
                </Text>

                <View
                  style={[
                    styles.radio,
                    selected &&
                      styles.radioSelected,
                  ]}
                >
                  {selected && (
                    <View
                      style={
                        styles.radioInner
                      }
                    />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* REWARDS */}
        <View
          style={styles.rewardsCard}
        >
          <View
            style={styles.rewardIcon}
          >
            <Text
              style={styles.star}
            >
              ★
            </Text>
          </View>

          <View
            style={styles.rewardText}
          >
            <Text
              style={styles.rewardTitle}
            >
              MF Rewards
            </Text>

            <Text
              style={styles.rewardSub}
            >
              Use your rewards to book
              this ticket
            </Text>
          </View>

          <View
            style={styles.rewardBalance}
          >
            <Text
              style={styles.balance}
            >
              {rewardsBalance}
            </Text>

            <Text
              style={styles.points}
            >
              POINTS
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <Text
          style={styles.paymentTitle}
        >
          Choose payment method
        </Text>

        <View
          style={styles.paymentRow}
        >
          {/* REWARDS */}
          <Pressable
            onPress={() =>
              setPaymentMethod(
                "rewards",
              )
            }
            style={[
              styles.paymentCard,
              paymentMethod ===
                "rewards" &&
                styles.paymentSelected,
            ]}
          >
            <View
              style={styles.paymentIcon}
            >
              <Text>★</Text>
            </View>

            <View
              style={styles.paymentCopy}
            >
              <Text
                style={styles.paymentName}
              >
                MF Rewards
              </Text>

              <Text
                style={styles.paymentSub}
              >
                Pay with points
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  "rewards" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                "rewards" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>

          {/* ONLINE */}
          <Pressable
            onPress={() =>
              setPaymentMethod(
                "online",
              )
            }
            style={[
              styles.paymentCard,
              paymentMethod ===
                "online" &&
                styles.paymentSelected,
            ]}
          >
            <View
              style={styles.paymentIcon}
            >
              <Text>₹</Text>
            </View>

            <View
              style={styles.paymentCopy}
            >
              <Text
                style={styles.paymentName}
              >
                Online Payment
              </Text>

              <Text
                style={styles.paymentSub}
              >
                UPI / Card / Net Banking
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  "online" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                "online" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View
          style={styles.summary}
        >
          <View>
            <Text
              style={styles.summaryLabel}
            >
              TOTAL
            </Text>

            <Text
              style={styles.summaryPrice}
            >
              ₹{selectedBusData.price}
            </Text>
          </View>

          <View
            style={styles.summaryRight}
          >
            <Text
              style={styles.summaryBus}
            >
              {selectedBusData.name}
            </Text>

            <Text
              style={styles.summaryRoute}
              numberOfLines={1}
            >
              {from.trim()
                ? from.trim()
                : "Pickup"}{" "}
              →{" "}
              {to.trim()
                ? to.trim()
                : "Destination"}
            </Text>
          </View>
        </View>

        {/* BOOK BUTTON */}
        <Pressable
          onPress={handleBooking}
          style={({ pressed }) => [
            styles.bookButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={styles.bookButtonText}
          >
            {paymentMethod ===
            "rewards"
              ? "Book with Rewards"
              : "Continue to Payment"}
          </Text>

          <Text
            style={styles.bookArrow}
          >
            →
          </Text>
        </Pressable>

        <Text
          style={styles.secureText}
        >
          🔒 Secure booking • Instant
          confirmation
        </Text>

        {/* CONFIRMATION */}
        {bookingConfirmed && (
          <View
            style={
              styles.confirmationCard
            }
          >
            <View
              style={
                styles.confirmationIcon
              }
            >
              <Text
                style={
                  styles.confirmationIconText
                }
              >
                ✓
              </Text>
            </View>

            <Text
              style={
                styles.confirmationTitle
              }
            >
              Booking Confirmed
            </Text>

            <Text
              style={
                styles.confirmationText
              }
            >
              {selectedBusData.name}
            </Text>

            <Text
              style={
                styles.confirmationRoute
              }
            >
              {from} → {to}
            </Text>

            <Text
              style={
                styles.confirmationPayment
              }
            >
              {paymentMethod ===
              "rewards"
                ? `Paid with ${rewardCost} MF Rewards`
                : `Online payment ₹${selectedBusData.price}`}
            </Text>

            <View
              style={styles.ticketBox}
            >
              <Text
                style={styles.ticketLabel}
              >
                MF BUS TICKET
              </Text>

              <Text
                style={
                  styles.ticketStatus
                }
              >
                BOOKING SUCCESSFUL
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setBookingConfirmed(
                  false,
                )
              }
              style={
                styles.doneButton
              }
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Done
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  platformContent: {
    padding: 18,
    paddingBottom: 50,
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  backText: {
    fontSize: 30,
    color: COLORS.navy,
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.navy,
  },

  headerSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  /* =====================================================
     JOURNEY
  ===================================================== */

  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  locationContent: {
    flex: 1,
    minWidth: 0,
  },

  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    marginRight: 9,
  },

  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.red,
    marginRight: 9,
  },

  smallLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: COLORS.muted,
    letterSpacing: 0.8,
  },

  locationInput: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navy,
    paddingVertical: 3,
    paddingHorizontal: 0,
    minHeight: 32,
  },

  swapButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 7,
    backgroundColor: COLORS.goldLight,
  },

  swap: {
    fontSize: 20,
    color: COLORS.gold,
    fontWeight: "800",
  },

  dateRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 14,
    paddingTop: 14,
  },

  dateText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 5,
  },

  routeHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.goldLight,
    borderRadius: 16,
    padding: 13,
    marginBottom: 18,
  },

  routeHintIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    color: COLORS.white,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 11,
  },

  routeHintContent: {
    flex: 1,
  },

  routeHintTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.navy,
  },

  routeHintText: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  },

  /* =====================================================
     AVAILABLE BUSES
  ===================================================== */

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.navy,
  },

  sectionSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },

  count: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
  },

  busCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  busCardSelected: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },

  busCardPressed: {
    opacity: 0.86,
  },

  busIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.bus,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  busThumbnail: {
    width: "100%",
    height: "100%",
  },

  busInfo: {
    flex: 1,
    minWidth: 0,
  },

  busName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.navy,
  },

  busType: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  time: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.navy,
  },

  arrow: {
    marginHorizontal: 7,
    color: COLORS.gold,
  },

  priceBox: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  price: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.navy,
  },

  perSeat: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 8,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C8C8C8",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: COLORS.gold,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
  },

  /* =====================================================
     REWARDS
  ===================================================== */

  rewardsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy,
    borderRadius: 18,
    padding: 14,
    marginTop: 8,
    marginBottom: 22,
  },

  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  star: {
    color: COLORS.white,
    fontSize: 22,
  },

  rewardText: {
    flex: 1,
  },

  rewardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  rewardSub: {
    color: "#C8CBD4",
    fontSize: 10,
    marginTop: 3,
  },

  rewardBalance: {
    alignItems: "flex-end",
  },

  balance: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: "900",
  },

  points: {
    color: "#C8CBD4",
    fontSize: 7,
    fontWeight: "800",
  },

  /* =====================================================
     PAYMENT
  ===================================================== */

  paymentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 10,
  },

  paymentRow: {
    gap: 10,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  paymentSelected: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    backgroundColor: COLORS.goldLight,
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  paymentCopy: {
    flex: 1,
  },

  paymentName: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.navy,
  },

  paymentSub: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  summaryLabel: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: "900",
  },

  summaryPrice: {
    fontSize: 23,
    color: COLORS.navy,
    fontWeight: "900",
    marginTop: 2,
  },

  summaryRight: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 15,
  },

  summaryBus: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.navy,
  },

  summaryRoute: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
    maxWidth: 220,
  },

  /* =====================================================
     BOOK BUTTON
  ===================================================== */

  bookButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bookButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  bookArrow: {
    color: COLORS.white,
    fontSize: 21,
    marginLeft: 12,
  },

  secureText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 10,
  },

  pressed: {
    opacity: 0.84,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* =====================================================
     CONFIRMATION
  ===================================================== */

  confirmationCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
  },

  confirmationIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmationIconText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
  },

  confirmationTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.navy,
  },

  confirmationText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.navy,
  },

  confirmationRoute: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
  },

  confirmationPayment: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.green,
    textAlign: "center",
  },

  ticketBox: {
    width: "100%",
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.goldLight,
    alignItems: "center",
  },

  ticketLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.navy,
    letterSpacing: 1,
  },

  ticketStatus: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.green,
  },

  doneButton: {
    width: "100%",
    height: 48,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  doneButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  /* =====================================================
     BUS PLATFORM
  ===================================================== */

  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  platformBackButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  platformBackText: {
    fontSize: 30,
    color: COLORS.navy,
    marginTop: -3,
  },

  platformTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.navy,
  },

  platformSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  busHeroCard: {
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    position: "relative",
  },

  busHeroImage: {
    width: "100%",
    height: "100%",
  },

  liveBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#E8FFF2",
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 6,
  },

  liveBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.green,
  },

  platformInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },

  platformOperator: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.navy,
  },

  platformType: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  platformRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
  },

  platformLocation: {
    flex: 1,
    minWidth: 0,
  },

  platformLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.muted,
    letterSpacing: 0.8,
  },

  platformTime: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.navy,
    marginTop: 5,
  },

  platformPlace: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.navy,
    marginTop: 2,
  },

  platformArrowBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },

  platformArrow: {
    fontSize: 22,
    color: COLORS.gold,
    fontWeight: "900",
  },

  platformRight: {
    alignItems: "flex-end",
  },

  platformDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 18,
  },

  platformGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  platformFare: {
    alignItems: "flex-end",
  },

  platformValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 5,
  },

  platformNotice: {
    backgroundColor: COLORS.goldLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  platformNoticeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.navy,
  },

  platformNoticeText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
    marginTop: 7,
  },

  chooseBusButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  chooseBusButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  chooseBusArrow: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 12,
  },
});