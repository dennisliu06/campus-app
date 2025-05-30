"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";

const statusColors = {
  pending: "bg-yellow-100 text-black",
  accepted: "bg-green-100 text-black",
  rejected: "bg-red-100 text-black",
  cancelled: "bg-gray-100 text-black",
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

export default function MyRequestedRides() {
  const router = useRouter();
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState([]);
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

    const rideRequestsRef = collection(db, "rideRequests");
    const q = query(rideRequestsRef, where("requesterId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });

        // Sort by creation date (newest first)
        requests.sort((a, b) => {
          return b.createdAt?.seconds - a.createdAt?.seconds;
        });

        setRideRequests(requests);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching ride requests:", err);
        setError("Failed to load ride requests. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCancelRequest = async (requestId) => {
    setDeleteLoading(true);
    try {
      // Update the ride request status to cancelled
      await updateDoc(doc(db, "rideRequests", requestId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      setMessage("Ride request cancelled successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error cancelling ride request:", error);
      setMessage("Error cancelling ride request. Please try again.");
    }
    setDeleteLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Authentication Required
          </h2>
          <p className="text-black mb-4">
            Please log in to view your requested rides.
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
          <p className="text-black">Loading your ride requests...</p>
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

  const pendingRequests = rideRequests.filter(
    (request) => request.status === "pending"
  );
  const otherRequests = rideRequests.filter(
    (request) => request.status !== "pending"
  );

  const RideRequestCard = ({ request }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[request.status]
              }`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-black">
              <Calendar className="h-4 w-4 mr-1 text-[#8163e9]" />
              <span>{formatDateTime(request.startDateTime)}</span>
            </div>
            {request.status === "pending" && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteConfirm(request.id);
                }}
                className="p-1 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Cancel request"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm === request.id && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm mb-2">
              Are you sure you want to cancel this ride request?
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
                No
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelRequest(request.id);
                }}
                disabled={deleteLoading}
                className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
              >
                {deleteLoading && deleteConfirm === request.id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Yes, Cancel
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
              <p className="font-medium text-black">{request.pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium text-black">
                {request.destinationLocation}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">
              {request.passengers} passenger{request.passengers > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">${request.pricePerSeat} per seat</span>
          </div>
        </div>

        {/* Driver info if accepted */}
        {request.status === "accepted" && request.driverInfo && (
          <div className="p-3 bg-green-50 rounded-lg mb-4">
            <p className="font-medium text-green-800">
              Accepted by: {request.driverInfo.name}
            </p>
            {request.rideId && (
              <p className="text-sm text-green-700 mt-1">
                View details in your{" "}
                <Link href="/bookings" className="underline">
                  bookings
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <Link
          href={`/ride-request/${request.id}`}
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              My Requested Rides
            </h1>
            <p className="text-gray-500 mt-1">Manage your ride requests</p>
          </div>
          <Link
            href="/request-ride"
            className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Request New Ride
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.includes("success") || message.includes("cancelled")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.includes("success") || message.includes("cancelled") ? (
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
          {/* Pending Requests */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Pending Requests
            </h2>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-500">
                  You don't have any pending ride requests.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                {pendingRequests.map((request) => (
                  <RideRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </section>

          {/* Other Requests */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Past Requests
            </h2>
            {otherRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Past Requests
                </h3>
                <p className="text-gray-500">
                  Your past ride requests will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                {otherRequests.map((request) => (
                  <RideRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
