"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  MapPin,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  MessageSquare,
  CheckCircle,
  X,
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

export default function RideRequestDetails() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [requesterProfile, setRequesterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRequester, setIsRequester] = useState(false);
  const [userCars, setUserCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState("");

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId || !user) {
        setLoading(false);
        return;
      }

      try {
        const requestDoc = await getDoc(doc(db, "rideRequests", requestId));

        if (!requestDoc.exists()) {
          setError("Ride request not found");
          setLoading(false);
          return;
        }

        const requestData = { id: requestDoc.id, ...requestDoc.data() };
        setRequest(requestData);

        // Check if current user is the requester
        setIsRequester(requestData.requesterId === user.uid);

        // Fetch requester profile
        const requesterDoc = await getDoc(
          doc(db, "users", requestData.requesterId)
        );
        if (requesterDoc.exists()) {
          setRequesterProfile(requesterDoc.data());
        }

        // If user is not the requester, fetch their cars
        if (requestData.requesterId !== user.uid) {
          const carsSnapshot = await getDocs(
            query(collection(db, "cars"), where("ownerId", "==", user.uid))
          );

          const cars = [];
          carsSnapshot.forEach((doc) => {
            cars.push({ id: doc.id, ...doc.data() });
          });

          setUserCars(cars);
          if (cars.length > 0) {
            setSelectedCarId(cars[0].id);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching ride request:", err);
        setError("Failed to load ride request details.");
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId, user]);

  const handleAcceptRequest = async () => {
    if (!user || !request || !selectedCarId) return;

    setActionLoading(true);
    setMessage("");

    try {
      // Get user profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data();

      // Get car details
      const carDoc = await getDoc(doc(db, "cars", selectedCarId));
      if (!carDoc.exists()) {
        throw new Error("Selected car not found");
      }

      const carData = carDoc.data();

      // Create a new ride
      const rideData = {
        ownerId: user.uid,
        carId: selectedCarId,
        availableSeats: carData.maxCapacity - request.passengers,
        pricePerSeat: request.pricePerSeat,
        pickupLocation: request.pickupLocation,
        pickupCity: request.pickupCity,
        destinationLocation: request.destinationLocation,
        destinationCity: request.destinationCity,
        startDateTime: request.startDateTime,
        endDateTime: new Date(
          new Date(request.startDateTime).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(), // Add 2 hours
        status: "not_started",
        createdAt: serverTimestamp(),
        fromRideRequest: true,
        rideRequestId: requestId,
      };

      const rideRef = await addDoc(collection(db, "rides"), rideData);

      // Create a booking for the requester
      const bookingData = {
        rideId: rideRef.id,
        riderId: request.requesterId,
        seatsBooked: request.passengers,
        bookingTime: serverTimestamp(),
        status: "confirmed",
      };

      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // Update the ride request
      await updateDoc(doc(db, "rideRequests", requestId), {
        status: "accepted",
        acceptedBy: user.uid,
        acceptedAt: serverTimestamp(),
        driverInfo: {
          name: userData.fullName || "Driver",
          profilePic: userData.profilePicURL || null,
        },
        rideId: rideRef.id,
        bookingId: bookingRef.id,
      });

      // Create a notification for the requester
      await addDoc(collection(db, "notifications"), {
        userId: request.requesterId,
        title: "Ride Request Accepted",
        message: `Your ride request from ${
          request.pickupCity || request.pickupLocation
        } to ${
          request.destinationCity || request.destinationLocation
        } has been accepted.`,
        type: "rideRequestAccepted",
        rideId: rideRef.id,
        bookingId: bookingRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Create or get chat between driver and requester
      const chatId = await getOrCreateChat(user.uid, request.requesterId);

      // Add system message to chat
      if (chatId) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: `Ride request accepted! ${
            request.passengers
          } seat(s) booked from ${request.pickupLocation} to ${
            request.destinationLocation
          } on ${formatDateTime(request.startDateTime)}`,
          senderId: "system",
          createdAt: serverTimestamp(),
          seen: false,
        });
      }

      setMessage("Ride request accepted successfully!");

      setTimeout(() => {
        router.push(`/my-rides/${rideRef.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error accepting ride request:", error);
      setMessage("Error accepting ride request: " + error.message);
    }

    setActionLoading(false);
  };

  const handleRejectRequest = async () => {
    if (!user || !request) return;

    setActionLoading(true);
    setMessage("");

    try {
      // Update the ride request for this user only
      // We'll use a subcollection to track which users have rejected this request
      await addDoc(collection(db, "rideRequests", requestId, "rejections"), {
        userId: user.uid,
        rejectedAt: serverTimestamp(),
      });

      setMessage("Ride request rejected. You won't see this request anymore.");

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/available-requests");
      }, 1500);
    } catch (error) {
      console.error("Error rejecting ride request:", error);
      setMessage("Error rejecting ride request: " + error.message);
    }

    setActionLoading(false);
  };

  // Helper function to create or get chat
  const getOrCreateChat = async (driverId, riderId) => {
    try {
      // Check if a chat already exists between driver and rider
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", driverId)
      );
      const querySnapshot = await getDocs(q);

      let existingChat = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(riderId)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        return existingChat.id;
      } else {
        // Create a new chat
        const newChatRef = await addDoc(chatsRef, {
          participants: [driverId, riderId],
          lastMessage: "",
          updatedAt: serverTimestamp(),
          unreadCount: {
            [driverId]: 0,
            [riderId]: 0,
          },
        });

        return newChatRef.id;
      }
    } catch (error) {
      console.error("Failed to get or create chat:", error);
      return null;
    }
  };

  const handleChatWithRequester = async () => {
    if (!user || !request) return;

    try {
      const chatId = await getOrCreateChat(user.uid, request.requesterId);
      if (chatId) {
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      setMessage("Error creating chat: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
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
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center text-[#8163e9] hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Ride Request Not Found
          </h2>
          <p className="text-black mb-4">
            This ride request doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-[#8163e9] hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Ride Request Details
            </h1>
            <span
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[request.status]
              }`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Main Details */}
          <div className="p-6 space-y-6">
            {/* Requester Info */}
            {!isRequester && requesterProfile && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="w-12 h-12 rounded-full bg-[#8163e9]/10 flex items-center justify-center">
                  {requesterProfile.profilePicURL ? (
                    <img
                      src={requesterProfile.profilePicURL || "/placeholder.svg"}
                      alt={requesterProfile.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-[#8163e9]" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-black">
                    {requesterProfile.fullName || "Anonymous"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {requesterProfile.university || "University not specified"}
                  </p>
                </div>
                {request.status === "pending" && (
                  <button
                    onClick={handleChatWithRequester}
                    className="ml-auto bg-[#8163e9] text-white p-2 rounded-full hover:bg-[#8163e9]/90 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Locations */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-medium text-black">
                    {request.pickupLocation}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium text-black">
                    {request.destinationLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-[#8163e9] mt-1" />
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-black">
                  {formatDateTime(request.startDateTime)}
                </p>
              </div>
            </div>

            {/* Ride Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-[#8163e9]" />
                <div>
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="font-medium text-black">{request.passengers}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-[#8163e9]" />
                <div>
                  <p className="text-sm text-gray-500">Price per Seat</p>
                  <p className="font-medium text-black">
                    ${request.pricePerSeat}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver info if accepted */}
            {request.status === "accepted" && request.driverInfo && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Accepted by: {request.driverInfo.name}
                </h3>
                {request.rideId && (
                  <Link
                    href={`/rides/${request.rideId}`}
                    className="text-[#8163e9] hover:underline flex items-center"
                  >
                    View Ride Details
                    <ChevronLeft className="h-4 w-4 ml-1 transform rotate-180" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons for Drivers */}
          {!isRequester && request.status === "pending" && (
            <div className="border-t p-6 bg-gray-50">
              <h2 className="text-lg font-semibold text-black mb-4">
                Accept This Request
              </h2>

              {userCars.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Your Car
                    </label>
                    <select
                      value={selectedCarId}
                      onChange={(e) => setSelectedCarId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors text-black bg-white"
                      required
                    >
                      {userCars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.carName} {car.carNumber} {car.model} -{" "}
                          {car.maxCapacity} seats
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleRejectRequest}
                      disabled={actionLoading}
                      className="flex-1 border border-red-500 text-red-500 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <X className="h-5 w-5 mr-2" />
                          Reject
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="flex-1 bg-[#8163e9] text-white py-3 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Accept
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  <p>
                    You need to add a car before you can accept ride requests.
                  </p>
                  <Link
                    href="/my-cars"
                    className="text-[#8163e9] hover:underline mt-2 inline-block"
                  >
                    Add a Car
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
