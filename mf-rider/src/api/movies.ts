import { apiRequest } from "./client";

/* ============================================================
   TYPES
============================================================ */

export interface Movie {
  id: string;
  title: string;
  language: string;
  genre: string;
  durationMinutes: number;
  rating: number;
  posterUrl?: string | null;
}

export interface Theatre {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface MovieShow {
  id: string;
  movie: Movie;
  theatre: Theatre;
  screenName: string;
  startTime: string;
  endTime: string;
  priceFrom: number;
  availableSeats: number;
  totalSeats: number;
}

export interface MovieSeat {
  id: string;
  row: string;
  number: string;
  label: string;
  category: "PREMIUM" | "REGULAR";
  price: number;
  status: "AVAILABLE" | "BOOKED" | "LOCKED";
}

export interface MovieSeatMap {
  showId: string;
  theatre: Theatre;
  screenName: string;
  movie: Movie;
  seats: MovieSeat[];
}

export interface MovieSeatHold {
  holdId: string;
  showId: string;
  seatIds: string[];
  expiresAt: string;
}

/* ============================================================
   RESPONSE TYPES
============================================================ */

interface MoviesResponse {
  success?: boolean;
  movies?: Movie[];
}

interface TheatresResponse {
  success?: boolean;
  theatres?: Theatre[];
}

interface ShowsResponse {
  success?: boolean;
  shows?: MovieShow[];
}

interface SeatsResponse {
  success?: boolean;
  seatMap?: MovieSeatMap;
  seats?: MovieSeat[];
}

interface HoldResponse {
  success?: boolean;
  holdId: string;
  showId: string;
  seatIds: string[];
  expiresAt: string;
}

/* ============================================================
   MOVIES
============================================================ */

export async function fetchMovies(
  city: string,
  date: string,
  token: string,
): Promise<Movie[]> {
  const result =
    await apiRequest<MoviesResponse>(
      `/api/movies?city=${encodeURIComponent(
        city.trim(),
      )}&date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        token,
      },
    );

  return result.movies ?? [];
}

/* ============================================================
   THEATRES
============================================================ */

export async function fetchMovieTheatres(
  movieId: string,
  city: string,
  date: string,
  token: string,
): Promise<Theatre[]> {
  const result =
    await apiRequest<TheatresResponse>(
      `/api/movies/${encodeURIComponent(
        movieId,
      )}/theatres?city=${encodeURIComponent(
        city.trim(),
      )}&date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        token,
      },
    );

  return result.theatres ?? [];
}

/* ============================================================
   SHOWS
============================================================ */

export async function fetchMovieShows(
  movieId: string,
  city: string,
  date: string,
  token: string,
): Promise<MovieShow[]> {
  const cleanMovieId = movieId.trim();
  const cleanCity = city.trim();
  const cleanDate = date.trim();

  if (!cleanMovieId) {
    throw new Error("Movie ID is required");
  }

  if (!cleanCity) {
    throw new Error("City is required");
  }

  if (!cleanDate) {
    throw new Error("Date is required");
  }

  const result = await apiRequest<ShowsResponse>(
    `/api/movies/${encodeURIComponent(
      cleanMovieId,
    )}/shows?city=${encodeURIComponent(
      cleanCity,
    )}&date=${encodeURIComponent(
      cleanDate,
    )}`,
    {
      method: "GET",
      token,
    },
  );

  return result.shows ?? [];
}

/* ============================================================
   SEATS
============================================================ */

interface SeatsResponse {
  success?: boolean;
  seatMap?: MovieSeatMap;
  seats?: MovieSeat[];
}

export async function fetchMovieSeats(
  showId: string,
  token: string,
): Promise<MovieSeatMap> {
  const cleanShowId = showId.trim();

  if (!cleanShowId) {
    throw new Error("Show ID is required");
  }

  const result =
    await apiRequest<SeatsResponse>(
      `/api/movies/shows/${encodeURIComponent(
        cleanShowId,
      )}/seats`,
      {
        method: "GET",
        token,
      },
    );

  // Backend's real response
  if (result.seatMap) {
    return result.seatMap;
  }

  // Backward compatibility
  if (result.seats) {
    return {
      showId: cleanShowId,
      theatre: {
        id: "",
        name: "",
        address: "",
        city: "",
      },
      screenName: "",
      movie: {
        id: "",
        title: "",
        language: "",
        genre: "",
        durationMinutes: 0,
        rating: 0,
      },
      seats: result.seats,
    };
  }

  throw new Error(
    "Seat map is unavailable for this show.",
  );
}

/* ============================================================
   HOLD SEATS
============================================================ */

export async function holdMovieSeats(
  showId: string,
  seatIds: string[],
  token: string,
): Promise<MovieSeatHold> {
  return apiRequest<HoldResponse>(
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