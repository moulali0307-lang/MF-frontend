import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  onBack: () => void;
  onBus: () => void;
  onTrain: () => void;
  onMovies: () => void;
  onRecharge: () => void;
}

export function MoreServicesScreen({
  onBack,
  onBus,
  onTrain,
  onMovies,
  onRecharge,
}: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>More Services</Text>
            <Text style={styles.headerSub}>
              Everything you need in MF
            </Text>
          </View>
        </View>

        {/* TITLE */}

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>MF SERVICES</Text>

          <Text style={styles.title}>
            Travel, tickets & more.
          </Text>

          <Text style={styles.description}>
            Book tickets, recharge your mobile and
            access all MF services from one place.
          </Text>
        </View>

        {/* BUS */}

        <ServiceCard
          icon="🚌"
          title="Bus Tickets"
          subtitle="Search routes and book bus tickets"
          button="Book Bus Ticket"
          background="#E8F7F6"
          onPress={onBus}
        />

        {/* TRAIN */}

        <ServiceCard
          icon="🚆"
          title="Train Tickets"
          subtitle="Find trains and book your journey"
          button="Book Train Ticket"
          background="#EAF0FF"
          onPress={onTrain}
        />

        {/* MOVIES */}

        <ServiceCard
          icon="🎬"
          title="Movie Tickets"
          subtitle="Choose movies, theatres and seats"
          button="Book Movie Ticket"
          background="#FCE8E8"
          onPress={onMovies}
        />

        {/* RECHARGE */}

        <ServiceCard
          icon="⚡"
          title="Recharge"
          subtitle="Mobile, DTH and other recharges"
          button="Recharge Now"
          background="#ECF7DE"
          onPress={onRecharge}
        />

        {/* INFO */}

        <View style={styles.info}>
          <Text style={styles.infoIcon}>MF</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              One app. Everything.
            </Text>

            <Text style={styles.infoText}>
              Your MF account can be used across
              all available services.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceCard({
  icon,
  title,
  subtitle,
  button,
  background,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  button: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: background },
        pressed && {
          opacity: 0.85,
          transform: [{ scale: 0.99 }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <Text style={styles.arrow}>→</Text>
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardSubtitle}>
        {subtitle}
      </Text>

      <View style={styles.bookButton}>
        <Text style={styles.bookButtonText}>
          {button}
        </Text>

        <Text style={styles.bookArrow}>
          →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F6F1",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 30,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7E0D4",
  },

  backText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#152238",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#152238",
  },

  headerSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#717489",
  },

  intro: {
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#E7A400",
  },

  title: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: "900",
    color: "#152238",
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#717489",
    maxWidth: 500,
  },

  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 27,
  },

  arrow: {
    fontSize: 25,
    fontWeight: "900",
    color: "#152238",
  },

  cardTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "900",
    color: "#152238",
  },

  cardSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#717489",
  },

  bookButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#E7A400",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  bookArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  info: {
    marginTop: 10,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#171C2B",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#E7A400",
    color: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 15,
    fontWeight: "900",
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  infoText: {
    marginTop: 4,
    color: "#BFC4D0",
    fontSize: 11,
    lineHeight: 16,
  },
});