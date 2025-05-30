"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Users,
  DollarSign,
  Car,
  Loader2,
  AlertCircle,
  Clock,
  Wifi,
  Wind,
  ChevronRight,
  ChevronLeft,
  Trash2,
  X,
  CheckCircle2,
  Edit,
} from "lucide-react";

const statusColors = {
  not_started: "bg-yellow-100 text-black",
  waiting_for_customer: "bg-blue-100 text-black",
  started: "bg-green-100 text-black",
  finished: "bg-gray-100 text-black",
  cancelled: "bg-red-100 text-black",
};

const formatDateTime = (dateTimeStr) => {
  return new Date(dateTimeStr).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Update the sorting logic to use the latestBookingTime field directly from the ride document

    // Replace the fetchRidesWithBookings function with this updated version
    const fetchRidesWithBookings = async () => {
      try {
        // Get all rides owned by the user
        const ridesRef = collection(db, "rides");
        const q = query(ridesRef, where("ownerId", "==", user.uid));

        const ridesSnapshot = await getDocs(q);
        const ridesData = [];

        // For each ride, check if it has any bookings
        for (const rideDoc of ridesSnapshot.docs) {
          const ride = { id: rideDoc.id, ...rideDoc.data() };

          // Check for bookings
          const bookingsRef = collection(db, "bookings");
          const bookingsQuery = query(
            bookingsRef,
            where("rideId", "==", ride.id)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);

          // Add hasBookings flag and bookingsCount
          ride.hasBookings = !bookingsSnapshot.empty;
          ride.bookingsCount = bookingsSnapshot.size;

          ridesData.push(ride);
        }

        // Sort rides:
        // 1. First by hasBookings (rides with bookings come first)
        // 2. Then by latestBookingTime for rides with bookings
        // 3. Then by status (current rides before previous)
        // 4. Finally by ride start date (newest first)
        ridesData.sort((a, b) => {
          // First sort by hasBookings (rides with bookings come first)
          if (a.hasBookings && !b.hasBookings) return -1;
          if (!a.hasBookings && b.hasBookings) return 1;

          // If both have bookings, sort by latestBookingTime
          if (a.hasBookings && b.hasBookings) {
            // Convert Firebase timestamps to JavaScript Date objects for comparison
            const aTime = a.latestBookingTime?.toDate?.() || new Date(0);
            const bTime = b.latestBookingTime?.toDate?.() || new Date(0);

            // Sort by most recent booking (newest first)
            return bTime - aTime;
          }

          // If neither have bookings or we've sorted by booking time, sort by status
          const currentStatuses = [
            "not_started",
            "waiting_for_customer",
            "started",
          ];
          const aIsCurrent = currentStatuses.includes(a.status);
          const bIsCurrent = currentStatuses.includes(b.status);

          if (aIsCurrent && !bIsCurrent) return -1;
          if (!aIsCurrent && bIsCurrent) return 1;

          // If both are current or both are not current, sort by ride start date (newest first)
          return new Date(b.startDateTime) - new Date(a.startDateTime);
        });

        setRides(ridesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides. Please try again.");
        setLoading(false);
      }
    };

    // Set up real-time listener for rides
    const ridesRef = collection(db, "rides");
    const q = query(ridesRef, where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      () => {
        // When rides change, fetch rides with bookings info
        fetchRidesWithBookings();
      },
      (err) => {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDeleteRide = async (rideId) => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "rides", rideId));
      setMessage("Ride deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting ride:", error);
      setMessage("Error deleting ride. Please try again.");
    }
    setDeleteLoading(false);
  };

  const currentStatuses = ["not_started", "waiting_for_customer", "started"];
  const previousStatuses = ["finished", "cancelled"];

  const currentRides = rides.filter((ride) =>
    currentStatuses.includes(ride.status)
  );
  const previousRides = rides.filter((ride) =>
    previousStatuses.includes(ride.status)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Car className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Driver Access Required
          </h2>
          <p className="text-black mb-4">
            Please log in as a driver to view your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-black">Loading your rides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">Error</h2>
          <p className="text-black">{error}</p>
        </div>
      </div>
    );
  }

  const RideCard = ({ ride }) => (
    <div
      className={`bg-white rounded-lg shadow-sm border ${
        ride.hasBookings
          ? "border-[#8163e9]/30 bg-[#8163e9]/5"
          : "border-gray-200"
      } overflow-hidden hover:shadow-md transition-shadow min-w-0`}
    >
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[ride.status]
              }`}
            >
              {ride.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                ride.status.slice(1).replace(/_/g, " ")}
            </span>
            {ride.hasBookings && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#8163e9] text-white">
                {ride.bookingsCount}{" "}
                {ride.bookingsCount === 1 ? "booking" : "bookings"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-black">
              <Clock className="h-4 w-4 mr-1 text-[#8163e9]" />
              <span>{formatDateTime(ride.startDateTime)}</span>
            </div>
            <Link href={`/edit-ride/${ride.id}`}>
              <button
                className="p-1 hover:bg-blue-50 rounded-full transition-colors"
                aria-label="Edit ride"
              >
                <Edit className="h-4 w-4 text-blue-500" />
              </button>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteConfirm(ride.id);
              }}
              className="p-1 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Delete ride"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm === ride.id && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm mb-2">
              Are you sure you want to delete this ride?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteRide(ride.id);
                }}
                disabled={deleteLoading}
                className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
              >
                {deleteLoading && deleteConfirm === ride.id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Locations */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium text-black">{ride.pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium text-black">
                {ride.destinationLocation}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">
              {ride.availableSeats} seats available
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">${ride.pricePerSeat} per seat</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/my-rides/${ride.id}`}
          className="inline-flex items-center justify-center w-full bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                Driver Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your rides and track your trips
              </p>
            </div>
          </div>
          <Link
            href="/publish-ride"
            className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Create New Ride
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.includes("success") || message.includes("deleted")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.includes("success") || message.includes("deleted") ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p>{message}</p>
            <button
              onClick={() => setMessage("")}
              className="ml-auto hover:bg-gray-200 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-8">
          {/* Current Rides */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Current Rides
            </h2>
            {currentRides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Current Rides
                </h3>
                <p className="text-gray-500">
                  You don't have any active rides at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                {currentRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            )}
          </section>

          {/* Previous Rides */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Previous Rides
            </h2>
            {previousRides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Previous Rides
                </h3>
                <p className="text-gray-500">
                  Your completed rides will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                {previousRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
