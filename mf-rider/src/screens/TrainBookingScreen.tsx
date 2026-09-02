import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getLiveTrainStatus,
  searchStations,
  searchTrains,
  type RailwayStation,
  type RailwayTrain,
  type LiveTrainStatus,
} from "../api/railways";

import { useAuth } from "../context/AuthContext";

interface Props {
  onBack: () => void;
}

interface CalendarProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateValue(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDisplayDate(
  date: string,
): string {
  if (!date) {
    return "";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function isPastDate(
  year: number,
  month: number,
  day: number,
): boolean {
  const today = new Date();

  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const value = new Date(
    year,
    month,
    day,
  );

  return value < current;
}

function formatDuration(
  minutes?: number,
): string {
  if (
    minutes === undefined ||
    Number.isNaN(Number(minutes)) ||
    Number(minutes) <= 0
  ) {
    return "--";
  }

  const total = Math.round(
    Number(minutes),
  );

  const hours = Math.floor(
    total / 60,
  );

  const mins = total % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

function safeString(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function normalizeStation(
  raw: any,
): RailwayStation {
  return {
    code: safeString(
      raw?.code ??
        raw?.stationCode ??
        raw?.station?.code,
    ).toUpperCase(),

    name: safeString(
      raw?.name ??
        raw?.stationName ??
        raw?.station?.name ??
        "Station",
    ),

    city: safeString(
      raw?.city ??
        raw?.cityName ??
        raw?.station?.city,
    ),
  };
}

function normalizeTrain(
  raw: RailwayTrain | any,
): RailwayTrain {
  const train =
    raw?.train ?? raw;

  const from =
    raw?.from ?? {};

  const to =
    raw?.to ?? {};

  const live =
    raw?.live ?? undefined;

  return {
    train: {
      number: safeString(
        train?.number ??
          raw?.number,
      ),

      name: safeString(
        train?.name ??
          raw?.name ??
          "Train",
      ),

      type: safeString(
        train?.type ??
          raw?.type,
      ),

      category: safeString(
        train?.category ??
          raw?.category,
      ),

      runDays: Array.isArray(
        train?.runDays,
      )
        ? train.runDays
        : [],
    },

    from: {
      departure:
        safeString(
          from?.departure ??
            raw?.departure,
        ) || undefined,

      day:
        typeof from?.day === "number"
          ? from.day
          : undefined,

      sequence:
        typeof from?.sequence === "number"
          ? from.sequence
          : undefined,
    },

    to: {
      arrival:
        safeString(
          to?.arrival ??
            raw?.arrival,
        ) || undefined,

      day:
        typeof to?.day === "number"
          ? to.day
          : undefined,

      sequence:
        typeof to?.sequence === "number"
          ? to.sequence
          : undefined,
    },

    distance:
      typeof raw?.distance === "number"
        ? raw.distance
        : undefined,

    duration:
      typeof raw?.duration === "number"
        ? raw.duration
        : undefined,

    totalHaltsBetween:
      typeof raw?.totalHaltsBetween ===
      "number"
        ? raw.totalHaltsBetween
        : undefined,

    live: live
      ? {
          type: safeString(
            live?.type,
          ),

          startDate:
            safeString(
              live?.startDate,
            ) || undefined,

          expectedArrivalTime:
            live?.expectedArrivalTime ??
            null,

          expectedDepartureTime:
            live?.expectedDepartureTime ??
            null,

          platform:
            live?.platform ??
            null,

          delayMinutes:
            typeof live?.delayMinutes ===
            "number"
              ? live.delayMinutes
              : null,
        }
      : undefined,
  };
}

/* -------------------------------------------------------
   CALENDAR
------------------------------------------------------- */

function TrainCalendar({
  visible,
  selectedDate,
  onClose,
  onSelect,
}: CalendarProps) {
  const initialDate =
    selectedDate
      ? new Date(`${selectedDate}T00:00:00`)
      : new Date();

  const [month, setMonth] =
    useState(initialDate.getMonth());

  const [year, setYear] =
    useState(initialDate.getFullYear());

  useEffect(() => {
    if (!visible) {
      return;
    }

    const value =
      selectedDate
        ? new Date(
            `${selectedDate}T00:00:00`,
          )
        : new Date();

    setMonth(value.getMonth());
    setYear(value.getFullYear());
  }, [
    visible,
    selectedDate,
  ]);

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate();

  const firstDay =
    new Date(
      year,
      month,
      1,
    ).getDay();

  const cells: Array<
    number | null
  > = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  function previousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
      return;
    }

    setMonth((value) => value - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
      return;
    }

    setMonth((value) => value + 1);
  }

  const monthName =
    new Date(
      year,
      month,
      1,
    ).toLocaleString(
      "en-IN",
      {
        month: "long",
      },
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.calendarCard}>
          <View
            style={styles.calendarHeader}
          >
            <Pressable
              onPress={previousMonth}
              style={styles.monthButton}
            >
              <Text
                style={
                  styles.monthButtonText
                }
              >
                ‹
              </Text>
            </Pressable>

            <Text
              style={styles.calendarTitle}
            >
              {monthName} {year}
            </Text>

            <Pressable
              onPress={nextMonth}
              style={styles.monthButton}
            >
              <Text
                style={
                  styles.monthButtonText
                }
              >
                ›
              </Text>
            </Pressable>
          </View>

          <View
            style={styles.weekRow}
          >
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <Text
                key={day}
                style={styles.weekText}
              >
                {day}
              </Text>
            ))}
          </View>

          <View
            style={styles.calendarGrid}
          >
            {cells.map(
              (day, index) => {
                if (day === null) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={
                        styles.dayCell
                      }
                    />
                  );
                }

                const value =
                  formatDateValue(
                    year,
                    month,
                    day,
                  );

                const selected =
                  value ===
                  selectedDate;

                const disabled =
                  isPastDate(
                    year,
                    month,
                    day,
                  );

                return (
                  <Pressable
                    key={value}
                    disabled={disabled}
                    onPress={() => {
                      onSelect(value);
                      onClose();
                    }}
                    style={[
                      styles.dayCell,
                      selected &&
                        styles.selectedDay,
                      disabled &&
                        styles.disabledDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected &&
                          styles.selectedDayText,
                        disabled &&
                          styles.disabledDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>

          <Pressable
            onPress={onClose}
            style={styles.calendarCancel}
          >
            <Text
              style={
                styles.calendarCancelText
              }
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------
   MAIN SCREEN
------------------------------------------------------- */

export function TrainBookingScreen({
  onBack,
}: Props) {
  const { token } = useAuth();

  const [fromQuery, setFromQuery] =
    useState("");

  const [toQuery, setToQuery] =
    useState("");

  const [fromStation, setFromStation] =
    useState<RailwayStation | null>(
      null,
    );

  const [toStation, setToStation] =
    useState<RailwayStation | null>(
      null,
    );

  const [
    fromSuggestions,
    setFromSuggestions,
  ] = useState<RailwayStation[]>(
    [],
  );

  const [
    toSuggestions,
    setToSuggestions,
  ] = useState<RailwayStation[]>(
    [],
  );

  const [
    loadingFromStations,
    setLoadingFromStations,
  ] = useState(false);

  const [
    loadingToStations,
    setLoadingToStations,
  ] = useState(false);

  const [date, setDate] =
    useState("");

  const [
    calendarVisible,
    setCalendarVisible,
  ] = useState(false);

  const [searched, setSearched] =
    useState(false);

  const [
    loadingTrains,
    setLoadingTrains,
  ] = useState(false);

  const [
    availableTrains,
    setAvailableTrains,
  ] = useState<RailwayTrain[]>(
    [],
  );

  const [
    selectedTrain,
    setSelectedTrain,
  ] = useState<RailwayTrain | null>(
    null,
  );

  const [
    loadingLive,
    setLoadingLive,
  ] = useState(false);

  const [showLivePage, setShowLivePage] =
    useState(false);

  const [
    liveStatus,
    setLiveStatus,
  ] = useState<LiveTrainStatus | null>(
    null,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    showFromSuggestions,
    setShowFromSuggestions,
  ] = useState(false);

  const [
    showToSuggestions,
    setShowToSuggestions,
  ] = useState(false);

  /* -----------------------------------------------------
     FROM STATION SEARCH
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      const query =
        fromQuery.trim();

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

        setShowFromSuggestions(
          true,
        );
      } catch (error) {
        if (!cancelled) {
          setFromSuggestions([]);
        }

        console.log(
          "FROM STATION SEARCH ERROR:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingFromStations(
            false,
          );
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

  /* -----------------------------------------------------
     TO STATION SEARCH
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      const query =
        toQuery.trim();

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

        setShowToSuggestions(
          true,
        );
      } catch (error) {
        if (!cancelled) {
          setToSuggestions([]);
        }

        console.log(
          "TO STATION SEARCH ERROR:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingToStations(
            false,
          );
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

  /* -----------------------------------------------------
     SELECT STATIONS
  ----------------------------------------------------- */

  function selectFromStation(
    station: RailwayStation,
  ) {
    setFromStation(station);

    setFromQuery(
      `${station.name} (${station.code})`,
    );

    setFromSuggestions([]);

    setShowFromSuggestions(
      false,
    );

    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
    setLiveStatus(null);
    setErrorMessage("");
  }

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
    setLiveStatus(null);
    setErrorMessage("");
  }

  function swapStations() {
    const oldFrom =
      fromStation;

    const oldFromQuery =
      fromQuery;

    setFromStation(toStation);
    setToStation(oldFrom);

    setFromQuery(toQuery);
    setToQuery(oldFromQuery);

    setFromSuggestions([]);
    setToSuggestions([]);

    setShowFromSuggestions(false);
    setShowToSuggestions(false);

    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
    setLiveStatus(null);
    setErrorMessage("");
  }

  /* -----------------------------------------------------
     DATE
  ----------------------------------------------------- */

  function selectDate(
    value: string,
  ) {
    setDate(value);
    setSearched(false);
    setAvailableTrains([]);
    setSelectedTrain(null);
    setLiveStatus(null);
    setErrorMessage("");
  }

  /* -----------------------------------------------------
     REAL TRAIN SEARCH
  ----------------------------------------------------- */

  async function handleSearchTrains() {
    setErrorMessage("");
    setSelectedTrain(null);
    setLiveStatus(null);
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
      fromStation.code.toUpperCase() ===
      toStation.code.toUpperCase()
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
          date,
          token,
        );

      const rawTrains =
        Array.isArray(
          result?.trains,
        )
          ? result.trains
          : [];

      const trains =
        rawTrains
          .map(normalizeTrain)
          .filter(
            (train) =>
              train.train.number &&
              train.train.name,
          );

      setAvailableTrains(
        trains,
      );

      setSearched(true);

      if (trains.length === 0) {
        setErrorMessage(
          "No trains were returned for this route and date.",
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
          "Unable to load trains. Please try again.",
      );
    } finally {
      setLoadingTrains(false);
    }
  }

  /* -----------------------------------------------------
     LIVE TRAIN STATUS
  ----------------------------------------------------- */

  async function handleLiveStatus(
    train: RailwayTrain,
  ) {
    const number = String(
      train.train.number || "",
    ).trim();

    if (!number) {
      Alert.alert(
        "Live status",
        "Train number is unavailable.",
      );
      return;
    }

    // Open the dedicated live-status page immediately.
    setSelectedTrain(train);
    setLiveStatus(null);
    setLoadingLive(true);
    setShowLivePage(true);

    try {
      if (!token) {
        throw new Error(
          "Your login session has expired. Please login again.",
        );
      }

      const result =
        await getLiveTrainStatus(
          number,
          date,
          token,
        );

      setLiveStatus(result);
    } catch (error: any) {
      console.log(
        "LIVE TRAIN STATUS ERROR:",
        error,
      );

      Alert.alert(
        "Live status unavailable",
        error?.message ||
          "Live train status is currently unavailable.",
      );
    } finally {
      setLoadingLive(false);
    }
  }

  /* -----------------------------------------------------
     BOOKING
  ----------------------------------------------------- */

  function handleSelectTrain(
    train: RailwayTrain,
  ) {
    setSelectedTrain(train);

    Alert.alert(
      train.train.name ||
        "Train selected",
      `${train.train.number}\n${train.from?.departure || "--"} → ${train.to?.arrival || "--"}\n\nActual railway ticket booking/payment requires an authorized booking integration.`,
    );
  }

  /* -----------------------------------------------------
     HELPERS
  ----------------------------------------------------- */

  const resultText =
    useMemo(() => {
      if (!searched) {
        return "";
      }

      if (
        availableTrains.length === 0
      ) {
        return "No trains found";
      }

      return `${availableTrains.length} train${
        availableTrains.length === 1
          ? ""
          : "s"
      } found`;
    }, [
      searched,
      availableTrains.length,
    ]);

  function renderLiveSummary() {
    if (!liveStatus) {
      return null;
    }

    return (
      <View
        style={styles.livePanel}
      >
        <View
          style={
            styles.liveHeader
          }
        >
          <Text
            style={
              styles.liveTitle
            }
          >
            Live Running Status
          </Text>

          <Pressable
            onPress={() => {
              setLiveStatus(null);
            }}
          >
            <Text
              style={
                styles.closeLiveText
              }
            >
              Close
            </Text>
          </Pressable>
        </View>

        <Text
          style={styles.liveTrainName}
        >
          {liveStatus.trainName ||
            selectedTrain?.train.name ||
            "Train"}
        </Text>

        <Text
          style={styles.liveNumber}
        >
          {liveStatus.trainNumber ||
            selectedTrain?.train.number ||
            ""}
        </Text>

        {liveStatus.status ? (
          <Text
            style={styles.liveRow}
          >
            Status:{" "}
            {liveStatus.status}
          </Text>
        ) : null}

        {liveStatus.delayMinutes !==
        undefined ? (
          <Text
            style={styles.liveRow}
          >
            Delay:{" "}
            {liveStatus.delayMinutes}{" "}
            min
          </Text>
        ) : null}

        {liveStatus.currentLocation
          ?.stationCode ? (
          <Text
            style={styles.liveRow}
          >
            Current:{" "}
            {
              liveStatus
                .currentLocation
                .stationCode
            }
          </Text>
        ) : null}

        {liveStatus.nextHalt
          ?.stationName ? (
          <Text
            style={styles.liveRow}
          >
            Next:{" "}
            {
              liveStatus.nextHalt
                .stationName
            }
          </Text>
        ) : null}

        {liveStatus.nextHalt
          ?.distance !==
        undefined ? (
          <Text
            style={styles.liveRow}
          >
            Distance:{" "}
            {
              liveStatus.nextHalt
                .distance
            }{" "}
            km
          </Text>
        ) : null}

        {liveStatus.currentLocation
          ?.speedKmh !==
        undefined ? (
          <Text
            style={styles.liveRow}
          >
            Speed:{" "}
            {
              liveStatus
                .currentLocation
                .speedKmh
            }{" "}
            km/h
          </Text>
        ) : null}

        {liveStatus.currentLocation
          ?.isHalt ? (
          <Text
            style={styles.haltText}
          >
            Currently halted at a
            station
          </Text>
        ) : null}
      </View>
    );
  }

  if (showLivePage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                setShowLivePage(false);
                setLiveStatus(null);
                setLoadingLive(false);
              }}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to train search"
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <View>
              <Text style={styles.headerTitle}>
                Live Running Status
              </Text>
              <Text style={styles.headerSubtitle}>
                Real-time train information
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.livePageContent}
          >
            <View style={styles.livePageCard}>
              <Text style={styles.livePageLabel}>
                LIVE TRAIN STATUS
              </Text>

              <Text style={styles.livePageTrainName}>
                {selectedTrain?.train.name || "Train"}
              </Text>

              <Text style={styles.livePageNumber}>
                Train No. {selectedTrain?.train.number || "--"}
              </Text>

              <View style={styles.livePageRoute}>
                <View>
                  <Text style={styles.livePageTime}>
                    {selectedTrain?.from?.departure || "--"}
                  </Text>
                  <Text style={styles.livePageStation}>
                    {selectedTrain?.from?.stationCode || "FROM"}
                  </Text>
                </View>

                <View style={styles.livePageLine}>
                  <View style={styles.livePageDot} />
                  <View style={styles.livePageRouteLine} />
                  <View style={styles.livePageDot} />
                </View>

                <View style={styles.livePageArrival}>
                  <Text style={styles.livePageTime}>
                    {selectedTrain?.to?.arrival || "--"}
                  </Text>
                  <Text style={styles.livePageStation}>
                    {selectedTrain?.to?.stationCode || "TO"}
                  </Text>
                </View>
              </View>
            </View>

            {loadingLive ? (
              <View style={styles.liveLoadingCard}>
                <ActivityIndicator size="large" />
                <Text style={styles.liveLoadingTitle}>
                  Getting live running status...
                </Text>
                <Text style={styles.liveLoadingText}>
                  Please wait while we fetch the latest train position.
                </Text>
              </View>
            ) : liveStatus ? (
              <View style={styles.liveResultCard}>
                <View style={styles.liveResultHeader}>
                  <Text style={styles.liveResultTitle}>
                    Current Running Status
                  </Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>

                <Text style={styles.livePageTrainName}>
                  {liveStatus.trainName || selectedTrain?.train.name || "Train"}
                </Text>

                <Text style={styles.liveResultRow}>
                  Status: {liveStatus.status || "Not available"}
                </Text>

                {liveStatus.delayMinutes !== undefined ? (
                  <Text style={styles.liveResultRow}>
                    Delay: {liveStatus.delayMinutes} min
                  </Text>
                ) : null}

                {liveStatus.currentLocation?.stationCode ? (
                  <Text style={styles.liveResultRow}>
                    Current: {liveStatus.currentLocation.stationCode}
                  </Text>
                ) : null}

                {liveStatus.nextHalt?.stationName ? (
                  <Text style={styles.liveResultRow}>
                    Next: {liveStatus.nextHalt.stationName}
                  </Text>
                ) : null}

                {liveStatus.distanceKm !== undefined ? (
                  <Text style={styles.liveResultRow}>
                    Distance: {liveStatus.distanceKm} km
                  </Text>
                ) : null}

                {liveStatus.haltedAtStation ? (
                  <Text style={styles.haltText}>
                    Currently halt at a station
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.liveLoadingCard}>
                <Text style={styles.liveLoadingTitle}>
                  Live status unavailable
                </Text>
                <Text style={styles.liveLoadingText}>
                  We could not load the current running status.
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => {
                setShowLivePage(false);
                setLiveStatus(null);
                setLoadingLive(false);
              }}
              style={({ pressed }) => [
                styles.liveBackButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.liveBackButtonText}>
                ‹ Back to Train Search
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        {/* HEADER */}

        <View
          style={styles.header}
        >
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
              Train Booking
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Search real trains
            </Text>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* SEARCH CARD */}

          <View
            style={styles.searchCard}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Where are you travelling?
            </Text>

            {/* FROM */}

            <Text
              style={styles.label}
            >
              From station
            </Text>

            <View
              style={styles.inputRow}
            >
              <Text
                style={styles.inputIcon}
              >
                🚉
              </Text>

              <TextInput
                value={fromQuery}
                onChangeText={(value) => {
                  setFromQuery(value);
                  setFromStation(null);
                  setSearched(false);
                  setAvailableTrains(
                    [],
                  );
                  setErrorMessage("");
                }}
                placeholder="Search departure station"
                placeholderTextColor="#999"
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="words"
                onFocus={() => {
                  if (
                    fromSuggestions.length
                  ) {
                    setShowFromSuggestions(
                      true,
                    );
                  }
                }}
              />

              {loadingFromStations ? (
                <ActivityIndicator
                  size="small"
                />
              ) : null}
            </View>

            {showFromSuggestions &&
            fromSuggestions.length >
              0 ? (
              <View
                style={
                  styles.suggestionBox
                }
              >
                {fromSuggestions.map(
                  (station) => (
                    <Pressable
                      key={`${station.code}-${station.name}`}
                      onPress={() =>
                        selectFromStation(
                          station,
                        )
                      }
                      style={
                        styles.suggestion
                      }
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
                          styles.suggestionCode
                        }
                      >
                        {station.code}
                        {station.city
                          ? ` • ${station.city}`
                          : ""}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            ) : null}

            {/* SWAP */}

            <Pressable
              onPress={swapStations}
              style={styles.swapButton}
            >
              <Text
                style={styles.swapText}
              >
                ⇅
              </Text>
            </Pressable>

            {/* TO */}

            <Text
              style={styles.label}
            >
              To station
            </Text>

            <View
              style={styles.inputRow}
            >
              <Text
                style={styles.inputIcon}
              >
                🎯
              </Text>

              <TextInput
                value={toQuery}
                onChangeText={(value) => {
                  setToQuery(value);
                  setToStation(null);
                  setSearched(false);
                  setAvailableTrains(
                    [],
                  );
                  setErrorMessage("");
                }}
                placeholder="Search destination station"
                placeholderTextColor="#999"
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="words"
                onFocus={() => {
                  if (
                    toSuggestions.length
                  ) {
                    setShowToSuggestions(
                      true,
                    );
                  }
                }}
              />

              {loadingToStations ? (
                <ActivityIndicator
                  size="small"
                />
              ) : null}
            </View>

            {showToSuggestions &&
            toSuggestions.length >
              0 ? (
              <View
                style={
                  styles.suggestionBox
                }
              >
                {toSuggestions.map(
                  (station) => (
                    <Pressable
                      key={`${station.code}-${station.name}`}
                      onPress={() =>
                        selectToStation(
                          station,
                        )
                      }
                      style={
                        styles.suggestion
                      }
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
                          styles.suggestionCode
                        }
                      >
                        {station.code}
                        {station.city
                          ? ` • ${station.city}`
                          : ""}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            ) : null}

            {/* DATE */}

            <Text
              style={styles.label}
            >
              Journey date
            </Text>

            <Pressable
              onPress={() =>
                setCalendarVisible(
                  true,
                )
              }
              style={styles.dateButton}
            >
              <Text
                style={styles.dateIcon}
              >
                📅
              </Text>

              <Text
                style={[
                  styles.dateText,
                  !date &&
                    styles.placeholderText,
                ]}
              >
                {date
                  ? formatDisplayDate(
                      date,
                    )
                  : "Select journey date"}
              </Text>
            </Pressable>

            {/* ERROR */}

            {errorMessage ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* SEARCH */}

            <Pressable
              onPress={handleSearchTrains}
              disabled={loadingTrains}
              style={[
                styles.searchButton,
                loadingTrains &&
                  styles.disabledButton,
              ]}
            >
              {loadingTrains ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.searchButtonText
                  }
                >
                  Search Trains
                </Text>
              )}
            </Pressable>
          </View>

          {/* RESULTS */}

          {searched ? (
            <View
              style={
                styles.resultsSection
              }
            >
              <View
                style={
                  styles.resultsHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.resultsTitle
                    }
                  >
                    Available Trains
                  </Text>

                  <Text
                    style={
                      styles.routeText
                    }
                  >
                    {fromStation?.code} →
                    {" "}
                    {toStation?.code}
                  </Text>
                </View>

                <Text
                  style={
                    styles.countText
                  }
                >
                  {resultText}
                </Text>
              </View>

              {loadingTrains ? (
                <View
                  style={
                    styles.centerBox
                  }
                >
                  <ActivityIndicator />
                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Finding trains...
                  </Text>
                </View>
              ) : null}

              {!loadingTrains &&
              availableTrains.length ===
                0 ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <Text
                    style={
                      styles.emptyIcon
                    }
                  >
                    🚆
                  </Text>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No trains found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No train services were
                    returned for this route
                    and journey date.
                  </Text>
                </View>
              ) : null}

              {availableTrains.map(
                (train, index) => {
                  const number =
                    train.train.number;

                  const name =
                    train.train.name;

                  const delay =
                    train.live
                      ?.delayMinutes ??
                    0;

                  const platform =
                    train.live
                      ?.platform;

                  return (
                    <View
                      key={`${number}-${index}`}
                      style={[
                        styles.trainCard,
                        selectedTrain
                          ?.train
                          .number ===
                          number &&
                          styles.selectedTrainCard,
                      ]}
                    >
                      <View
                        style={
                          styles.trainTop
                        }
                      >
                        <View
                          style={
                            styles.trainIdentity
                          }
                        >
                          <Text
                            style={
                              styles.trainName
                            }
                          >
                            {name}
                          </Text>

                          <Text
                            style={
                              styles.trainNumber
                            }
                          >
                            {number}
                          </Text>
                        </View>

                        {train.train
                          .category ? (
                          <View
                            style={
                              styles.categoryBadge
                            }
                          >
                            <Text
                              style={
                                styles.categoryText
                              }
                            >
                              {
                                train
                                  .train
                                  .category
                              }
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.timeRow
                        }
                      >
                        <View
                          style={
                            styles.timeBlock
                          }
                        >
                          <Text
                            style={
                              styles.timeText
                            }
                          >
                            {train.from
                              ?.departure ||
                              "--"}
                          </Text>

                          <Text
                            style={
                              styles.stationSmall
                            }
                          >
                            {fromStation?.code ||
                              "FROM"}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.durationBlock
                          }
                        >
                          <Text
                            style={
                              styles.durationText
                            }
                          >
                            {formatDuration(
                              train.duration,
                            )}
                          </Text>

                          <View
                            style={
                              styles.line
                            }
                          />

                          <Text
                            style={
                              styles.distanceText
                            }
                          >
                            {train.distance
                              ? `${Math.round(
                                  train.distance,
                                )} km`
                              : ""}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.timeBlock,
                            styles.arrivalBlock,
                          ]}
                        >
                          <Text
                            style={
                              styles.timeText
                            }
                          >
                            {train.to
                              ?.arrival ||
                              "--"}
                          </Text>

                          <Text
                            style={
                              styles.stationSmall
                            }
                          >
                            {toStation?.code ||
                              "TO"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <Text
                          style={
                            styles.infoText
                          }
                        >
                          {train.train
                            .type ||
                            "Express"}
                        </Text>

                        {train
                          .totalHaltsBetween !==
                        undefined ? (
                          <Text
                            style={
                              styles.infoText
                            }
                          >
                            {
                              train
                                .totalHaltsBetween
                            }{" "}
                            stops
                          </Text>
                        ) : null}

                        {delay > 0 ? (
                          <Text
                            style={
                              styles.delayText
                            }
                          >
                            {delay} min delay
                          </Text>
                        ) : (
                          <Text
                            style={
                              styles.onTimeText
                            }
                          >
                            Live / On time
                          </Text>
                        )}

                        {platform ? (
                          <Text
                            style={
                              styles.infoText
                            }
                          >
                            PF {platform}
                          </Text>
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.actionRow
                        }
                      >
                        <Pressable
                          onPress={() =>
                            handleLiveStatus(
                              train,
                            )
                          }
                          style={
                            styles.liveButton
                          }
                        >
                          {loadingLive &&
                          selectedTrain
                            ?.train
                            .number ===
                            number ? (
                            <ActivityIndicator
                              size="small"
                            />
                          ) : (
                            <Text
                              style={
                                styles.liveButtonText
                              }
                            >
                              Live Status
                            </Text>
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            handleSelectTrain(
                              train,
                            )
                          }
                          style={
                            styles.selectButton
                          }
                        >
                          <Text
                            style={
                              styles.selectButtonText
                            }
                          >
                            Select Train
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                },
              )}

            </View>
          ) : null}

          {/* BOOKING NOTE */}

          {selectedTrain ? (
            <View
              style={
                styles.bookingInfo
              }
            >
              <Text
                style={
                  styles.bookingInfoTitle
                }
              >
                Selected Train
              </Text>

              <Text
                style={
                  styles.bookingInfoTrain
                }
              >
                {
                  selectedTrain.train
                    .name
                }
              </Text>

              <Text
                style={
                  styles.bookingInfoNumber
                }
              >
                {
                  selectedTrain.train
                    .number
                }
              </Text>

              <Text
                style={
                  styles.bookingInfoText
                }
              >
                Actual ticket availability,
                fare, payment and railway
                ticket issuance must be
                connected to an authorized
                railway booking provider.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <TrainCalendar
          visible={calendarVisible}
          selectedDate={date}
          onClose={() =>
            setCalendarVisible(
              false,
            )
          }
          onSelect={selectDate}
        />
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------
   STYLES
------------------------------------------------------- */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F5F7FA",
    },

    container: {
      flex: 1,
      backgroundColor: "#F5F7FA",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E7E9ED",
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    backText: {
      fontSize: 36,
      lineHeight: 38,
      color: "#111827",
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#111827",
    },

    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: "#6B7280",
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },

    searchCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: "#E8EBEF",
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 18,
    },

    label: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 7,
    },

    inputRow: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#D9DDE3",
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: "#FFFFFF",
    },

    inputIcon: {
      fontSize: 20,
      marginRight: 9,
    },

    input: {
      flex: 1,
      minHeight: 52,
      fontSize: 15,
      color: "#111827",
    },

    suggestionBox: {
      marginTop: 5,
      borderWidth: 1,
      borderColor: "#E2E5EA",
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
    },

    suggestion: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F1F3",
    },

    suggestionName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#111827",
    },

    suggestionCode: {
      marginTop: 3,
      fontSize: 12,
      color: "#6B7280",
    },

    swapButton: {
      alignSelf: "center",
      width: 40,
      height: 40,
      borderRadius: 20,
      marginVertical: -1,
      backgroundColor: "#111827",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    swapText: {
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "700",
    },

    dateButton: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#D9DDE3",
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: "#FFFFFF",
    },

    dateIcon: {
      fontSize: 20,
      marginRight: 10,
    },

    dateText: {
      fontSize: 15,
      color: "#111827",
    },

    placeholderText: {
      color: "#999999",
    },

    errorBox: {
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#FECACA",
    },

    errorText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#B91C1C",
    },

    searchButton: {
      marginTop: 16,
      minHeight: 54,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#111827",
    },

    disabledButton: {
      opacity: 0.65,
    },

    searchButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },

    resultsSection: {
      marginTop: 20,
    },

    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 12,
    },

    resultsTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#111827",
    },

    routeText: {
      marginTop: 3,
      fontSize: 12,
      color: "#6B7280",
    },

    countText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#374151",
    },

    centerBox: {
      paddingVertical: 30,
      alignItems: "center",
    },

    loadingText: {
      marginTop: 10,
      color: "#6B7280",
    },

    emptyCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 26,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E8EBEF",
    },

    emptyIcon: {
      fontSize: 42,
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#111827",
    },

    emptyText: {
      marginTop: 6,
      textAlign: "center",
      lineHeight: 19,
      fontSize: 13,
      color: "#6B7280",
    },

    trainCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 17,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E4E7EB",
    },

    selectedTrainCard: {
      borderWidth: 2,
      borderColor: "#111827",
    },

    trainTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    trainIdentity: {
      flex: 1,
      paddingRight: 10,
    },

    trainName: {
      fontSize: 16,
      fontWeight: "800",
      color: "#111827",
    },

    trainNumber: {
      marginTop: 3,
      fontSize: 12,
      color: "#6B7280",
      fontWeight: "600",
    },

    categoryBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: "#F1F3F5",
    },

    categoryText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#374151",
    },

    timeRow: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
    },

    timeBlock: {
      width: 82,
    },

    arrivalBlock: {
      alignItems: "flex-end",
    },

    timeText: {
      fontSize: 20,
      fontWeight: "800",
      color: "#111827",
    },

    stationSmall: {
      marginTop: 3,
      fontSize: 11,
      color: "#6B7280",
      fontWeight: "700",
    },

    durationBlock: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 8,
    },

    durationText: {
      fontSize: 11,
      color: "#6B7280",
      fontWeight: "700",
    },

    line: {
      width: "80%",
      height: 1,
      marginVertical: 5,
      backgroundColor: "#C9CDD3",
    },

    distanceText: {
      fontSize: 10,
      color: "#9CA3AF",
    },

    infoRow: {
      marginTop: 15,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    infoText: {
      fontSize: 11,
      color: "#4B5563",
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
    },

    delayText: {
      fontSize: 11,
      color: "#B45309",
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      fontWeight: "700",
    },

    onTimeText: {
      fontSize: 11,
      color: "#166534",
      backgroundColor: "#DCFCE7",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      fontWeight: "700",
    },

    actionRow: {
      marginTop: 15,
      flexDirection: "row",
      gap: 9,
    },

    liveButton: {
      flex: 1,
      minHeight: 45,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#111827",
      alignItems: "center",
      justifyContent: "center",
    },

    liveButtonText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#111827",
    },

    selectButton: {
      flex: 1,
      minHeight: 45,
      borderRadius: 10,
      backgroundColor: "#111827",
      alignItems: "center",
      justifyContent: "center",
    },

    selectButtonText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    livePanel: {
      marginTop: 15,
      backgroundColor: "#F8FAFC",
      borderRadius: 14,
      padding: 15,
      borderWidth: 1,
      borderColor: "#DDE2E8",
    },

    liveHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    liveTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#111827",
    },

    closeLiveText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6B7280",
    },

    liveTrainName: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "800",
      color: "#111827",
    },

    liveNumber: {
      marginTop: 2,
      fontSize: 12,
      color: "#6B7280",
    },

    liveRow: {
      marginTop: 8,
      fontSize: 13,
      color: "#374151",
    },

    haltText: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: "700",
      color: "#166534",
    },

    bookingInfo: {
      marginTop: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "#E4E7EB",
    },

    bookingInfoTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6B7280",
    },

    bookingInfoTrain: {
      marginTop: 5,
      fontSize: 17,
      fontWeight: "800",
      color: "#111827",
    },

    bookingInfoNumber: {
      marginTop: 2,
      fontSize: 12,
      color: "#6B7280",
    },

    bookingInfoText: {
      marginTop: 12,
      fontSize: 12,
      lineHeight: 18,
      color: "#6B7280",
    },

    livePageContent: {
      padding: 20,
      paddingBottom: 40,
    },

    livePageCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: "#E4E7EB",
    },

    livePageLabel: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1,
      color: "#166534",
    },

    livePageTrainName: {
      marginTop: 8,
      fontSize: 22,
      fontWeight: "900",
      color: "#111827",
    },

    livePageNumber: {
      marginTop: 4,
      fontSize: 13,
      color: "#6B7280",
    },

    livePageRoute: {
      marginTop: 25,
      flexDirection: "row",
      alignItems: "center",
    },

    livePageTime: {
      fontSize: 20,
      fontWeight: "900",
      color: "#111827",
    },

    livePageStation: {
      marginTop: 3,
      fontSize: 11,
      fontWeight: "800",
      color: "#6B7280",
    },

    livePageArrival: {
      alignItems: "flex-end",
    },

    livePageLine: {
      flex: 1,
      marginHorizontal: 14,
      alignItems: "center",
    },

    livePageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#111827",
    },

    livePageRouteLine: {
      width: "100%",
      height: 1,
      marginVertical: 4,
      backgroundColor: "#C9CDD3",
    },

    liveLoadingCard: {
      marginTop: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E4E7EB",
    },

    liveLoadingTitle: {
      marginTop: 14,
      fontSize: 16,
      fontWeight: "900",
      color: "#111827",
      textAlign: "center",
    },

    liveLoadingText: {
      marginTop: 7,
      fontSize: 12,
      lineHeight: 18,
      color: "#6B7280",
      textAlign: "center",
    },

    liveResultCard: {
      marginTop: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: "#E4E7EB",
    },

    liveResultHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    liveResultTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: "#111827",
    },

    liveBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: "#DCFCE7",
    },

    liveBadgeText: {
      fontSize: 10,
      fontWeight: "900",
      color: "#166534",
    },

    liveResultRow: {
      marginTop: 10,
      fontSize: 13,
      color: "#374151",
    },

    liveBackButton: {
      marginTop: 18,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: "#111827",
      alignItems: "center",
      justifyContent: "center",
    },

    liveBackButtonText: {
      fontSize: 14,
      fontWeight: "900",
      color: "#FFFFFF",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: 20,
    },

    calendarCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
    },

    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    calendarTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#111827",
    },

    monthButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F3F4F6",
    },

    monthButtonText: {
      fontSize: 25,
      color: "#111827",
    },

    weekRow: {
      flexDirection: "row",
      marginTop: 18,
      marginBottom: 5,
    },

    weekText: {
      width: "14.285%",
      textAlign: "center",
      fontSize: 11,
      fontWeight: "700",
      color: "#6B7280",
    },

    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    dayCell: {
      width: "14.285%",
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
    },

    dayText: {
       fontSize: 13,
       fontWeight: "600",
       color: "#111827",
    },

      selectedDayText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

      disabledDayText: {
        color: "#B8BDC7",
    },

    selectedDay: {
      backgroundColor: "#111827",
    },

    disabledDay: {
      opacity: 0.35,
    },

    calendarCancel: {
      marginTop: 12,
      minHeight: 45,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: "#F3F4F6",
    },

    calendarCancelText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#374151",
    },
  });