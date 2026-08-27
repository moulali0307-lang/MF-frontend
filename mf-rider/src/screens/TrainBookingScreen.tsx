import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import {
  searchStations,
  searchTrains,
} from "../api/railways";

interface Props {
  onBack: () => void;
}

interface RailwayStation {
  code: string;
  name: string;
  city?: string;
}

interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  fare: number | null;
  availableSeats: number | null;
  className: string;
  raw?: any;
}

function formatDate(
  year: number,
  month: number,
  day: number,
) {
  return `${String(day).padStart(2, "0")}/${String(
    month + 1,
  ).padStart(2, "0")}/${year}`;
}

function apiDate(date: string) {
  const parts = date.split("/");

  if (parts.length !== 3) {
    return "";
  }

  const [day, month, year] = parts;

  return `${year}-${month}-${day}`;
}

function normalizeStation(
  station: RailwayStation,
): RailwayStation {
  return {
    code: String(station.code || "").toUpperCase(),
    name: String(station.name || ""),
    city: station.city
      ? String(station.city)
      : undefined,
  };
}

function getTrainArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.trains)) {
    return data.trains;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function firstValue(
  object: any,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function normalizeTrain(
  raw: any,
  index: number,
  from: RailwayStation,
  to: RailwayStation,
): Train {
  const number = String(
    firstValue(
      raw,
      [
        "number",
        "trainNumber",
        "train_no",
        "trainNo",
        "no",
      ],
      "—",
    ),
  );

  const name = String(
    firstValue(
      raw,
      [
        "name",
        "trainName",
        "train_name",
      ],
      "Train",
    ),
  );

  const departure = String(
    firstValue(
      raw,
      [
        "departure",
        "departureTime",
        "departure_time",
        "depTime",
        "fromTime",
      ],
      "—",
    ),
  );

  const arrival = String(
    firstValue(
      raw,
      [
        "arrival",
        "arrivalTime",
        "arrival_time",
        "arrTime",
        "toTime",
      ],
      "—",
    ),
  );

  const duration = String(
    firstValue(
      raw,
      [
        "duration",
        "travelTime",
        "travel_time",
      ],
      "—",
    ),
  );

  const fareValue = firstValue(
    raw,
    [
      "fare",
      "price",
      "ticketPrice",
      "ticket_price",
      "amount",
    ],
    null,
  );

  const seatsValue = firstValue(
    raw,
    [
      "availableSeats",
      "available_seats",
      "seats",
      "seatAvailability",
      "available",
    ],
    null,
  );

  const className = String(
    firstValue(
      raw,
      [
        "className",
        "class",
        "coach",
        "travelClass",
      ],
      "—",
    ),
  );

  return {
    id: String(
      raw?.id ||
        raw?.trainId ||
        `${number}-${index}`,
    ),
    number,
    name,
    from:
      String(
        firstValue(
          raw,
          [
            "from",
            "fromStation",
            "source",
          ],
          from.name,
        ),
      ),
    to:
      String(
        firstValue(
          raw,
          [
            "to",
            "toStation",
            "destination",
          ],
          to.name,
        ),
      ),
    departure,
    arrival,
    duration,
    fare:
      fareValue === null
        ? null
        : Number(fareValue),
    availableSeats:
      seatsValue === null
        ? null
        : Number(seatsValue),
    className,
    raw,
  };
}

function Calendar({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();

  const [month, setMonth] = useState(
    today.getMonth(),
  );

  const [year, setYear] = useState(
    today.getFullYear(),
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const firstDay = new Date(
    year,
    month,
    1,
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push(day);
  }

  function previousMonth() {
    if (
      year === today.getFullYear() &&
      month === today.getMonth()
    ) {
      return;
    }

    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function isPastDate(day: number) {
    const selected = new Date(
      year,
      month,
      day,
    );

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return selected < startOfToday;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.calendarTitle}>
                Select travel date
              </Text>

              <Text style={styles.calendarSub}>
                Choose your journey date
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>
                ×
              </Text>
            </Pressable>
          </View>

          <View style={styles.monthRow}>
            <Pressable
              onPress={previousMonth}
              style={styles.monthButton}
            >
              <Text style={styles.monthArrow}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.monthTitle}>
              {monthNames[month]} {year}
            </Text>

            <Pressable
              onPress={nextMonth}
              style={styles.monthButton}
            >
              <Text style={styles.monthArrow}>
                ›
              </Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <Text
                key={day}
                style={styles.weekDay}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (day === null) {
                return (
                  <View
                    key={`empty-${index}`}
                    style={styles.dayCell}
                  />
                );
              }

              const dateValue =
                formatDate(
                  year,
                  month,
                  day,
                );

              const isSelected =
                selectedDate === dateValue;

              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

              const disabled =
                isPastDate(day);

              return (
                <Pressable
                  key={dateValue}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(dateValue);
                    onClose();
                  }}
                  style={[
                    styles.dayCell,
                    isSelected &&
                      styles.selectedDay,
                    disabled &&
                      styles.disabledDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected &&
                        styles.selectedDayText,
                      isToday &&
                        !isSelected &&
                        styles.todayText,
                      disabled &&
                        styles.disabledDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={styles.calendarCancel}
          >
            <Text style={styles.calendarCancelText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function TrainBookingScreen({
  onBack,
}: Props) {
  const { token } = useAuth();

  const [fromQuery, setFromQuery] =
    useState("");

  const [toQuery, setToQuery] =
    useState("");

  const [fromStation, setFromStation] =
    useState<RailwayStation | null>(null);

  const [toStation, setToStation] =
    useState<RailwayStation | null>(null);

  const [fromSuggestions, setFromSuggestions] =
    useState<RailwayStation[]>([]);

  const [toSuggestions, setToSuggestions] =
    useState<RailwayStation[]>([]);

  const [loadingFromStations, setLoadingFromStations] =
    useState(false);

  const [loadingToStations, setLoadingToStations] =
    useState(false);

  const [date, setDate] =
    useState("");

  const [calendarVisible, setCalendarVisible] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [loadingTrains, setLoadingTrains] =
    useState(false);

  const [availableTrains, setAvailableTrains] =
    useState<Train[]>([]);

  const [selectedTrain, setSelectedTrain] =
    useState<Train | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [showFromSuggestions, setShowFromSuggestions] =
    useState(false);

  const [showToSuggestions, setShowToSuggestions] =
    useState(false);

  /*
   * ---------------------------------------------
   * FROM STATION SEARCH
   * ---------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      const query = fromQuery.trim();

      if (
        query.length < 2 ||
        fromStation
      ) {
        setFromSuggestions([]);
        return;
      }

      if (!token) {
        return;
      }

      setLoadingFromStations(true);

      try {
        const stations =
          await searchStations(
            query,
            token,
          );

        if (cancelled) {
          return;
        }

        const normalized =
          stations
            .map(normalizeStation)
            .filter(
              (station) =>
                station.code &&
                station.name,
            );

        setFromSuggestions(
          normalized,
        );

        setShowFromSuggestions(true);
      } catch (error: any) {
        if (!cancelled) {
          setFromSuggestions([]);
        }

        console.log(
          "FROM STATION SEARCH ERROR:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingFromStations(false);
        }
      }
    }

    const timer =
      setTimeout(
        loadStations,
        350,
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    fromQuery,
    fromStation,
    token,
  ]);

  /*
   * ---------------------------------------------
   * TO STATION SEARCH
   * ---------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      const query = toQuery.trim();

      if (
        query.length < 2 ||
        toStation
      ) {
        setToSuggestions([]);
        return;
      }

      if (!token) {
        return;
      }

      setLoadingToStations(true);

      try {
        const stations =
          await searchStations(
            query,
            token,
          );

        if (cancelled) {
          return;
        }

        const normalized =
          stations
            .map(normalizeStation)
            .filter(
              (station) =>
                station.code &&
                station.name,
            );

        setToSuggestions(
          normalized,
        );

        setShowToSuggestions(true);
      } catch (error: any) {
        if (!cancelled) {
          setToSuggestions([]);
        }

        console.log(
          "TO STATION SEARCH ERROR:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingToStations(false);
        }
      }
    }

    const timer =
      setTimeout(
        loadStations,
        350,
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    toQuery,
    toStation,
    token,
  ]);

  /*
   * ---------------------------------------------
   * SELECT FROM STATION
   * ---------------------------------------------
   */

  function selectFromStation(
    station: RailwayStation,
  ) {
    setFromStation(station);
    setFromQuery(
      `${station.name} (${station.code})`,
    );
    setFromSuggestions([]);
    setShowFromSuggestions(false);
    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
  }

  /*
   * ---------------------------------------------
   * SELECT TO STATION
   * ---------------------------------------------
   */

  function selectToStation(
    station: RailwayStation,
  ) {
    setToStation(station);
    setToQuery(
      `${station.name} (${station.code})`,
    );
    setToSuggestions([]);
    setShowToSuggestions(false);
    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
  }

  /*
   * ---------------------------------------------
   * SWAP
   * ---------------------------------------------
   */

  function swapStations() {
    const oldFromStation =
      fromStation;

    const oldFromQuery =
      fromQuery;

    setFromStation(toStation);
    setToStation(oldFromStation);

    setFromQuery(toQuery);
    setToQuery(oldFromQuery);

    setFromSuggestions([]);
    setToSuggestions([]);
    setShowFromSuggestions(false);
    setShowToSuggestions(false);

    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
  }

  /*
   * ---------------------------------------------
   * SEARCH REAL TRAINS
   * ---------------------------------------------
   */

  async function handleSearchTrains() {
    setErrorMessage("");
    setSelectedTrain(null);
    setAvailableTrains([]);
    setSearched(false);

    if (!token) {
      setErrorMessage(
        "Your login session has expired. Please login again.",
      );
      return;
    }

    if (!fromStation) {
      setErrorMessage(
        "Please select a departure station from the suggestions.",
      );
      setShowFromSuggestions(
        fromSuggestions.length > 0,
      );
      return;
    }

    if (!toStation) {
      setErrorMessage(
        "Please select a destination station from the suggestions.",
      );
      setShowToSuggestions(
        toSuggestions.length > 0,
      );
      return;
    }

    if (
      fromStation.code ===
      toStation.code
    ) {
      setErrorMessage(
        "Departure and destination stations cannot be the same.",
      );
      return;
    }

    if (!date) {
      setCalendarVisible(true);
      return;
    }

    setLoadingTrains(true);

    try {
      const result =
        await searchTrains(
          fromStation.code,
          toStation.code,
          apiDate(date),
          token ?? undefined
        );

      const rawTrains =
        getTrainArray(result);

      const trains =
        rawTrains.map(
          (train, index) =>
            normalizeTrain(
              train,
              index,
              fromStation,
              toStation,
            ),
        );

      setAvailableTrains(trains);
      setSearched(true);

      if (trains.length === 0) {
        setErrorMessage(
          "No trains are available for this route and date.",
        );
      }
    } catch (error: any) {
      console.log(
        "TRAIN SEARCH ERROR:",
        error,
      );

      setSearched(true);

      setErrorMessage(
        error?.message ||
          "Unable to search trains right now. Please try again.",
      );
    } finally {
      setLoadingTrains(false);
    }
  }

  /*
   * ---------------------------------------------
   * BOOK
   * ---------------------------------------------
   */

  function selectTrain(train: Train) {
    setSelectedTrain(train);
  }

  function confirmBooking() {
    if (!selectedTrain) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * We are NOT showing a fake
     * "will open here" popup.
     *
     * The real passenger/payment/booking API
     * needs to be connected here.
     */

    Alert.alert(
      "Train Selected",
      `${selectedTrain.name} (${selectedTrain.number}) is selected.\n\n${fromStation?.name} → ${toStation?.name}\nDate: ${date}`,
    );
  }

  const routeLabel = useMemo(() => {
    if (
      fromStation &&
      toStation
    ) {
      return `${fromStation.name} → ${toStation.name}`;
    }

    return "Select your journey";
  }, [
    fromStation,
    toStation,
  ]);

  return (
    <View style={styles.screen}>
      {calendarVisible && (
        <Calendar
          selectedDate={date}
          onSelect={(selected) => {
            setDate(selected);
            setSearched(false);
            setAvailableTrains([]);
            setSelectedTrain(null);
            setErrorMessage("");
          }}
          onClose={() =>
            setCalendarVisible(false)
          }
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.container
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ←
            </Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Train Tickets
            </Text>

            <Text style={styles.headerSub}>
              Search and book available trains
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              MF
            </Text>
          </View>
        </View>

        {/* HERO */}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>
              🚆
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              Where are you travelling?
            </Text>

            <Text style={styles.heroText}>
              Search any Indian railway station,
              choose your date and find available
              trains.
            </Text>
          </View>
        </View>

        {/* SEARCH CARD */}

        <View style={styles.searchCard}>
          <Text style={styles.sectionLabel}>
            SEARCH TRAINS
          </Text>

          {/* FROM */}

          <View style={styles.field}>
            <Text style={styles.label}>
              FROM
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>
                📍
              </Text>

              <TextInput
                value={fromQuery}
                onChangeText={(value) => {
                  setFromQuery(value);
                  setFromStation(null);
                  setSearched(false);
                  setAvailableTrains([]);
                  setSelectedTrain(null);
                  setErrorMessage("");
                }}
                onFocus={() => {
                  if (
                    fromSuggestions.length
                  ) {
                    setShowFromSuggestions(
                      true,
                    );
                  }
                }}
                placeholder="Search departure station"
                placeholderTextColor="#8A8F9F"
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />

              {loadingFromStations && (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />
              )}
            </View>

            {showFromSuggestions &&
              fromSuggestions.length > 0 && (
                <View style={styles.suggestionsCard}>
                  {fromSuggestions.map(
                    (station) => (
                      <Pressable
                        key={station.code}
                        onPress={() =>
                          selectFromStation(
                            station,
                          )
                        }
                        style={
                          styles.suggestionItem
                        }
                      >
                        <View
                          style={
                            styles.stationPin
                          }
                        >
                          <Text>
                            🚉
                          </Text>
                        </View>

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.suggestionName
                            }
                          >
                            {station.name}
                          </Text>

                          <Text
                            style={
                              styles.suggestionMeta
                            }
                          >
                            {station.code}
                            {station.city
                              ? ` • ${station.city}`
                              : ""}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.suggestionArrow
                          }
                        >
                          →
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              )}
          </View>

          {/* SWAP */}

          <View style={styles.swapRow}>
            <View style={styles.line} />

            <Pressable
              onPress={swapStations}
              style={styles.swapButton}
            >
              <Text style={styles.swapText}>
                ⇅
              </Text>
            </Pressable>

            <View style={styles.line} />
          </View>

          {/* TO */}

          <View style={styles.field}>
            <Text style={styles.label}>
              TO
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>
                📍
              </Text>

              <TextInput
                value={toQuery}
                onChangeText={(value) => {
                  setToQuery(value);
                  setToStation(null);
                  setSearched(false);
                  setAvailableTrains([]);
                  setSelectedTrain(null);
                  setErrorMessage("");
                }}
                onFocus={() => {
                  if (
                    toSuggestions.length
                  ) {
                    setShowToSuggestions(
                      true,
                    );
                  }
                }}
                placeholder="Search destination station"
                placeholderTextColor="#8A8F9F"
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />

              {loadingToStations && (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />
              )}
            </View>

            {showToSuggestions &&
              toSuggestions.length > 0 && (
                <View style={styles.suggestionsCard}>
                  {toSuggestions.map(
                    (station) => (
                      <Pressable
                        key={station.code}
                        onPress={() =>
                          selectToStation(
                            station,
                          )
                        }
                        style={
                          styles.suggestionItem
                        }
                      >
                        <View
                          style={
                            styles.stationPin
                          }
                        >
                          <Text>
                            🚉
                          </Text>
                        </View>

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.suggestionName
                            }
                          >
                            {station.name}
                          </Text>

                          <Text
                            style={
                              styles.suggestionMeta
                            }
                          >
                            {station.code}
                            {station.city
                              ? ` • ${station.city}`
                              : ""}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.suggestionArrow
                          }
                        >
                          →
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              )}
          </View>

          {/* DATE */}

          <View style={styles.field}>
            <Text style={styles.label}>
              TRAVEL DATE
            </Text>

            <Pressable
              onPress={() =>
                setCalendarVisible(true)
              }
              style={styles.dateButton}
            >
              <Text style={styles.inputIcon}>
                📅
              </Text>

              <Text
                style={[
                  styles.dateText,
                  !date &&
                    styles.datePlaceholder,
                ]}
              >
                {date ||
                  "Select travel date"}
              </Text>

              <Text style={styles.calendarArrow}>
                ›
              </Text>
            </Pressable>
          </View>

          {/* ERROR */}

          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>
                !
              </Text>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* SEARCH BUTTON */}

          <Pressable
            disabled={loadingTrains}
            onPress={handleSearchTrains}
            style={({ pressed }) => [
              styles.searchButton,
              pressed &&
                !loadingTrains &&
                styles.buttonPressed,
              loadingTrains &&
                styles.disabledButton,
            ]}
          >
            {loadingTrains ? (
              <>
                <ActivityIndicator
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.searchButtonText
                  }
                >
                  Searching trains...
                </Text>

                <View style={{ width: 20 }} />
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.searchButtonText
                  }
                >
                  Search Available Trains
                </Text>

                <Text style={styles.searchArrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ROUTE SUMMARY */}

        {fromStation &&
          toStation && (
            <View style={styles.routeSummary}>
              <View>
                <Text style={styles.routeSummaryLabel}>
                  JOURNEY
                </Text>

                <Text style={styles.routeSummaryTitle}>
                  {routeLabel}
                </Text>
              </View>

              <View style={styles.codePill}>
                <Text style={styles.codePillText}>
                  {fromStation.code}
                </Text>

                <Text style={styles.codeArrow}>
                  →
                </Text>

                <Text style={styles.codePillText}>
                  {toStation.code}
                </Text>
              </View>
            </View>
          )}

        {/* RESULTS */}

        {searched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultsTitle}>
                  Available Trains
                </Text>

                <Text style={styles.routeText}>
                  {routeLabel}
                </Text>

                <Text
                  style={styles.dateTextSmall}
                >
                  Travel date: {date}
                </Text>
              </View>

              <View style={styles.countCircle}>
                <Text style={styles.countText}>
                  {availableTrains.length}
                </Text>
              </View>
            </View>

            {availableTrains.map(
              (train) => (
                <View
                  key={train.id}
                  style={[
                    styles.trainCard,
                    selectedTrain?.id ===
                      train.id &&
                      styles.selectedTrainCard,
                  ]}
                >
                  <View style={styles.trainTop}>
                    <View
                      style={
                        styles.trainIconBox
                      }
                    >
                      <Text
                        style={
                          styles.trainIcon
                        }
                      >
                        🚆
                      </Text>
                    </View>

                    <View
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={
                          styles.trainName
                        }
                        numberOfLines={2}
                      >
                        {train.name}
                      </Text>

                      <Text
                        style={
                          styles.trainNumber
                        }
                      >
                        Train No. {train.number}
                      </Text>
                    </View>

                    <View
                      style={styles.priceBox}
                    >
                      <Text
                        style={
                          styles.priceLabel
                        }
                      >
                        FARE
                      </Text>

                      <Text
                        style={styles.price}
                      >
                        {train.fare !== null
                          ? `₹${train.fare}`
                          : "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.journey}>
                    <View
                      style={styles.station}
                    >
                      <Text
                        style={styles.time}
                      >
                        {train.departure}
                      </Text>

                      <Text
                        style={
                          styles.stationName
                        }
                        numberOfLines={1}
                      >
                        {train.from}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.journeyMiddle
                      }
                    >
                      <Text
                        style={
                          styles.duration
                        }
                      >
                        {train.duration}
                      </Text>

                      <View
                        style={
                          styles.routeLine
                        }
                      >
                        <View
                          style={styles.dot}
                        />

                        <View
                          style={
                            styles.routeLineInner
                          }
                        />

                        <View
                          style={styles.dot}
                        />
                      </View>
                    </View>

                    <View
                      style={[
                        styles.station,
                        {
                          alignItems:
                            "flex-end",
                        },
                      ]}
                    >
                      <Text
                        style={styles.time}
                      >
                        {train.arrival}
                      </Text>

                      <Text
                        style={
                          styles.stationName
                        }
                        numberOfLines={1}
                      >
                        {train.to}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.detailsRow}
                  >
                    <View
                      style={styles.detailItem}
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        CLASS
                      </Text>

                      <Text
                        style={
                          styles.detailValue
                        }
                      >
                        {train.className}
                      </Text>
                    </View>

                    <View
                      style={styles.detailItem}
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        SEATS
                      </Text>

                      <Text
                        style={[
                          styles.detailValue,
                          train.availableSeats !==
                            null &&
                            train.availableSeats <=
                              10 &&
                            styles.lowSeats,
                        ]}
                      >
                        {train.availableSeats !==
                        null
                          ? train.availableSeats
                          : "Check"}
                      </Text>
                    </View>

                    <View
                      style={styles.detailItem}
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        STATUS
                      </Text>

                      <Text
                        style={
                          styles.available
                        }
                      >
                        AVAILABLE
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() =>
                      selectTrain(train)
                    }
                    style={({ pressed }) => [
                      styles.bookButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.bookButtonText
                      }
                    >
                      Select & Book Train
                    </Text>

                    <Text
                      style={styles.bookArrow}
                    >
                      →
                    </Text>
                  </Pressable>
                </View>
              ),
            )}

            {/* NO RESULTS */}

            {availableTrains.length ===
              0 && (
              <View
                style={styles.emptyCard}
              >
                <Text
                  style={styles.emptyIcon}
                >
                  🚆
                </Text>

                <Text
                  style={styles.emptyTitle}
                >
                  No trains found
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  There are no trains returned
                  by the railway service for
                  this route and date.
                </Text>

                <Text
                  style={styles.emptyHint}
                >
                  Try another station or travel
                  date.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* BOOKING PANEL */}

        {selectedTrain && (
          <View style={styles.bookingPanel}>
            <View
              style={
                styles.bookingPanelHeader
              }
            >
              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={styles.bookingLabel}
                >
                  SELECTED TRAIN
                </Text>

                <Text
                  style={styles.bookingTitle}
                >
                  {selectedTrain.name}
                </Text>

                <Text
                  style={styles.bookingTrainNumber}
                >
                  Train No.{" "}
                  {selectedTrain.number}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectedTrain(null)
                }
              >
                <Text
                  style={styles.removeText}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <View
              style={styles.bookingRoute}
            >
              <View>
                <Text
                  style={styles.bookingTime}
                >
                  {selectedTrain.departure}
                </Text>

                <Text
                  style={
                    styles.bookingStation
                  }
                >
                  {fromStation?.name}
                </Text>

                <Text
                  style={
                    styles.bookingCode
                  }
                >
                  {fromStation?.code}
                </Text>
              </View>

              <Text
                style={styles.bookingArrow}
              >
                →
              </Text>

              <View
                style={{
                  alignItems:
                    "flex-end",
                }}
              >
                <Text
                  style={styles.bookingTime}
                >
                  {selectedTrain.arrival}
                </Text>

                <Text
                  style={
                    styles.bookingStation
                  }
                >
                  {toStation?.name}
                </Text>

                <Text
                  style={
                    styles.bookingCode
                  }
                >
                  {toStation?.code}
                </Text>
              </View>
            </View>

            <View
              style={styles.bookingSummary}
            >
              <View>
                <Text
                  style={styles.summaryText}
                >
                  Travel date
                </Text>

                <Text
                  style={styles.summaryValue}
                >
                  {date}
                </Text>
              </View>

              <View
                style={{
                  alignItems:
                    "flex-end",
                }}
              >
                <Text
                  style={styles.summaryText}
                >
                  Fare
                </Text>

                <Text
                  style={styles.summaryValue}
                >
                  {selectedTrain.fare !==
                  null
                    ? `₹${selectedTrain.fare}`
                    : "Check"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={confirmBooking}
              style={styles.confirmButton}
            >
              <Text
                style={styles.confirmText}
              >
                Continue to Passenger Details
              </Text>

              <Text
                style={styles.confirmArrow}
              >
                →
              </Text>
            </Pressable>
          </View>
        )}

        {/* INFO */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text
              style={styles.infoIconText}
            >
              MF
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.infoTitle}
            >
              Easy train booking
            </Text>

            <Text
              style={styles.infoText}
            >
              Search any available railway
              station, select your journey date,
              compare trains and choose your
              preferred train.
            </Text>
          </View>
        </View>
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
    padding: 22,
    paddingBottom: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
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
    borderColor: "#E4DED3",
    marginRight: 14,
  },

  backText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#152238",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#152238",
  },

  headerSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#73798B",
  },

  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF0C9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7A400",
  },

  headerBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#D79500",
  },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#EAF0FF",
    marginBottom: 18,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  heroEmoji: {
    fontSize: 32,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#152238",
  },

  heroText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#73798B",
  },

  searchCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4DED3",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#D79500",
    marginBottom: 15,
  },

  field: {
    marginBottom: 12,
  },

  label: {
    marginBottom: 6,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: "#555B6E",
  },

  inputWrapper: {
    minHeight: 55,
    borderRadius: 14,
    backgroundColor: "#FCFBF8",
    borderWidth: 1,
    borderColor: "#DDD7CC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  inputIcon: {
    fontSize: 19,
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#152238",
    outlineStyle: "none" as any,
    outlineWidth: 0,
    borderWidth: 0,
  },

  suggestionsCard: {
    marginTop: 6,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    overflow: "hidden",
  },

  suggestionItem: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE5",
  },

  stationPin: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  suggestionName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#152238",
  },

  suggestionMeta: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#858A98",
  },

  suggestionArrow: {
    fontSize: 18,
    fontWeight: "900",
    color: "#D79500",
    marginLeft: 8,
  },

  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5DED2",
  },

  swapButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1C9",
    borderWidth: 1,
    borderColor: "#F0C65D",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },

  swapText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#D79500",
  },

  dateButton: {
    minHeight: 55,
    borderRadius: 14,
    backgroundColor: "#FCFBF8",
    borderWidth: 1,
    borderColor: "#DDD7CC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  dateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#152238",
  },

  datePlaceholder: {
    color: "#8A8F9F",
  },

  calendarArrow: {
    fontSize: 24,
    fontWeight: "700",
    color: "#D79500",
  },

  errorBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#F2C7C7",
    flexDirection: "row",
    alignItems: "center",
  },

  errorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D94A4A",
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 9,
  },

  errorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#A63838",
    fontWeight: "700",
  },

  searchButton: {
    minHeight: 54,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: "#E7A400",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
  },

  disabledButton: {
    opacity: 0.65,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  searchArrow: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  routeSummary: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#171C2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  routeSummaryLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#E7A400",
  },

  routeSummaryTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    maxWidth: 220,
  },

  codePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#23293A",
    flexDirection: "row",
    alignItems: "center",
  },

  codePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  codeArrow: {
    color: "#E7A400",
    marginHorizontal: 5,
    fontWeight: "900",
  },

  resultsSection: {
    marginTop: 24,
  },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  resultsTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#152238",
  },

  routeText: {
    marginTop: 3,
    fontSize: 12,
    color: "#70768A",
    fontWeight: "700",
  },

  dateTextSmall: {
    marginTop: 3,
    fontSize: 11,
    color: "#9297A5",
  },

  countCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0C9",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#D79500",
  },

  trainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E2DDD4",
  },

  selectedTrainCard: {
    borderColor: "#E7A400",
    borderWidth: 2,
  },

  trainTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  trainIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  trainIcon: {
    fontSize: 25,
  },

  trainName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#152238",
  },

  trainNumber: {
    marginTop: 3,
    fontSize: 11,
    color: "#7C8190",
    fontWeight: "600",
  },

  priceBox: {
    alignItems: "flex-end",
  },

  priceLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#999EA9",
    letterSpacing: 0.8,
  },

  price: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: "#152238",
  },

  journey: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 19,
  },

  station: {
    flex: 1,
  },

  time: {
    fontSize: 15,
    fontWeight: "900",
    color: "#152238",
  },

  stationName: {
    marginTop: 4,
    fontSize: 11,
    color: "#777D8D",
    fontWeight: "700",
  },

  journeyMiddle: {
    flex: 1.5,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  duration: {
    fontSize: 9,
    color: "#8B909D",
    marginBottom: 5,
    fontWeight: "700",
  },

  routeLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E7A400",
  },

  routeLineInner: {
    flex: 1,
    height: 1,
    backgroundColor: "#DED8CD",
  },

  detailsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEE9E1",
    marginTop: 17,
    paddingTop: 13,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#999EA9",
    letterSpacing: 0.7,
  },

  detailValue: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#152238",
  },

  lowSeats: {
    color: "#D96B00",
  },

  available: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "900",
    color: "#0A9B68",
  },

  bookButton: {
    minHeight: 47,
    marginTop: 15,
    borderRadius: 13,
    backgroundColor: "#E7A400",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  bookArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2DDD4",
    padding: 35,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#152238",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#777D8D",
    textAlign: "center",
    lineHeight: 18,
  },

  emptyHint: {
    marginTop: 10,
    fontSize: 11,
    color: "#D79500",
    fontWeight: "800",
    textAlign: "center",
  },

  bookingPanel: {
    marginTop: 5,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#171C2B",
  },

  bookingPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  bookingLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#E7A400",
  },

  bookingTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  bookingTrainNumber: {
    marginTop: 3,
    fontSize: 10,
    color: "#AEB4C2",
  },

  removeText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
  },

  bookingRoute: {
    marginTop: 18,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#23293A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bookingTime: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  bookingStation: {
    marginTop: 3,
    fontSize: 10,
    color: "#BFC4D0",
    maxWidth: 130,
  },

  bookingCode: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "900",
    color: "#E7A400",
  },

  bookingArrow: {
    fontSize: 20,
    color: "#E7A400",
  },

  bookingSummary: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryText: {
    fontSize: 10,
    color: "#AEB4C2",
  },

  summaryValue: {
    marginTop: 3,
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  confirmButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: "#E7A400",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  confirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  confirmArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  infoCard: {
    marginTop: 20,
    padding: 17,
    borderRadius: 20,
    backgroundColor: "#171C2B",
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E7A400",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  infoText: {
    marginTop: 4,
    color: "#BFC4D0",
    fontSize: 10,
    lineHeight: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  calendarCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  calendarTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#152238",
  },

  calendarSub: {
    marginTop: 4,
    fontSize: 11,
    color: "#7B8190",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F2EC",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 24,
    color: "#152238",
    lineHeight: 26,
  },

  monthRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF1C9",
    alignItems: "center",
    justifyContent: "center",
  },

  monthArrow: {
    fontSize: 25,
    color: "#D79500",
    fontWeight: "700",
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#152238",
  },

  weekRow: {
    marginTop: 18,
    flexDirection: "row",
  },

  weekDay: {
    width: "14.285%",
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    color: "#8A8F9F",
  },

  daysGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.285%",
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedDay: {
    width: "14.285%",
    height: 43,
    borderRadius: 14,
    backgroundColor: "#E7A400",
  },

  disabledDay: {
    opacity: 0.35,
  },

  dayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#152238",
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  todayText: {
    color: "#D79500",
    fontWeight: "900",
  },

  disabledDayText: {
    color: "#B7B7B7",
  },

  calendarCancel: {
    marginTop: 14,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#F5F2EC",
    alignItems: "center",
    justifyContent: "center",
  },

  calendarCancelText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#152238",
  },
});