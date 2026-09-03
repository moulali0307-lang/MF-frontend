import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  fetchMovies,
  fetchMovieShows,
  fetchMovieSeats,
  holdMovieSeats,
  type Movie,
  type Theatre,
  type MovieShow,
  type MovieSeat,
} from "../api/movies";

import { useAuth } from "../context/AuthContext";

/* ============================================================
   PROPS
============================================================ */

interface Props {
  onBack: () => void;
}

/* ============================================================
   HELPERS
============================================================ */

function getTodayDate(): string {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      now.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  date: Date,
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateLabel(
  date: Date,
): string {
  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    },
  );
}

function formatTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  );
}

/* ============================================================
   SCREEN
============================================================ */

function MovieBookingScreen({
  onBack,
}: Props) {
  const { token } =
    useAuth();

  /* ----------------------------------------------------------
     SEARCH
  ---------------------------------------------------------- */

  const [city, setCity] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(
      getTodayDate(),
    );

  /* ----------------------------------------------------------
     DATA
  ---------------------------------------------------------- */

  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [shows, setShows] =
    useState<MovieShow[]>([]);

  const [seats, setSeats] =
    useState<MovieSeat[]>([]);

  /* ----------------------------------------------------------
     SELECTION
  ---------------------------------------------------------- */

  const [selectedMovie, setSelectedMovie] =
    useState<Movie | null>(null);

  const [selectedTheatre, setSelectedTheatre] =
    useState<Theatre | null>(null);

  const [selectedShow, setSelectedShow] =
    useState<MovieShow | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  const [loadingMovies, setLoadingMovies] =
    useState(false);

  const [loadingShows, setLoadingShows] =
    useState(false);

  const [loadingSeats, setLoadingSeats] =
    useState(false);

  const [holdingSeats, setHoldingSeats] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ----------------------------------------------------------
     DATE OPTIONS
  ---------------------------------------------------------- */

  const dateOptions =
    useMemo(() => {
      const result: {
        value: string;
        label: string;
      }[] = [];

      for (
        let i = 0;
        i < 7;
        i++
      ) {
        const date =
          new Date();

        date.setDate(
          date.getDate() + i,
        );

        result.push({
          value:
            formatDate(date),
          label:
            getDateLabel(date),
        });
      }

      return result;
    }, []);

  /* ==========================================================
     LOAD MOVIES
  ========================================================== */

  const loadMovies =
    async () => {
      const trimmedCity =
        city.trim();

      if (!trimmedCity) {
        setMovies([]);
        setShows([]);
        setSeats([]);
        setSelectedMovie(null);
        setSelectedTheatre(null);
        setSelectedShow(null);
        setSelectedSeats([]);
        setErrorMessage(
          "Please enter a city.",
        );
        return;
      }

      if (!token) {
        setErrorMessage(
          "Please login again.",
        );
        return;
      }

      try {
        setLoadingMovies(true);
        setErrorMessage("");

        setSelectedMovie(null);
        setSelectedTheatre(null);
        setSelectedShow(null);
        setSelectedSeats([]);

        setShows([]);
        setSeats([]);

        const result =
          await fetchMovies(
            trimmedCity,
            selectedDate,
            token,
          );

        /*
         * IMPORTANT:
         * This was missing in the old code.
         */
        setMovies(
          Array.isArray(result)
            ? result
            : [],
        );

        if (
          !result ||
          result.length === 0
        ) {
          setErrorMessage(
            `No movies found in ${trimmedCity}.`,
          );
        }
      } catch (error) {
        console.error(
          "Movie loading error:",
          error,
        );

        setMovies([]);
        setErrorMessage(
          "Unable to load movies. Please try again.",
        );
      } finally {
        setLoadingMovies(false);
      }
    };

  /* ==========================================================
     DATE CHANGE
  ========================================================== */

  useEffect(() => {
    if (
      city.trim() &&
      token
    ) {
      loadMovies();
    }
  }, [
    selectedDate,
  ]);

  /* ==========================================================
     SELECT MOVIE
  ========================================================== */

  const selectMovie =
    async (
      movie: Movie,
    ) => {
      if (!token) {
        Alert.alert(
          "Login required",
          "Please login again.",
        );
        return;
      }

      try {
        setSelectedMovie(movie);
        setSelectedTheatre(null);
        setSelectedShow(null);
        setSelectedSeats([]);

        setShows([]);
        setSeats([]);

        setLoadingShows(true);
        setErrorMessage("");

        /*
         * Backend returns theatre information
         * with every MovieShow.
         */
        const result =
          await fetchMovieShows(
            movie.id,
            city.trim(),
            selectedDate,
            token,
          );

        setShows(
          Array.isArray(result)
            ? result
            : [],
        );

        if (
          !result ||
          result.length === 0
        ) {
          setErrorMessage(
            "No shows available for this movie.",
          );
        }
      } catch (error) {
        console.error(
          "Movie shows error:",
          error,
        );

        setShows([]);
        setErrorMessage(
          "Unable to load theatres and show timings.",
        );
      } finally {
        setLoadingShows(false);
      }
    };

  /* ==========================================================
     THEATRES FROM SHOWS
  ========================================================== */

  const theatres =
    useMemo(() => {
      const map =
        new Map<
          string,
          Theatre
        >();

      for (const show of shows) {
        if (
          show.theatre &&
          !map.has(
            show.theatre.id,
          )
        ) {
          map.set(
            show.theatre.id,
            show.theatre,
          );
        }
      }

      return Array.from(
        map.values(),
      );
    }, [shows]);

  /* ==========================================================
     SHOWS FOR SELECTED THEATRE
  ========================================================== */

  const theatreShows =
    useMemo(() => {
      if (
        !selectedTheatre
      ) {
        return [];
      }

      return shows.filter(
        (show) =>
          show.theatre.id ===
          selectedTheatre.id,
      );
    }, [
      shows,
      selectedTheatre,
    ]);

  /* ==========================================================
     SELECT THEATRE
  ========================================================== */

  const selectTheatre =
    (theatre: Theatre) => {
      setSelectedTheatre(
        theatre,
      );

      setSelectedShow(null);
      setSelectedSeats([]);
      setSeats([]);
    };

  /* ==========================================================
     SELECT SHOW
  ========================================================== */

  const selectShow =
    async (
      show: MovieShow,
    ) => {
      if (!token) {
        Alert.alert(
          "Login required",
          "Please login again.",
        );
        return;
      }

      try {
        setSelectedShow(show);
        setSelectedSeats([]);
        setSeats([]);

        setLoadingSeats(true);
        setErrorMessage("");

        const seatMap =
          await fetchMovieSeats(
            show.id,
            token,
          );

        if (!seatMap) {
          setSeats([]);
          setErrorMessage(
            "Seat map is unavailable.",
          );
          return;
        }

        setSeats(
          Array.isArray(
            seatMap.seats,
          )
            ? seatMap.seats
            : [],
        );
      } catch (error) {
        console.error(
          "Seat loading error:",
          error,
        );

        setSeats([]);
        setErrorMessage(
          "Unable to load live seat availability.",
        );
      } finally {
        setLoadingSeats(false);
      }
    };

  /* ==========================================================
     REFRESH SEATS
  ========================================================== */

  const refreshSeats =
    async () => {
      if (
        !token ||
        !selectedShow
      ) {
        return;
      }

      try {
        setLoadingSeats(true);

        const seatMap =
          await fetchMovieSeats(
            selectedShow.id,
            token,
          );

        const latestSeats =
          seatMap?.seats ?? [];

        setSeats(
          latestSeats,
        );

        setSelectedSeats(
          (current) =>
            current.filter(
              (id) =>
                latestSeats.some(
                  (seat) =>
                    seat.id === id &&
                    seat.status ===
                      "AVAILABLE",
                ),
            ),
        );
      } catch (error) {
        console.error(
          "Seat refresh error:",
          error,
        );
      } finally {
        setLoadingSeats(false);
      }
    };

  /* ==========================================================
     TOGGLE SEAT
  ========================================================== */

  const toggleSeat =
    (seat: MovieSeat) => {
      if (
        seat.status !==
        "AVAILABLE"
      ) {
        return;
      }

      setSelectedSeats(
        (current) => {
          if (
            current.includes(
              seat.id,
            )
          ) {
            return current.filter(
              (id) =>
                id !== seat.id,
            );
          }

          if (
            current.length >= 8
          ) {
            Alert.alert(
              "Seat limit",
              "You can select up to 8 seats.",
            );

            return current;
          }

          return [
            ...current,
            seat.id,
          ];
        },
      );
    };

  /* ==========================================================
     SEAT ROWS
  ========================================================== */

  const seatRows =
    useMemo(() => {
      const grouped: Record<
        string,
        MovieSeat[]
      > = {};

      for (const seat of seats) {
        if (
          !grouped[seat.row]
        ) {
          grouped[seat.row] =
            [];
        }

        grouped[
          seat.row
        ].push(seat);
      }

      return Object.entries(
        grouped,
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b),
      );
    }, [seats]);

  /* ==========================================================
     TOTAL
  ========================================================== */

  const selectedSeatObjects =
    seats.filter((seat) =>
      selectedSeats.includes(
        seat.id,
      ),
    );

  const totalAmount =
    selectedSeatObjects.reduce(
      (
        total,
        seat,
      ) =>
        total +
        Number(
          seat.price || 0,
        ),
      0,
    );

  /* ==========================================================
     HOLD SEATS
  ========================================================== */

  const handleContinue =
    async () => {
      if (
        !selectedMovie ||
        !selectedTheatre ||
        !selectedShow
      ) {
        Alert.alert(
          "Incomplete selection",
          "Please select movie, theatre and show.",
        );
        return;
      }

      if (
        selectedSeats.length ===
        0
      ) {
        Alert.alert(
          "Select seats",
          "Please select at least one available seat.",
        );
        return;
      }

      if (!token) {
        Alert.alert(
          "Login required",
          "Please login again.",
        );
        return;
      }

      try {
        setHoldingSeats(true);

        const hold =
          await holdMovieSeats(
            selectedShow.id,
            selectedSeats,
            token,
          );

        Alert.alert(
          "Seats held successfully",
          [
            `Movie: ${selectedMovie.title}`,
            `Theatre: ${selectedTheatre.name}`,
            `Show: ${formatTime(
              selectedShow.startTime,
            )}`,
            `Seats: ${selectedSeatObjects
              .map(
                (seat) =>
                  seat.label,
              )
              .join(", ")}`,
            `Total: ₹${totalAmount}`,
            "",
            `Hold expires: ${new Date(
              hold.expiresAt,
            ).toLocaleTimeString(
              "en-IN",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              },
            )}`,
          ].join("\n"),
        );

        await refreshSeats();
      } catch (error) {
        console.error(
          "Seat hold error:",
          error,
        );

        await refreshSeats();

        const message =
          error instanceof Error
            ? error.message
            : "One or more selected seats are no longer available.";

        Alert.alert(
          "Unable to hold seats",
          message,
        );
      } finally {
        setHoldingSeats(false);
      }
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <View
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* HEADER */}

        <View
          style={styles.header}
        >
          <Pressable
            onPress={onBack}
            style={
              styles.backButton
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ←
            </Text>
          </Pressable>

          <View
            style={
              styles.headerMiddle
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Movie Tickets
            </Text>

            <Text
              style={
                styles.headerSub
              }
            >
              Real movies • Real theatres • Live seats
            </Text>
          </View>

          <Pressable
            onPress={
              refreshSeats
            }
            disabled={
              !selectedShow ||
              loadingSeats
            }
            style={[
              styles.refreshButton,
              !selectedShow &&
                styles.refreshDisabled,
            ]}
          >
            <Text
              style={
                styles.refreshText
              }
            >
              ↻
            </Text>
          </Pressable>
        </View>

        {/* CITY */}

        <View
          style={
            styles.locationCard
          }
        >
          <View
            style={
              styles.cityArea
            }
          >
            <Text
              style={
                styles.smallLabel
              }
            >
              CITY
            </Text>

            <TextInput
              value={city}
              onChangeText={
                setCity
              }
              onSubmitEditing={
                loadMovies
              }
              placeholder="Enter city"
              placeholderTextColor="#9A9DA8"
              autoCapitalize="words"
              style={
                styles.cityInput
              }
            />
          </View>

          <Pressable
            onPress={
              loadMovies
            }
            style={
              styles.searchButton
            }
          >
            <Text
              style={
                styles.searchButtonText
              }
            >
              Search
            </Text>
          </Pressable>
        </View>

        {/* DATES */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          SELECT DATE
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.dateList
          }
        >
          {dateOptions.map(
            (date) => {
              const selected =
                date.value ===
                selectedDate;

              return (
                <Pressable
                  key={
                    date.value
                  }
                  onPress={() =>
                    setSelectedDate(
                      date.value,
                    )
                  }
                  style={[
                    styles.dateButton,
                    selected &&
                      styles.dateButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selected &&
                        styles.dateTextSelected,
                    ]}
                  >
                    {date.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </ScrollView>

        {/* ERROR */}

        {!!errorMessage && (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>

            <Pressable
              onPress={
                loadMovies
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* MOVIES */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {city.trim()
              ? `MOVIES IN ${city
                  .trim()
                  .toUpperCase()}`
              : "MOVIES"}
          </Text>

          {loadingMovies && (
            <ActivityIndicator
              size="small"
              color="#E7A400"
            />
          )}
        </View>

        {loadingMovies ? (
          <LoadingCard
            text="Finding movies..."
          />
        ) : movies.length ===
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
              🎬
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No movies found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Enter a city and tap Search.
            </Text>
          </View>
        ) : (
          movies.map(
            (movie) => {
              const selected =
                selectedMovie?.id ===
                movie.id;

              return (
                <Pressable
                  key={movie.id}
                  onPress={() =>
                    selectMovie(
                      movie,
                    )
                  }
                  style={[
                    styles.movieCard,
                    selected &&
                      styles.movieCardSelected,
                  ]}
                >
                  <View
                    style={
                      styles.moviePoster
                    }
                  >
                    <Text
                      style={
                        styles.posterEmoji
                      }
                    >
                      🎬
                    </Text>
                  </View>

                  <View
                    style={
                      styles.flexOne
                    }
                  >
                    <Text
                      style={
                        styles.movieTitle
                      }
                    >
                      {movie.title}
                    </Text>

                    <Text
                      style={
                        styles.movieMeta
                      }
                    >
                      {movie.language}
                      {" • "}
                      {movie.genre}
                    </Text>

                    <Text
                      style={
                        styles.duration
                      }
                    >
                      {movie.durationMinutes} min
                      {" • "}
                      ⭐ {movie.rating}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.chevron
                    }
                  >
                    ›
                  </Text>
                </Pressable>
              );
            },
          )
        )}

        {/* THEATRES */}

        {selectedMovie && (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                THEATRES
              </Text>

              {loadingShows && (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />
              )}
            </View>

            {loadingShows ? (
              <LoadingCard
                text="Finding theatres and shows..."
              />
            ) : theatres.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No theatres available
                </Text>
              </View>
            ) : (
              theatres.map(
                (theatre) => {
                  const selected =
                    selectedTheatre?.id ===
                    theatre.id;

                  const theatreShowCount =
                    shows.filter(
                      (show) =>
                        show.theatre.id ===
                        theatre.id,
                    ).length;

                  return (
                    <Pressable
                      key={
                        theatre.id
                      }
                      onPress={() =>
                        selectTheatre(
                          theatre,
                        )
                      }
                      style={[
                        styles.theatreCard,
                        selected &&
                          styles.theatreSelected,
                      ]}
                    >
                      <View
                        style={
                          styles.theatreIcon
                        }
                      >
                        <Text
                          style={
                            styles.theatreEmoji
                          }
                        >
                          🍿
                        </Text>
                      </View>

                      <View
                        style={
                          styles.flexOne
                        }
                      >
                        <Text
                          style={
                            styles.theatreName
                          }
                        >
                          {theatre.name}
                        </Text>

                        <Text
                          style={
                            styles.theatreAddress
                          }
                        >
                          {theatre.address}
                        </Text>

                        <Text
                          style={
                            styles.showCount
                          }
                        >
                          {theatreShowCount} shows available
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.chevron
                        }
                      >
                        ›
                      </Text>
                    </Pressable>
                  );
                },
              )
            )}
          </>
        )}

        {/* SHOWS */}

        {selectedTheatre && (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                SHOW TIMES
              </Text>
            </View>

            {theatreShows.length ===
            0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No shows available
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.showGrid
                }
              >
                {theatreShows.map(
                  (show) => {
                    const selected =
                      selectedShow?.id ===
                      show.id;

                    return (
                      <Pressable
                        key={
                          show.id
                        }
                        onPress={() =>
                          selectShow(
                            show,
                          )
                        }
                        style={[
                          styles.showButton,
                          selected &&
                            styles.showSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.showTime,
                            selected &&
                              styles.showTimeSelected,
                          ]}
                        >
                          {formatTime(
                            show.startTime,
                          )}
                        </Text>

                        <Text
                          style={[
                            styles.showFormat,
                            selected &&
                              styles.showFormatSelected,
                          ]}
                        >
                          {show.screenName}
                        </Text>

                        <Text
                          style={[
                            styles.showPrice,
                            selected &&
                              styles.showPriceSelected,
                          ]}
                        >
                          ₹{show.priceFrom}
                          {" • "}
                          {show.availableSeats} seats
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            )}
          </>
        )}

        {/* SEATS */}

        {selectedShow && (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                LIVE SEAT AVAILABILITY
              </Text>

              <Pressable
                onPress={
                  refreshSeats
                }
              >
                <Text
                  style={
                    styles.refreshLabel
                  }
                >
                  Refresh
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.legend
              }
            >
              <Legend
                background="#FFFFFF"
                border="#D8D1C5"
                label="Available"
              />

              <Legend
                background="#E7A400"
                border="#E7A400"
                label="Selected"
              />

              <Legend
                background="#D8D8D8"
                border="#D8D8D8"
                label="Booked"
              />
            </View>

            <View
              style={
                styles.screenLabel
              }
            >
              <Text
                style={
                  styles.screenText
                }
              >
                {selectedShow.screenName.toUpperCase()}
              </Text>
            </View>

            {loadingSeats ? (
              <LoadingCard
                text="Checking live seat availability..."
              />
            ) : seats.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Seat map unavailable
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Tap Refresh and try again.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.seatMap
                }
              >
                {seatRows.map(
                  ([row, rowSeats]) => (
                    <View
                      key={row}
                      style={
                        styles.seatRow
                      }
                    >
                      <Text
                        style={
                          styles.rowLabel
                        }
                      >
                        {row}
                      </Text>

                      <View
                        style={
                          styles.rowSeats
                        }
                      >
                        {rowSeats.map(
                          (seat) => {
                            const selected =
                              selectedSeats.includes(
                                seat.id,
                              );

                            const unavailable =
                              seat.status !==
                              "AVAILABLE";

                            return (
                              <Pressable
                                key={
                                  seat.id
                                }
                                disabled={
                                  unavailable
                                }
                                onPress={() =>
                                  toggleSeat(
                                    seat,
                                  )
                                }
                                style={[
                                  styles.seat,
                                  selected &&
                                    styles.seatSelected,
                                  unavailable &&
                                    styles.seatUnavailable,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.seatText,
                                    selected &&
                                      styles.seatTextSelected,
                                    unavailable &&
                                      styles.seatTextUnavailable,
                                  ]}
                                >
                                  {seat.number}
                                </Text>
                              </Pressable>
                            );
                          },
                        )}
                      </View>
                    </View>
                  ),
                )}
              </View>
            )}

            {/* SUMMARY */}

            <View
              style={
                styles.summary
              }
            >
              <View
                style={
                  styles.flexOne
                }
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  {selectedSeats.length} seat
                  {selectedSeats.length ===
                  1
                    ? ""
                    : "s"} selected
                </Text>

                <Text
                  style={
                    styles.summarySeats
                  }
                  numberOfLines={2}
                >
                  {selectedSeatObjects
                    .map(
                      (seat) =>
                        seat.label,
                    )
                    .join(", ") ||
                    "Select available seats"}
                </Text>
              </View>

              <Text
                style={
                  styles.total
                }
              >
                ₹{totalAmount}
              </Text>
            </View>

            {/* BOOK */}

            <Pressable
              onPress={
                handleContinue
              }
              disabled={
                holdingSeats ||
                selectedSeats.length ===
                  0
              }
              style={[
                styles.bookButton,
                selectedSeats.length ===
                  0 &&
                  styles.bookButtonDisabled,
              ]}
            >
              {holdingSeats ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.bookText
                    }
                  >
                    Continue to Payment
                  </Text>

                  <Text
                    style={
                      styles.bookArrow
                    }
                  >
                    →
                  </Text>
                </>
              )}
            </Pressable>

            <Text
              style={
                styles.securityText
              }
            >
              🔒 Seats are checked again before booking
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ============================================================
   LOADING CARD
============================================================ */

function LoadingCard({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.loadingCard
      }
    >
      <ActivityIndicator
        size="large"
        color="#E7A400"
      />

      <Text
        style={
          styles.loadingText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* ============================================================
   LEGEND
============================================================ */

function Legend({
  background,
  border,
  label,
}: {
  background: string;
  border: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.legendItem
      }
    >
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor:
              background,
            borderColor:
              border,
          },
        ]}
      />

      <Text
        style={
          styles.legendText
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#F8F6F1",
    },

    container: {
      padding: 20,
      paddingBottom: 60,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },

    headerMiddle: {
      flex: 1,
      marginHorizontal: 12,
    },

    backButton: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        "#E7E0D4",
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
      fontSize: 11,
      color: "#717489",
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        "#E7E0D4",
    },

    refreshDisabled: {
      opacity: 0.45,
    },

    refreshText: {
      fontSize: 24,
      fontWeight: "800",
      color: "#E7A400",
    },

    locationCard: {
      padding: 15,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E7E0D4",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 22,
    },

    cityArea: {
      flex: 1,
    },

    smallLabel: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.3,
      color: "#E7A400",
    },

    cityInput: {
      marginTop: 2,
      paddingVertical: 2,
      paddingRight: 10,
      fontSize: 16,
      fontWeight: "900",
      color: "#152238",
    },

    searchButton: {
      minHeight: 42,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor:
        "#E7A400",
      alignItems: "center",
      justifyContent: "center",
    },

    searchButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    sectionTitle: {
      marginTop: 5,
      marginBottom: 12,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.4,
      color: "#E7A400",
    },

    dateList: {
      gap: 9,
      paddingBottom: 20,
    },

    dateButton: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 13,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2DDD4",
      justifyContent:
        "center",
    },

    dateButtonSelected: {
      backgroundColor:
        "#E7A400",
      borderColor:
        "#E7A400",
    },

    dateText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#152238",
    },

    dateTextSelected: {
      color: "#FFFFFF",
    },

    errorCard: {
      padding: 14,
      borderRadius: 15,
      backgroundColor:
        "#FFF0EE",
      borderWidth: 1,
      borderColor:
        "#F1B6AE",
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },

    errorText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: "#B52D22",
      fontWeight: "700",
      marginRight: 10,
    },

    retryText: {
      fontSize: 11,
      fontWeight: "900",
      color: "#B52D22",
    },

    loadingCard: {
      minHeight: 110,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E7E0D4",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 14,
    },

    loadingText: {
      marginTop: 10,
      fontSize: 11,
      color: "#717489",
      fontWeight: "700",
    },

    emptyCard: {
      minHeight: 110,
      padding: 20,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E7E0D4",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 14,
    },

    emptyIcon: {
      fontSize: 30,
      marginBottom: 5,
    },

    emptyTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: "#152238",
      textAlign: "center",
    },

    emptyText: {
      marginTop: 5,
      fontSize: 11,
      color: "#717489",
      textAlign: "center",
    },

    movieCard: {
      minHeight: 78,
      padding: 12,
      borderRadius: 17,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2DDD4",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },

    movieCardSelected: {
      borderWidth: 2,
      borderColor:
        "#E7A400",
    },

    moviePoster: {
      width: 52,
      height: 64,
      borderRadius: 12,
      backgroundColor:
        "#FCE8E7",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    posterEmoji: {
      fontSize: 25,
    },

    flexOne: {
      flex: 1,
    },

    movieTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: "#152238",
    },

    movieMeta: {
      marginTop: 4,
      fontSize: 10,
      color: "#717489",
    },

    duration: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: "700",
      color: "#A66F00",
    },

    chevron: {
      fontSize: 25,
      color: "#8B8F9A",
      marginLeft: 8,
    },

    theatreCard: {
      minHeight: 78,
      padding: 13,
      borderRadius: 17,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2DDD4",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },

    theatreSelected: {
      borderWidth: 2,
      borderColor:
        "#E7A400",
    },

    theatreIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor:
        "#FFF2D3",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    theatreEmoji: {
      fontSize: 23,
    },

    theatreName: {
      fontSize: 14,
      fontWeight: "900",
      color: "#152238",
    },

    theatreAddress: {
      marginTop: 4,
      fontSize: 10,
      lineHeight: 15,
      color: "#717489",
    },

    showCount: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: "800",
      color: "#159A63",
    },

    showGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },

    showButton: {
      minWidth: 105,
      minHeight: 68,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#DDD7CD",
      alignItems: "center",
      justifyContent:
        "center",
    },

    showSelected: {
      backgroundColor:
        "#E7A400",
      borderColor:
        "#E7A400",
    },

    showTime: {
      fontSize: 13,
      fontWeight: "900",
      color: "#152238",
    },

    showTimeSelected: {
      color: "#FFFFFF",
    },

    showFormat: {
      marginTop: 3,
      fontSize: 9,
      fontWeight: "800",
      color: "#717489",
    },

    showFormatSelected: {
      color: "#FFF8E8",
    },

    showPrice: {
      marginTop: 3,
      fontSize: 8,
      fontWeight: "800",
      color: "#A66F00",
      textAlign: "center",
    },

    showPriceSelected: {
      color: "#FFFFFF",
    },

    refreshLabel: {
      marginBottom: 12,
      fontSize: 11,
      fontWeight: "900",
      color: "#A66F00",
    },

    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 16,
      marginBottom: 16,
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    legendDot: {
      width: 16,
      height: 16,
      borderRadius: 5,
      borderWidth: 1,
      marginRight: 6,
    },

    legendText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#717489",
    },

    screenLabel: {
      height: 32,
      marginHorizontal: 20,
      marginBottom: 22,
      borderRadius: 8,
      backgroundColor:
        "#171C2B",
      alignItems: "center",
      justifyContent: "center",
    },

    screenText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 2.5,
    },

    seatMap: {
      paddingVertical: 15,
      paddingHorizontal: 8,
      borderRadius: 20,
      backgroundColor:
        "#F0ECE4",
      borderWidth: 1,
      borderColor:
        "#E0D8CB",
      marginBottom: 16,
    },

    seatRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },

    rowLabel: {
      width: 25,
      fontSize: 10,
      fontWeight: "900",
      color: "#717489",
    },

    rowSeats: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "center",
      gap: 7,
    },

    seat: {
      width: 35,
      height: 32,
      borderRadius: 8,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#D8D1C5",
      alignItems: "center",
      justifyContent: "center",
    },

    seatSelected: {
      backgroundColor:
        "#E7A400",
      borderColor:
        "#E7A400",
    },

    seatUnavailable: {
      backgroundColor:
        "#D8D8D8",
      borderColor:
        "#D8D8D8",
      opacity: 0.7,
    },

    seatText: {
      fontSize: 10,
      fontWeight: "900",
      color: "#555B6E",
    },

    seatTextSelected: {
      color: "#FFFFFF",
    },

    seatTextUnavailable: {
      color: "#888888",
    },

    summary: {
      minHeight: 78,
      padding: 17,
      borderRadius: 18,
      backgroundColor:
        "#171C2B",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 12,
    },

    summaryTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    summarySeats: {
      marginTop: 5,
      color: "#BFC4D0",
      fontSize: 10,
    },

    total: {
      color: "#E7A400",
      fontSize: 21,
      fontWeight: "900",
      marginLeft: 12,
    },

    bookButton: {
      minHeight: 56,
      borderRadius: 16,
      backgroundColor:
        "#E7A400",
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    bookButtonDisabled: {
      backgroundColor:
        "#BDB9B0",
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

    securityText: {
      marginTop: 10,
      textAlign: "center",
      fontSize: 9,
      color: "#717489",
      fontWeight: "700",
    },
  });

export default MovieBookingScreen;