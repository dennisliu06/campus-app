"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Wifi,
  Wind,
  DollarSign,
  Car,
  ChevronLeft,
} from "lucide-react";

const statusColors = {
  not_started: "bg-yellow-100 text-black",
  waiting_for_customer: "bg-blue-100 text-black",
  started: "bg-green-100 text-black",
  finished: "bg-gray-100 text-black",
  cancelled: "bg-red-100 text-black",
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case "not_started":
      return <Clock className="h-5 w-5 text-black" />;
    case "waiting_for_customer":
      return <User className="h-5 w-5 text-black" />;
    case "started":
      return <CheckCircle2 className="h-5 w-5 text-black" />;
    case "finished":
      return <CheckCircle2 className="h-5 w-5 text-black" />;
    case "cancelled":
      return <XCircle className="h-5 w-5 text-black" />;
    default:
      return <AlertCircle className="h-5 w-5 text-black" />;
  }
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

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("riderId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetchedBookings = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const bookingData = { id: docSnap.id, ...docSnap.data() };
            try {
              const rideDoc = await getDoc(
                doc(db, "rides", bookingData.rideId)
              );
              if (rideDoc.exists() && bookingData.status == "confirmed") {
                console.log(
                  "confirmed",
                  rideDoc.data(),
                  "booking data",
                  bookingData
                );

                return { ...bookingData, ride: rideDoc.data() };
              } else {
                return { ...bookingData, ride: null };
              }
            } catch (err) {
              console.error(
                "Error fetching ride for booking",
                bookingData.id,
                err
              );
              return { ...bookingData, ride: null };
            }
          })
        );
        setBookings(fetchedBookings);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Authentication Required
          </h2>
          <p className="text-black mb-4">
            Please log in to view your bookings.
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
          <p className="text-black">Loading your bookings...</p>
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

  const currentDate = new Date();
  const previousBookings = bookings.filter(
    (booking) =>
      booking.ride &&
      (["finished", "cancelled"].includes(booking.ride.status) ||
        new Date(booking.ride.endDateTime) < currentDate)
  );

  const currentBookings = bookings.filter(
    (booking) =>
      booking.ride &&
      ["not_started", "waiting_for_customer", "started"].includes(
        booking.ride.status
      ) &&
      new Date(booking.ride.endDateTime) >= currentDate
  );

  console.log("bookings", bookings);
  const BookingCard = ({ booking, type }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <StatusIcon status={booking.ride.status} />
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[booking.ride.status]
              }`}
            >
              {booking.ride.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                booking.ride.status.slice(1).replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex items-center text-sm text-black">
            <Calendar className="h-4 w-4 mr-1 text-black" />
            {booking.bookingTime
              ? new Date(
                  booking.bookingTime.seconds * 1000
                ).toLocaleDateString()
              : "N/A"}
          </div>
        </div>

        <div className="space-y-4">
          {/* Locations */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-black">From</p>
                <p className="font-medium text-black">
                  {booking.ride.pickupLocation}
                </p>
                <p className="text-sm text-black">
                  {formatDateTime(booking.ride.startDateTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-black">To</p>
                <p className="font-medium text-black">
                  {booking.ride.destinationLocation}
                </p>
                <p className="text-sm text-black">
                  {formatDateTime(booking.ride.endDateTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="border-t border-b py-3 space-y-2">
            <div className="flex items-center justify-between text-black">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-[#8163e9]" />
                <span>Seats Booked</span>
              </div>
              <span className="font-medium">{booking.seatsBooked}</span>
            </div>
            <div className="flex items-center justify-between text-black">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-[#8163e9]" />
                <span>Price per Seat</span>
              </div>
              <span className="font-medium">${booking.ride.pricePerSeat}</span>
            </div>
            {booking.ride.tollsIncluded && (
              <div className="flex items-center justify-between text-black">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-[#8163e9]" />
                  <span>Toll Price</span>
                </div>
                <span className="font-medium">${booking.ride.tollPrice}</span>
              </div>
            )}
          </div>

          <Link
            href={`/home/rides/${booking.rideId}`}
            className={`mt-4 inline-flex items-center justify-center w-full px-4 py-2 rounded-lg
              ${
                type === "current"
                  ? "bg-[#8163e9] text-white hover:bg-[#8163e9]/90"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              } transition-colors`}
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center text-gray-600"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8">
          My Bookings
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Current Bookings
            </h2>
            {currentBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-black">No current bookings</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {currentBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    type="current"
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Previous Bookings
            </h2>
            {previousBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-black">No previous bookings</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {previousBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    type="previous"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
