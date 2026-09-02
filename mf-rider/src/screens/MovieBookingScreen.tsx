import React, { useEffect, useMemo, useState } from "react";
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

import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { fetchMovieShows } from "../api/movies";

interface Props {
  onBack: () => void;
}

/* ============================================================
   TYPES
============================================================ */

type SeatStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "BLOCKED"
  | "SELECTED";

interface Movie {
  id: string;
  title: string;
  language?: string;
  certificate?: string;
  genre?: string;
  durationMinutes?: number;
  posterUrl?: string | null;
}

interface Theatre {
  id: string;
  name: string;
  address?: string;
  city?: string;
  distanceKm?: number;
}

interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  time: string;
  format?: string;
  screenName?: string;
  price?: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  label: string;
  status: SeatStatus;
  price: number;
}

interface MoviesResponse {
  movies?: Movie[];
}

interface TheatresResponse {
  theatres?: Theatre[];
}

interface ShowsResponse {
  shows?: Show[];
}

interface SeatsResponse {
  seats?: Seat[];
}

/* ============================================================
   API
============================================================ */

/*
 * These are MF Rides backend endpoints.
 *
 * Backend must connect these endpoints to the actual movie/cinema
 * provider. The mobile app must NOT invent seat availability.
 */

async function fetchMovies(
  city: string,
  date: string,
  token: string,
): Promise<Movie[]> {
  const result = await apiRequest<MoviesResponse>(
    `/api/movies?city=${encodeURIComponent(
      city,
    )}&date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    },
  );

  return result.movies ?? [];
}

async function fetchTheatres(
  movieId: string,
  city: string,
  date: string,
  token: string,
): Promise<Theatre[]> {
  const result = await apiRequest<TheatresResponse>(
    `/api/movies/${encodeURIComponent(
      movieId,
    )}/theatres?city=${encodeURIComponent(
      city,
    )}&date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    },
  );

  return result.theatres ?? [];
}

