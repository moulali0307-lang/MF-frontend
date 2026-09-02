import { apiRequest } from "./client";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "LOCKED";

export interface Movie {
  id: string;
  title: string;
  language?: string;
  genre?: string;
  durationMinutes?: number;
  rating?: number;
  posterUrl?: string;
}

export interface Theatre {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

export interface MovieShow {
  id: string;
  movie: Movie;
  theatre: Theatre;
  screenName?: string;
  startTime: string;
  endTime?: string;
  priceFrom?: number;
  availableSeats?: number;
  totalSeats?: number;
}

export interface MovieSeat {
  id: string;
  row: string;
  number: string;
  label: string;
  category?: string;
  price: number;
  status: SeatStatus;
}

export interface MovieSeatMap {
  showId: string;
  theatre: Theatre;
  screenName?: string;
  movie: Movie;
  seats: MovieSeat[];
}

export async function fetchMovies(
  city: string,
  token: string,
): Promise<Movie[]> {
  const result = await apiRequest<{ movies: Movie[] }>(
    `/api/movies?city=${encodeURIComponent(city)}`,
    {
      method: "GET",
      token,
    },
  );

  return result.movies ?? [];
}

export async function fetchMovieShows(
  movieId: string,
  city: string,
  date: string,
  token: string,
): Promise<MovieShow[]> {
  const result = await apiRequest<{ shows: MovieShow[] }>(
    `/api/movies/${encodeURIComponent(movieId)}/shows?city=${encodeURIComponent(
      city,
    )}&date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    },
  );

  return result.shows ?? [];
}

export async function fetchMovieSeats(
  showId: string,
  token: string,
): Promise<MovieSeatMap> {
  return apiRequest<MovieSeatMap>(
    `/api/movies/shows/${encodeURIComponent(showId)}/seats`,
    {
      method: "GET",
      token,
    },
  );
}