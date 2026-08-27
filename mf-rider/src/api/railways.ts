import { apiRequest } from "./client";

export interface RailwayStation {
  code: string;
  name: string;
  city?: string;
}

export interface TrainSearchResult {
  from: string;
  to: string;
  date: string;
  trains: any;
}

export async function searchStations(
  query: string,
  token: string,
): Promise<RailwayStation[]> {
  const result = await apiRequest<{
    stations: RailwayStation[];
  }>(
    `/api/railways/stations?q=${encodeURIComponent(query.trim())}`,
    {
      method: "GET",
      token,
    },
  );

  return result.stations;
}

export async function searchTrains(
  fromCode: string,
  toCode: string,
  date: string,
  token: string,
): Promise<TrainSearchResult> {
  return apiRequest<TrainSearchResult>(
    `/api/railways/trains?from=${encodeURIComponent(
      fromCode,
    )}&to=${encodeURIComponent(
      toCode,
    )}&date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    },
  );
}