async function fetchShows(
  movieId: string,
  theatreId: string,
  date: string,
  token: string,
): Promise<Show[]> {
  const result = await apiRequest<ShowsResponse>(
    `/api/movies/shows?movieId=${encodeURIComponent(
      movieId,
    )}&theatreId=${encodeURIComponent(
      theatreId,
    )}&date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    },
  );

  return result.shows ?? [];
}

async function fetchSeats(
  showId: string,
  token: string,
): Promise<Seat[]> {
  const result = await apiRequest<SeatsResponse>(
    `/api/movies/shows/${encodeURIComponent(
      showId,
    )}/seats`,
    {
      method: "GET",
      token,
    },
  );

  return result.seats ?? [];
}

async function holdSeats(
  showId: string,
  seatIds: string[],
  token: string,
): Promise<{ holdId: string; expiresAt?: string }> {
  return apiRequest<{
    holdId: string;
    expiresAt?: string;
  }>(
    `/api/movies/shows/${encodeURIComponent(
      showId,
    )}/hold`,
    {
      method: "POST",
      token,
      body: {
        seatIds,
      },
    },
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateLabel(date: Date) {
  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    },
  );
}

/* ============================================================
   SCREEN
============================================================ */

export function MovieBookingScreen({
  onBack,
}: Props) {
  const { token } = useAuth();

  /* ----------------------------------------------------------
     LOCATION / DATE
  ---------------------------------------------------------- */

  const [city, setCity] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(getTodayDate());

  const dateOptions = useMemo(() => {
    const dates: {
      value: string;
      label: string;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();

      date.setDate(
        date.getDate() + i,
      );

      dates.push({
        value: formatDate(date),
        label: getDateLabel(date),
      });
    }

    return dates;
  }, []);

  /* ----------------------------------------------------------
     DATA
  ---------------------------------------------------------- */

  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [theatres, setTheatres] =
    useState<Theatre[]>([]);

  const [shows, setShows] =
    useState<Show[]>([]);

  const [seats, setSeats] =
    useState<Seat[]>([]);

  /* ----------------------------------------------------------
     SELECTION
  ---------------------------------------------------------- */

  const [selectedMovie, setSelectedMovie] =
    useState<Movie | null>(null);

  const [selectedTheatre, setSelectedTheatre] =
    useState<Theatre | null>(null);

  const [selectedShow, setSelectedShow] =
    useState<Show | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  const [loadingMovies, setLoadingMovies] =
    useState(false);

  const [loadingTheatres, setLoadingTheatres] =
    useState(false);

  const [loadingShows, setLoadingShows] =
    useState(false);

  const [loadingSeats, setLoadingSeats] =
    useState(false);

  const [holdingSeats, setHoldingSeats] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ==========================================================
     LOAD MOVIES
  ========================================================== */

  useEffect(() => {
    if (!token) {
      return;
    }

    loadMovies();
  }, [token, selectedDate]);

  const loadMovies = async () => {
    if (!city.trim()) {
      setMovies([]);
      return;
    }

    try {
      setLoadingMovies(true);
      setErrorMessage("");

      setSelectedMovie(null);
      setSelectedTheatre(null);
      setSelectedShow(null);
      setSelectedSeats([]);

      setTheatres([]);
      setShows([]);
      setSeats([]);

      const shows = await fetchMovieShows(
      movie.id,
      city,
      selectedDate ?? "",
      token,
    );
      setMovies(result);
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
     LOAD THEATRES
  ========================================================== */

  const selectMovie = async (
    movie: Movie,
  ) => {
    if (!token) {
      return;
    }

    setSelectedMovie(movie);
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedSeats([]);

    setShows([]);
    setSeats([]);

    try {
      setLoadingTheatres(true);
      setErrorMessage("");

      const result =
        await fetchTheatres(
          movie.id,
          city.trim(),
          selectedDate,
          token,
        );

      setTheatres(result);
    } catch (error) {
      console.error(
        "Theatre loading error:",
        error,
      );

      setTheatres([]);

      setErrorMessage(
        "Unable to load theatres for this movie.",
      );
    } finally {
      setLoadingTheatres(false);
    }
  };

  /* ==========================================================
     LOAD SHOWS
  ========================================================== */

  const selectTheatre = async (
    theatre: Theatre,
  ) => {
    if (!token || !selectedMovie) {
      return;
    }

    setSelectedTheatre(theatre);
    setSelectedShow(null);
    setSelectedSeats([]);

    setSeats([]);

    try {
      setLoadingShows(true);
      setErrorMessage("");

      const result =
        await fetchShows(
          selectedMovie.id,
          theatre.id,
          selectedDate,
          token,
        );

      setShows(result);
    } catch (error) {
      console.error(
        "Show loading error:",
        error,
      );

      setShows([]);

      setErrorMessage(
        "Unable to load show timings.",
      );
    } finally {
      setLoadingShows(false);
    }
  };

  /* ==========================================================
     LOAD LIVE SEATS
  ========================================================== */

  const selectShow = async (
    show: Show,
  ) => {
    if (!token) {
      return;
    }

    setSelectedShow(show);
    setSelectedSeats([]);

    try {
      setLoadingSeats(true);
      setErrorMessage("");

      const result =
        await fetchSeats(
          show.id,
          token,
        );

      setSeats(result);
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
     SEAT SELECTION
  ========================================================== */

  const toggleSeat = (
    seat: Seat,
  ) => {
    if (
      seat.status !== "AVAILABLE"
    ) {
      return;
    }

    setSelectedSeats(
      (current) => {
        if (
          current.includes(seat.id)
        ) {
          return current.filter(
            (id) => id !== seat.id,
          );
        }

        if (current.length >= 8) {
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
     REFRESH LIVE SEATS
  ========================================================== */

  const refreshSeats = async () => {
    if (
      !token ||
      !selectedShow
    ) {
      return;
    }

    try {
      setLoadingSeats(true);

      const result =
        await fetchSeats(
          selectedShow.id,
          token,
        );

      setSeats(result);

      /*
       * Remove seats from local selection if they
       * became unavailable on the latest server check.
       */

      setSelectedSeats(
        (current) =>
          current.filter(
            (id) =>
              result.some(
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
      (sum, seat) =>
        sum + Number(seat.price || 0),
      0,
    );

  /* ==========================================================
     HOLD + CONTINUE
  ========================================================== */

  const handleContinue = async () => {
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

    if (!selectedShow) {
      Alert.alert(
        "Select show",
        "Please select a show time.",
      );
      return;
    }

    if (
      selectedSeats.length === 0
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

      /*
       * Final server-side check / temporary hold.
       *
       * This prevents two users from selecting
       * the same seats at the same time.
       */

      const hold =
        await holdSeats(
          selectedShow.id,
          selectedSeats,
          token,
        );

      Alert.alert(
        "Seats held successfully",
        [
          `Movie: ${selectedMovie.title}`,
          `Theatre: ${selectedTheatre.name}`,
          `Show: ${selectedShow.time}`,
          `Seats: ${selectedSeatObjects
            .map((seat) => seat.label)
            .join(", ")}`,
          `Total: ₹${totalAmount}`,
          "",
          hold.expiresAt
            ? `Hold expires: ${hold.expiresAt}`
            : "Seats are temporarily reserved.",
        ].join("\n"),
        [
          {
            text: "OK",
            onPress: () => {
              /*
               * Payment/booking screen can be connected here.
               *
               * Example:
               * navigation.navigate("MoviePayment", {
               *   holdId: hold.holdId
               * });
               */
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        "Seat hold error:",
        error,
      );

      /*
       * Most important case:
       * another user may have taken a seat
       * between the last refresh and this request.
       */

      await refreshSeats();

      Alert.alert(
        "Seats no longer available",
        "One or more selected seats are no longer available. We refreshed the seat map. Please select again.",
      );
    } finally {
      setHoldingSeats(false);
    }
  };

  /* ==========================================================
     GROUP SEATS BY ROW
  ========================================================== */

  const seatRows = useMemo(() => {
    const grouped: Record<
      string,
      Seat[]
    > = {};

    for (const seat of seats) {
      if (!grouped[seat.row]) {
        grouped[seat.row] = [];
      }

      grouped[seat.row].push(
        seat,
      );
    }

    return Object.entries(
      grouped,
    ).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [seats]);

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
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
            <Text
              style={
                styles.backText
              }
            >
              ←
            </Text>
          </Pressable>

          <View
            style={{
              flex: 1,
            }}
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
            onPress={refreshSeats}
            disabled={
              !selectedShow ||
              loadingSeats
            }
            style={
              styles.refreshButton
            }
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

        {/* LOCATION */}

        <View
          style={
            styles.locationCard
          }
        >
          <View>
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

        {/* DATE */}

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
            MOVIES IN {city.toUpperCase()}
          </Text>

          {loadingMovies && (
            <ActivityIndicator
              size="small"
              color="#E7A400"
            />
          )}
        </View>

        {loadingMovies ? (
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
              Finding movies...
            </Text>
          </View>
        ) : movies.length === 0 ? (
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
              Try another city or date.
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
                    style={{
                      flex: 1,
                    }}
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
                      {[
                        movie.language,
                        movie.certificate,
                        movie.genre,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          " • ",
                        )}
                    </Text>

                    {movie.durationMinutes ? (
                      <Text
                        style={
                          styles.duration
                        }
                      >
                        {movie.durationMinutes} min
                      </Text>
                    ) : null}
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

              {loadingTheatres && (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />
              )}
            </View>

            {loadingTheatres ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Finding nearby theatres...
                </Text>
              </View>
            ) : theatres.length === 0 ? (
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
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.theatreName
                          }
                        >
                          {theatre.name}
                        </Text>

                        {!!theatre.address && (
                          <Text
                            style={
                              styles.theatreAddress
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {theatre.address}
                          </Text>
                        )}

                        {theatre.distanceKm !=
                          null && (
                          <Text
                            style={
                              styles.distance
                            }
                          >
                            {theatre.distanceKm.toFixed(
                              1,
                            )}{" "}
                            km away
                          </Text>
                        )}
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

              {loadingShows && (
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />
              )}
            </View>

            {loadingShows ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#E7A400"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading show timings...
                </Text>
              </View>
            ) : shows.length === 0 ? (
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
                {shows.map(
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
                          {show.time}
                        </Text>

                        {!!show.format && (
                          <Text
                            style={[
                              styles.showFormat,
                              selected &&
                                styles.showFormatSelected,
                            ]}
                          >
                            {show.format}
                          </Text>
                        )}

                        {show.price !=
                          null && (
                          <Text
                            style={[
                              styles.showPrice,
                              selected &&
                                styles.showPriceSelected,
                            ]}
                          >
                            ₹
                            {show.price}
                          </Text>
                        )}
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
                color="#FFFFFF"
                border="#D8D1C5"
                label="Available"
              />

              <Legend
                color="#E7A400"
                border="#E7A400"
                label="Selected"
              />

              <Legend
                color="#D5D5D5"
                border="#D5D5D5"
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
                SCREEN
              </Text>
            </View>

            {loadingSeats ? (
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
                  Checking live seat availability...
                </Text>
              </View>
            ) : seats.length === 0 ? (
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
                  Please refresh and try again.
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
                                  {
                                    seat.number
                                  }
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
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  {selectedSeats.length}{" "}
                  seat
                  {selectedSeats.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  selected
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
                    .join(
                      ", ",
                    ) ||
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
              style={({ pressed }) => [
                styles.bookButton,
                selectedSeats.length ===
                  0 &&
                  styles.bookButtonDisabled,
                pressed &&
                  styles.bookButtonPressed,
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
   LEGEND
============================================================ */

function Legend({
  color,
  border,
  label,
}: {
  color: string;
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
              color,
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F6F1",
  },

  container: {
    padding: 20,
    paddingBottom: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
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
    fontSize: 11,
    color: "#717489",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7E0D4",
  },

  refreshText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#E7A400",
  },

  locationCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E0D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  smallLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: "#E7A400",
  },

  cityInput: {
    width: 220,
    marginTop: 2,
    paddingVertical: 2,
    fontSize: 16,
    fontWeight: "900",
    color: "#152238",
  },

  searchButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#E7A400",
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
    justifyContent: "space-between",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    justifyContent: "center",
  },

  dateButtonSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
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
    backgroundColor: "#FFF0EE",
    borderWidth: 1,
    borderColor: "#F1B6AE",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  errorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#B52D22",
    fontWeight: "700",
  },

  retryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#B52D22",
  },

  loadingCard: {
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E0D4",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 12,
  },

  loadingText: {
    fontSize: 11,
    color: "#717489",
    fontWeight: "700",
  },

  emptyCard: {
    minHeight: 110,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E0D4",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  movieCardSelected: {
    borderWidth: 2,
    borderColor: "#E7A400",
  },

  moviePoster: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#FCE8E7",
    alignItems: "center",
    justifyContent: "center",
  },

  posterEmoji: {
    fontSize: 25,
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
  },

  theatreCard: {
    minHeight: 78,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2DDD4",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  theatreSelected: {
    borderWidth: 2,
    borderColor: "#E7A400",
  },

  theatreIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF2D3",
    alignItems: "center",
    justifyContent: "center",
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

  distance: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "#159A63",
  },

  showGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },

  showButton: {
    minWidth: 105,
    minHeight: 64,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD7CD",
    alignItems: "center",
    justifyContent: "center",
  },

  showSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
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
    fontSize: 9,
    fontWeight: "800",
    color: "#A66F00",
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
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
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
    backgroundColor: "#171C2B",
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
    backgroundColor: "#F0ECE4",
    borderWidth: 1,
    borderColor: "#E0D8CB",
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
    justifyContent: "center",
    gap: 7,
  },

  seat: {
    width: 35,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D1C5",
    alignItems: "center",
    justifyContent: "center",
  },

  seatSelected: {
    backgroundColor: "#E7A400",
    borderColor: "#E7A400",
  },

  seatUnavailable: {
    backgroundColor: "#D8D8D8",
    borderColor: "#D8D8D8",
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
    backgroundColor: "#171C2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
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

  bookButtonDisabled: {
    backgroundColor: "#BDB9B0",
  },

  bookButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
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