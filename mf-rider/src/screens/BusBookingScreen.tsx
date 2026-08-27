import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
};

export function BusBookingScreen({
  onBack,
}: BusBookingScreenProps) {
  const [from, setFrom] = useState("Chilakaluripet");
  const [to, setTo] = useState("Hyderabad");
  const [selectedBus, setSelectedBus] = useState("MF Express");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("online");
  
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const rewardsBalance = 850;

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

  const selectedBusData = useMemo(
    () =>
      buses.find((bus) => bus.id === selectedBus) ??
      buses[0],
    [selectedBus],
  );

  const rewardCost = selectedBusData.price;

 function handleBooking() {
    if (paymentMethod === "rewards") {
        if (rewardsBalance < rewardCost) {
        return;
        }

        setBookingConfirmed(true);
        return;
    }

    // Online payment selected
    setBookingConfirmed(true);
 } 

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>
              Bus Tickets
            </Text>
            <Text style={styles.headerSub}>
              Book your bus journey
            </Text>
          </View>
        </View>

        {/* ROUTE */}
        <View style={styles.routeCard}>
          <Text style={styles.sectionLabel}>JOURNEY</Text>

          <View style={styles.routeRow}>
            <View style={styles.locationBox}>
              <View style={styles.greenDot} />
              <View>
                <Text style={styles.smallLabel}>FROM</Text>
                <Text style={styles.locationText}>
                  {from}
                </Text>
              </View>
            </View>

            <Text style={styles.swap}>⇄</Text>

            <View style={styles.locationBox}>
              <View style={styles.redDot} />
              <View>
                <Text style={styles.smallLabel}>TO</Text>
                <Text style={styles.locationText}>
                  {to}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.smallLabel}>TRAVEL DATE</Text>
            <Text style={styles.dateText}>
              25 August 2026
            </Text>
          </View>
        </View>

        {/* AVAILABLE BUSES */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Available buses
            </Text>
            <Text style={styles.sectionSub}>
              Choose your preferred bus
            </Text>
          </View>

          <Text style={styles.count}>
            {buses.length} buses
          </Text>
        </View>

        {buses.map((bus) => {
          const selected = selectedBus === bus.id;

          return (
            <Pressable
              key={bus.id}
              onPress={() => setSelectedBus(bus.id)}
              style={[
                styles.busCard,
                selected && styles.busCardSelected,
              ]}
            >
              <View style={styles.busIcon}>
                <Text style={styles.busEmoji}>🚌</Text>
              </View>

              <View style={styles.busInfo}>
                <Text style={styles.busName}>
                  {bus.name}
                </Text>

                <Text style={styles.busType}>
                  {bus.type}
                </Text>

                <View style={styles.timeRow}>
                  <Text style={styles.time}>
                    {bus.time}
                  </Text>
                  <Text style={styles.arrow}>
                    →
                  </Text>
                  <Text style={styles.time}>
                    {bus.arrival}
                  </Text>
                </View>
              </View>

              <View style={styles.priceBox}>
                <Text style={styles.price}>
                  ₹{bus.price}
                </Text>
                <Text style={styles.perSeat}>
                  /seat
                </Text>

                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}
                >
                  {selected && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* REWARDS */}
        <View style={styles.rewardsCard}>
          <View style={styles.rewardIcon}>
            <Text style={styles.star}>★</Text>
          </View>

          <View style={styles.rewardText}>
            <Text style={styles.rewardTitle}>
              MF Rewards
            </Text>
            <Text style={styles.rewardSub}>
              Use your rewards to book this ticket
            </Text>
          </View>

          <View style={styles.rewardBalance}>
            <Text style={styles.balance}>
              {rewardsBalance}
            </Text>
            <Text style={styles.points}>
              POINTS
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <Text style={styles.paymentTitle}>
          Choose payment method
        </Text>

        <View style={styles.paymentRow}>
          {/* REWARDS */}
          <Pressable
            onPress={() =>
              setPaymentMethod("rewards")
            }
            style={[
              styles.paymentCard,
              paymentMethod === "rewards" &&
                styles.paymentSelected,
            ]}
          >
            <View style={styles.paymentIcon}>
              <Text>★</Text>
            </View>

            <View style={styles.paymentCopy}>
              <Text style={styles.paymentName}>
                MF Rewards
              </Text>
              <Text style={styles.paymentSub}>
                Pay with points
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === "rewards" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod === "rewards" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>

          {/* ONLINE */}
          <Pressable
            onPress={() =>
              setPaymentMethod("online")
            }
            style={[
              styles.paymentCard,
              paymentMethod === "online" &&
                styles.paymentSelected,
            ]}
          >
            <View style={styles.paymentIcon}>
              <Text>₹</Text>
            </View>

            <View style={styles.paymentCopy}>
              <Text style={styles.paymentName}>
                Online Payment
              </Text>
              <Text style={styles.paymentSub}>
                UPI / Card / Net Banking
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === "online" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod === "online" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>
              TOTAL
            </Text>
            <Text style={styles.summaryPrice}>
              ₹{selectedBusData.price}
            </Text>
          </View>

          <View style={styles.summaryRight}>
            <Text style={styles.summaryBus}>
              {selectedBusData.name}
            </Text>
            <Text style={styles.summaryRoute}>
              {from} → {to}
            </Text>
          </View>
        </View>

        {/* BOOK BUTTON */}
        <Pressable
          onPress={handleBooking}
          style={({ pressed }) => [
            styles.bookButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.bookButtonText}>
            {paymentMethod === "rewards"
              ? "Book with Rewards"
              : "Continue to Payment"}
          </Text>

          <Text style={styles.bookArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.secureText}>
          🔒 Secure booking • Instant confirmation
        </Text>
                {bookingConfirmed && (
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIcon}>
              <Text style={styles.confirmationIconText}>✓</Text>
            </View>

            <Text style={styles.confirmationTitle}>
              Booking Confirmed
            </Text>

            <Text style={styles.confirmationText}>
              {selectedBusData.name}
            </Text>

            <Text style={styles.confirmationRoute}>
              {from} → {to}
            </Text>

            <Text style={styles.confirmationPayment}>
              {paymentMethod === "rewards"
                ? `Paid with ${rewardCost} MF Rewards`
                : `Online payment ₹${selectedBusData.price}`}
            </Text>

            <View style={styles.ticketBox}>
              <Text style={styles.ticketLabel}>
                MF BUS TICKET
              </Text>

              <Text style={styles.ticketStatus}>
                BOOKING SUCCESSFUL
              </Text>
            </View>

            <Pressable
              onPress={() => setBookingConfirmed(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>
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
    paddingBottom: 40,
  },

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

  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 22,
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
    justifyContent: "space-between",
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    backgroundColor: "#E64C4C",
    marginRight: 9,
  },

  smallLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.muted,
    letterSpacing: 0.8,
  },

  locationText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 2,
  },

  swap: {
    fontSize: 22,
    color: COLORS.gold,
    marginHorizontal: 10,
  },

  dateRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 16,
    paddingTop: 14,
  },

  dateText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 5,
  },

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

  busIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.bus,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  busEmoji: {
    fontSize: 26,
  },

  busInfo: {
    flex: 1,
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
  },

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
  },

  confirmationPayment: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.green,
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
});