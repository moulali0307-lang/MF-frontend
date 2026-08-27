import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  onBack: () => void;
}

const movies = [
  {
    id: "1",
    title: "Latest Movie",
    language: "Telugu",
    rating: "UA",
  },
  {
    id: "2",
    title: "Action Night",
    language: "English",
    rating: "U/A",
  },
  {
    id: "3",
    title: "Family Time",
    language: "Telugu",
    rating: "U",
  },
];

const theatres = [
  "MF Cinemas",
  "PVR Cinemas",
  "INOX",
];

const times = [
  "10:00 AM",
  "01:30 PM",
  "04:30 PM",
  "07:30 PM",
  "10:15 PM",
];

export function MovieBookingScreen({ onBack }: Props) {
  const [selectedMovie, setSelectedMovie] =
    useState<string | null>(null);

  const [selectedTheatre, setSelectedTheatre] =
    useState<string | null>(null);

  const [selectedTime, setSelectedTime] =
    useState<string | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  const toggleSeat = (seat: string) => {
    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((item) => item !== seat)
        : [...current, seat],
    );
  };

  const handleContinue = () => {
    if (!selectedMovie) {
      Alert.alert(
        "Select movie",
        "Please select a movie first.",
      );
      return;
    }

    if (!selectedTheatre) {
      Alert.alert(
        "Select theatre",
        "Please select a theatre.",
      );
      return;
    }

    if (!selectedTime) {
      Alert.alert(
        "Select show time",
        "Please select a show time.",
      );
      return;
    }

    if (selectedSeats.length === 0) {
      Alert.alert(
        "Select seats",
        "Please select at least one seat.",
      );
      return;
    }

    const total =
      selectedSeats.length * 180;

    Alert.alert(
      "Confirm Movie Booking",
      `Movie: ${selectedMovie}\nTheatre: ${selectedTheatre}\nShow: ${selectedTime}\nSeats: ${selectedSeats.join(", ")}\n\nTotal: ₹${total}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            Alert.alert(
              "Booking Successful 🎉",
              "Your movie booking has been confirmed.",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>
              Movie Tickets
            </Text>

            <Text style={styles.headerSub}>
              Choose movie, theatre and seats
            </Text>
          </View>
        </View>

        {/* HERO */}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🎬</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              Book movie tickets
            </Text>

            <Text style={styles.heroText}>
              Select your movie, theatre, show and
              seats in a few simple steps.
            </Text>
          </View>
        </View>

        {/* MOVIES */}

        <Text style={styles.sectionTitle}>
          SELECT MOVIE
        </Text>

        {movies.map((movie) => {
          const selected =
            selectedMovie === movie.title;

          return (
            <Pressable
              key={movie.id}
              onPress={() =>
                setSelectedMovie(movie.title)
              }
              style={[
                styles.movieCard,
                selected &&
                  styles.selectedCard,
              ]}
            >
              <View style={styles.movieIcon}>
                <Text style={styles.movieEmoji}>
                  🎬
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.movieTitle}>
                  {movie.title}
                </Text>

                <Text style={styles.movieDetails}>
                  {movie.language} • {movie.rating}
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  selected &&
                    styles.radioSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}

        {/* THEATRE */}

        <Text style={styles.sectionTitle}>
          SELECT THEATRE
        </Text>

        <View style={styles.options}>
          {theatres.map((theatre) => {
            const selected =
              selectedTheatre === theatre;

            return (
              <Pressable
                key={theatre}
                onPress={() =>
                  setSelectedTheatre(theatre)
                }
                style={[
                  styles.option,
                  selected &&
                    styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {theatre}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SHOW TIME */}

        <Text style={styles.sectionTitle}>
          SELECT SHOW TIME
        </Text>

        <View style={styles.timeGrid}>
          {times.map((time) => {
            const selected =
              selectedTime === time;

            return (
              <Pressable
                key={time}
                onPress={() =>
                  setSelectedTime(time)
                }
                style={[
                  styles.timeButton,
                  selected &&
                    styles.timeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    selected &&
                      styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SEATS */}

        <Text style={styles.sectionTitle}>
          SELECT SEATS
        </Text>

        <View style={styles.screenLabel}>
          <Text style={styles.screenText}>
            SCREEN
          </Text>
        </View>

        <View style={styles.seats}>
          {Array.from(
            { length: 20 },
            (_, index) => {
              const seat =
                `${String.fromCharCode(
                  65 + Math.floor(index / 5),
                )}${(index % 5) + 1}`;

              const selected =
                selectedSeats.includes(seat);

              return (
                <Pressable
                  key={seat}
                  onPress={() =>
                    toggleSeat(seat)
                  }
                  style={[
                    styles.seat,
                    selected &&
                      styles.seatSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.seatText,
                      selected &&
                        styles.seatTextSelected,
                    ]}
                  >
                    {seat}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        {/* SUMMARY */}

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryTitle}>
              Booking Summary
            </Text>

            <Text style={styles.summaryText}>
              {selectedSeats.length} seat(s)
            </Text>
          </View>

          <Text style={styles.price}>
            ₹{selectedSeats.length * 180}
          </Text>
        </View>

        {/* CONTINUE */}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.bookButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.bookText}>
            Continue to Booking
          </Text>

          <Text style={styles.bookArrow}>
            →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F6F1",
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
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

  hero: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FCE8E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 24,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroEmoji: {
    fontSize: 32,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#152238",
  },

  heroText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#717489",
  },

  sectionTitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#E7A400",
  },

  movieCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#E7A400",
  },

  movieIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FCE8E8",
    alignItems: "center",
    justifyContent: "center",
  },

  movieEmoji: {
    fontSize: 24,
  },

  movieTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#152238",
  },

  movieDetails: {
    marginTop: 4,
    fontSize: 11,
    color: "#717489",
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D5D0C8",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
  },

  check: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  option: {
    paddingHorizontal: 15,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    justifyContent: "center",
  },

  optionSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
  },

  optionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#152238",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  timeButton: {
    minWidth: 105,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    alignItems: "center",
    justifyContent: "center",
  },

  timeSelected: {
    backgroundColor: "#FFF0C5",
    borderColor: "#E7A400",
  },

  timeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#152238",
  },

  timeTextSelected: {
    color: "#A66F00",
  },

  screenLabel: {
    height: 30,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#171C2B",
    alignItems: "center",
    justifyContent: "center",
  },

  screenText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  seats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  seat: {
    width: 48,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCD6CB",
    alignItems: "center",
    justifyContent: "center",
  },

  seatSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
  },

  seatText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#555B6E",
  },

  seatTextSelected: {
    color: "#FFFFFF",
  },

  summary: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#171C2B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  summaryText: {
    marginTop: 4,
    color: "#BFC4D0",
    fontSize: 11,
  },

  price: {
    color: "#E7A400",
    fontSize: 20,
    fontWeight: "900",
  },

  bookButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#E7A400",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bookText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  bookArrow: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});