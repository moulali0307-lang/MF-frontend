import { apiRequest } from "./client";

export type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

export interface RideParticipant {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: "RIDER" | "PARTNER" | "ADMIN";
}

export interface Ride {
  id: string;
  status: RideStatus;

  passengerId: string;
  riderId: string | null;

  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;

  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;

  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;

  otpCode: string | null;
  otpExpiresAt: string | null;
  otpVerifiedAt: string | null;
  
  cancelledAt: string | null;

  cancelledBy: string | null;
  cancellationReason: string | null;

  createdAt: string;
  updatedAt: string;

  passenger: RideParticipant;
  rider: RideParticipant | null;
}

export interface CreateRidePayload {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
}

export interface CreateRideResponse {
  ride: Ride;
}

export interface RideListResponse {
  rides: Ride[];
}

export interface CancelRidePayload {
  reason?: string;
}

/**
 * Create a new ride request.
 * Rider app only — backend requires RIDER role.
 */
export function createRide(
  payload: CreateRidePayload,
  token: string,
): Promise<CreateRideResponse> {
  return apiRequest<CreateRideResponse>("/api/rides", {
    method: "POST",
    body: payload,
    token,
  });
}

/**
 * Get all rides belonging to the logged-in rider.
 */
export function listMyRides(token: string): Promise<RideListResponse> {
  return apiRequest<RideListResponse>("/api/rides/mine", {
    method: "GET",
    token,
  });
}

/**
 * Get a specific ride.
 */
export function getRide(
  rideId: string,
  token: string,
): Promise<{ ride: Ride }> {
  return apiRequest<{ ride: Ride }>(`/api/rides/${rideId}`, {
    method: "GET",
    token,
  });
}

/**
 * Cancel a ride.
 */
export function cancelRide(
  rideId: string,
  token: string,
  reason?: string,
): Promise<{ ride: Ride }> {
  return apiRequest<{ ride: Ride }>(`/api/rides/${rideId}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
    token,
  });
}
