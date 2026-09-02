import { apiRequest } from "./client";

export interface RailwayStation {
  code: string;
  name: string;
  city?: string;
}

export interface TrainLiveInfo {
  type?: string;
  startDate?: string;
  expectedArrivalTime?: string | null;
  expectedDepartureTime?: string | null;
  platform?: string | null;
  delayMinutes?: number | null;
}

export interface RailwayTrain {
  train: {
    number: string;
    name: string;
    type?: string;
    category?: string;
    runDays?: string[];
  };

  from: {
    stationCode?: string;
    stationName?: string;
    departure?: string;
    day?: number;
    sequence?: number;
  };

  to: {
    stationCode?: string;
    stationName?: string;
    arrival?: string;
    day?: number;
    sequence?: number;
  };

  distance?: number;
  duration?: number;
  totalHaltsBetween?: number;

  live?: TrainLiveInfo;
}


export interface TrainSearchResult {
  from: {
    code?: string;
    name?: string;
  };

  to: {
    code?: string;
    name?: string;
  };

  date: string;

  count: number;

  trains: RailwayTrain[];
}

export interface LiveTrainStatus {
  trainNumber: string;
  trainName: string;

  startDate?: string;
  lastUpdatedAt?: string;
  status?: string;
  delayMinutes?: number;
  

  /*
   * Additional fields used by TrainBookingScreen
   */
  distanceKm?: number | null;
  haltedAtStation?: string | null;
  haltedText?: string | null;

  train?: {
    number?: string;
    name?: string;
    type?: string;
    category?: string;

    source?: {
      code?: string;
      name?: string;
    };

    destination?: {
      code?: string;
      name?: string;
    };
  };

  currentLocation?: {
    stationCode?: string;
    sequence?: number;
    status?: string;

    isHalt?: boolean;
    isDiverted?: boolean;
    isActualPosition?: boolean;

    segmentProgress?: number;

    speedKmh?: number;
    bearingDegrees?: number;
  };

  previousHalt?: {
    stationCode?: string;
    stationName?: string;
    sequence?: number;
    distance?: number;
  };

  nextHalt?: {
    stationCode?: string;
    stationName?: string;
    sequence?: number;
    distance?: number;
  };

  route?: Array<{
    sequence?: number;

    stationCode?: string;
    stationName?: string;

    isHalt?: boolean;

    scheduledArrival?: string | null;
    scheduledDeparture?: string | null;

    actualArrival?: string | null;
    actualDeparture?: string | null;

    delayArrival?: number | null;
    delayDeparture?: number | null;

    status?: string;

    distance?: number;

    platform?: string | null;
  }>;

  isLive?: boolean;
}

export async function searchStations(
  query: string,
  token: string,
): Promise<RailwayStation[]> {
  const result = await apiRequest<{
    stations: RailwayStation[];
  }>(
    `/api/railways/stations?q=${encodeURIComponent(
      query.trim(),
    )}`,
    {
      method: "GET",
      token,
    },
  );

  return result.stations ?? [];
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
    )}&date=${encodeURIComponent(
      date,
    )}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function getLiveTrainStatus(
  trainNumber: string,
  date: string,
  token: string,
): Promise<LiveTrainStatus> {
  const result = await apiRequest<{
    train: LiveTrainStatus;
  }>(
    `/api/railways/trains/${encodeURIComponent(
      trainNumber,
    )}/live?date=${encodeURIComponent(
      date,
    )}`,
    {
      method: "GET",
      token,
    },
  );

  return result.train;
}