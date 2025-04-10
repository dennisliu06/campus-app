"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  MapPin,
  Users,
  DollarSign,
  Car,
  Loader2,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  User,
  CreditCard,
  Bell,
  MessageSquare,
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

export default function RideDetailsPage() {
  const { rideId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [totalSeatsBooked, setTotalSeatsBooked] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chatLoading, setChatLoading] = useState({});

  const statuses = [
    { value: "not_started", label: "Not Started" },
    { value: "waiting_for_customer", label: "Waiting for Customer" },
    { value: "started", label: "Started" },
    { value: "finished", label: "Finished" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Fetch ride details
  useEffect(() => {
    if (!rideId) return;
    const rideRef = doc(db, "rides", rideId);
    const unsubscribe = onSnapshot(
      rideRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rideData = { id: docSnap.id, ...docSnap.data() };
          setRide(rideData);
          setNewStatus(rideData.status || "not_started");
        } else {
          router.push("/404");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching ride:", err);
        setError("Failed to load ride details.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [rideId, router]);

  // Fetch bookings for this ride
  useEffect(() => {
    if (!rideId) return;

    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, where("rideId", "==", rideId));
        const querySnapshot = await getDocs(q);

        const bookingsData = [];
        let seats = 0;
        let revenue = 0;

        querySnapshot.forEach((doc) => {
          const booking = { id: doc.id, ...doc.data() };
          bookingsData.push(booking);
          console.log("booking booking", booking);
          // Calculate total seats and revenue
          if (booking.status === "confirmed") {
            seats += booking.seatsBooked || 0;
            revenue += (booking.seatsBooked || 0) * (ride?.pricePerSeat || 0);
          }
        });

        setBookings(bookingsData);
        setTotalSeatsBooked(seats);
        setTotalRevenue(revenue);

        // Fetch rider details for each booking
        const riderIds = bookingsData.map((booking) => booking.riderId);
        const uniqueRiderIds = [...new Set(riderIds)];

        const ridersData = await Promise.all(
          uniqueRiderIds.map(async (riderId) => {
            const userDoc = await getDoc(doc(db, "users", riderId));
            if (userDoc.exists()) {
              return { id: riderId, ...userDoc.data() };
            }
            return { id: riderId, fullName: "Unknown User" };
          })
        );

        setRiders(ridersData);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load booking details.");
      }
    };

    if (ride) {
      fetchBookings();
    }
  }, [rideId, ride]);

  // Send notification to all riders when status changes
  const sendNotificationToRiders = async (newStatus) => {
    try {
      const statusMessage = {
        not_started: "The ride is scheduled but not started yet.",
        waiting_for_customer: "The driver is waiting for passengers.",
        started: "The ride has started.",
        finished: "The ride has been completed.",
        cancelled: "The ride has been cancelled.",
      };

      // For each rider, create a notification
      for (const booking of bookings) {
        if (booking.riderId) {
          if (booking.rideId === rideId && booking.status === "active") {
            await addDoc(collection(db, "notifications"), {
              userId: booking.riderId,
              title: `Ride Status Updated: ${
                newStatus.replace(/_/g, " ").charAt(0).toUpperCase() +
                newStatus.slice(1).replace(/_/g, " ")
              }`,
              message: `Your ride from ${ride.pickupLocation} to ${ride.destinationLocation} has been updated. ${statusMessage[newStatus]}`,
              read: false,
              createdAt: serverTimestamp(),
              rideId: rideId,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error sending notifications:", err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!ride) return;
    setUpdating(true);
    try {
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Send notifications to all riders about the status change
      await sendNotificationToRiders(newStatus);

      setUpdating(false);
      // router.push("/my-rides");
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
      setUpdating(false);
    }
  };

  // Function to create or get existing chat with a rider
  const handleChatWithRider = async (riderId) => {
    if (!user || !riderId) return;

    // Set loading state for this specific rider
    setChatLoading((prev) => ({ ...prev, [riderId]: true }));

    try {
      // Check if a chat already exists between owner and rider
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);

      let existingChatId = null;

      // Look through all chats to find one with this rider
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(riderId)) {
          existingChatId = doc.id;
        }
      });

      // If chat exists, navigate to it
      if (existingChatId) {
        router.push(`/chat/${existingChatId}`);
        return;
      }

      // If no chat exists, create a new one
      const newChatRef = await addDoc(chatsRef, {
        participants: [user.uid, riderId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "",
        unreadCount: {
          [user.uid]: 0,
          [riderId]: 0,
        },
      });

      // Add a system message to the new chat
      const messagesRef = collection(db, "chats", newChatRef.id, "messages");
      await addDoc(messagesRef, {
        text: `Chat started for ride from ${ride.pickupLocation} to ${ride.destinationLocation}`,
        senderId: "system",
        createdAt: serverTimestamp(),
        seen: false,
      });

      // Navigate to the new chat
      router.push(`/chat/${newChatRef.id}`);
    } catch (error) {
      console.error("Error creating or finding chat:", error);
    } finally {
      setChatLoading((prev) => ({ ...prev, [riderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-black">Loading ride details...</p>
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

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Ride Not Found
          </h2>
          <p className="text-black mb-4">
            This ride doesn't exist or has been removed.
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
      <div className="max-w-4xl mx-auto">
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
              Ride Details
            </h1>
            <span
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[ride.status]
              }`}
            >
              {ride.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                ride.status.slice(1).replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ride Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Main Details */}
              <div className="p-6 space-y-6">
                {/* Locations */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Pickup Location</p>
                      <p className="font-medium text-black">
                        {ride.pickupLocation}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(ride.startDateTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium text-black">
                        {ride.destinationLocation}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(ride.endDateTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ride Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-[#8163e9]" />
                    <div>
                      <p className="text-sm text-gray-500">Available Seats</p>
                      <p className="font-medium text-black">
                        {ride.availableSeats}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-[#8163e9]" />
                    <div>
                      <p className="text-sm text-gray-500">Price per Seat</p>
                      <p className="font-medium text-black">
                        ${ride.pricePerSeat}
                      </p>
                    </div>
                  </div>
                  {ride.tollsIncluded && (
                    <div className="flex items-center space-x-3">
                      <Car className="h-5 w-5 text-[#8163e9]" />
                      <div>
                        <p className="text-sm text-gray-500">Toll Price</p>
                        <p className="font-medium text-black">
                          ${ride.tollPrice}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Section (visible only to the driver) */}
              {user && ride.ownerId === user.uid && (
                <div className="border-t p-6 bg-gray-50">
                  <h2 className="text-lg font-semibold text-black mb-4">
                    Update Ride Status
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Bell className="h-4 w-4" />
                      <span>
                        All riders will be notified when you update the status
                      </span>
                    </div>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#8163e9] focus:border-transparent transition-colors text-black bg-white"
                    >
                      {statuses.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                          className="text-black"
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updating}
                      className="w-full bg-[#8163e9] text-white py-3 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Update Status
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary (visible only to the driver) */}
          {user && ride.ownerId === user.uid && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">
                    Booking Summary
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-[#8163e9] mr-2" />
                        <span className="text-black">Seats Booked</span>
                      </div>
                      <span className="font-semibold text-black">
                        {totalSeatsBooked}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-[#8163e9] mr-2" />
                        <span className="text-black">Total Revenue</span>
                      </div>
                      <span className="font-semibold text-black">
                        ${totalRevenue}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-black mb-3">
                      Riders ({riders.length})
                    </h3>

                    {riders.length === 0 ? (
                      <p className="text-gray-500 text-sm">No riders yet</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {riders.map((rider) => (
                          <div
                            key={rider.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                {rider.profilePicURL ? (
                                  <Image
                                    src={
                                      rider.profilePicURL || "/placeholder.svg"
                                    }
                                    alt={rider.fullName || "Rider"}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <User className="w-full h-full p-2 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black truncate">
                                  {rider.fullName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {rider.university || rider.location || ""}
                                </p>
                              </div>
                            </div>

                            {/* Chat button */}
                            <button
                              onClick={() => handleChatWithRider(rider.id)}
                              disabled={chatLoading[rider.id]}
                              className="ml-2 p-2 bg-[#8163e9] text-white rounded-full hover:bg-[#8163e9]/90 transition-colors"
                              title="Chat with rider"
                            >
                              {chatLoading[rider.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
