"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  runTransaction,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useParams, useRouter, notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRideBookingEmail } from "@/lib/email-templates";
import {
  MapPin,
  Users,
  DollarSign,
  Car,
  MessageCircle,
  Loader2,
  AlertCircle,
  Wind,
  Wifi,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  X,
  Info,
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

// Helper function to send emails
async function sendEmailNotifications(rideDetails, ownerEmail, passengerEmail) {
  try {
    // Send email to owner
    await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: ownerEmail,
        subject: "New Booking on Your Ride",
        html: getRideBookingEmail(rideDetails, "driver"),
      }),
    });

    // Send email to passenger
    await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: passengerEmail,
        subject: "Your Ride Booking Confirmation",
        html: getRideBookingEmail(rideDetails, "passenger"),
      }),
    });
  } catch (error) {
    console.error("Failed to send email notifications:", error);
  }
}

// Helper function to create or get chat
async function getOrCreateChat(ownerId, riderId) {
  try {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", riderId));
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(ownerId)) {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) {
      return existingChat.id;
    } else {
      const newChatDoc = await addDoc(chatsRef, {
        participants: [ownerId, riderId],
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });
      return newChatDoc.id;
    }
  } catch (error) {
    console.error("Failed to get or create chat:", error);
    return null;
  }
}

// Update the bookSeats function to properly send notifications to the ride owner
async function bookSeats(rideId, riderId, seatsToBook) {
  const rideRef = doc(db, "rides", rideId);
  const bookingsRef = collection(db, "bookings");

  try {
    let rideData;
    let ownerData;
    let passengerData;
    let chatId;
    let bookingId;

    await runTransaction(db, async (transaction) => {
      // Get ride details
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) {
        throw new Error("Ride does not exist");
      }
      rideData = { id: rideId, ...rideDoc.data() };

      // Check if user is the owner of the ride
      if (rideData.ownerId === riderId) {
        throw new Error("You cannot book your own ride");
      }

      // Check seats availability
      const currentSeats = rideData.availableSeats;
      if (currentSeats < seatsToBook) {
        throw new Error("Not enough available seats");
      }

      // Get owner and passenger details
      const [ownerDoc, passengerDoc] = await Promise.all([
        getDoc(doc(db, "users", rideData.ownerId)),
        getDoc(doc(db, "users", riderId)),
      ]);

      if (!ownerDoc.exists() || !passengerDoc.exists()) {
        throw new Error("User details not found");
      }

      ownerData = ownerDoc.data();
      passengerData = passengerDoc.data();

      // Update ride seats
      transaction.update(rideRef, {
        availableSeats: currentSeats - seatsToBook,
        latestBookingTime: serverTimestamp(), // Add this line to store the current time
      });

      // Create booking
      const bookingData = {
        rideId,
        riderId,
        seatsBooked: seatsToBook,
        bookingTime: serverTimestamp(),
        status: "confirmed",
      };

      // We'll add the booking outside the transaction to get the ID
    });

    // Create the booking and get its ID
    const bookingRef = await addDoc(bookingsRef, {
      rideId,
      riderId,
      seatsBooked: seatsToBook,
      bookingTime: serverTimestamp(),
      status: "confirmed",
    });
    bookingId = bookingRef.id;

    // Create or get existing chat
    chatId = await getOrCreateChat(rideData.ownerId, riderId);

    // After successful transaction, send chat message and emails
    // if (chatId) {
    //   // Send system message in chat
    //   const messagesRef = collection(db, "chats", chatId, "messages");
    //   await addDoc(messagesRef, {
    //     text: `Booking confirmed! ${seatsToBook} seat(s) booked from ${
    //       rideData.pickupLocation
    //     } to ${rideData.destinationLocation} on ${new Date(
    //       rideData.startDateTime
    //     ).toLocaleString()}`,
    //     senderId: "system",
    //     createdAt: serverTimestamp(),
    //   });

    //   // Update chat's last message
    //   await updateDoc(doc(db, "chats", chatId), {
    //     lastMessage: "Booking confirmed!",
    //     updatedAt: serverTimestamp(),
    //   });
    // }

    // Send notification to ride owner
    await addDoc(collection(db, "notifications"), {
      userId: rideData.ownerId,
      title: "New Booking",
      message: `${
        passengerData.fullName || "Someone"
      } has booked ${seatsToBook} seat(s) for your ride from ${
        rideData.pickupLocation
      } to ${rideData.destinationLocation}`,
      type: "booking",
      bookingId: bookingId,
      rideId: rideId,
      read: false,
      createdAt: serverTimestamp(),
    });

    // Send notification to rider
    // await addDoc(collection(db, "notifications"), {
    //   userId: riderId,
    //   title: "Booking Confirmed",
    //   message: `Your booking for ${seatsToBook} seat(s) from ${rideData.pickupLocation} to ${rideData.destinationLocation} has been confirmed.`,
    //   type: "booking",
    //   bookingId: bookingId,
    //   rideId: rideId,
    //   read: false,
    //   createdAt: serverTimestamp(),
    // });

    // Send email notifications
    const emailDetails = {
      ...rideData,
      seatsBooked: seatsToBook,
      totalPrice: seatsToBook * rideData.pricePerSeat,
    };
    await sendEmailNotifications(
      emailDetails,
      ownerData.email,
      passengerData.email
    );

    return { success: true, bookingId };
  } catch (error) {
    console.error("Booking failed:", error);
    return { success: false, message: error.message };
  }
}

// Rest of the component remains unchanged
export default function RidePage({ params }) {
  const { rideId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const statuses = [
    { value: "not_started", label: "Not Started" },
    { value: "waiting_for_customer", label: "Waiting for Customer" },
    { value: "started", label: "Started" },
    { value: "finished", label: "Finished" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (!rideId) return;

    const rideRef = doc(db, "rides", rideId);

    const unsubscribe = onSnapshot(
      rideRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const rideData = { id: docSnap.id, ...docSnap.data() };
          setRide(rideData);
          setNewStatus(rideData.status || "not_started");

          // Check if current user is the owner
          if (user && user.uid === rideData.ownerId) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }

          // If user is logged in, check for bookings
          if (user) {
            const bookingsRef = collection(db, "bookings");
            const q = query(
              bookingsRef,
              where("rideId", "==", rideId),
              where("riderId", "==", user.uid),
              where("status", "==", "confirmed")
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              setHasBooked(true);
              setBookingId(querySnapshot.docs[0].id);
              setBookingSeats(querySnapshot.docs[0].data().seatsBooked || 1);
            } else {
              setHasBooked(false);
              setBookingId(null);
            }
          }
        } else {
          notFound();
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
  }, [rideId, user]);

  const handleBookSeats = async () => {
    if (!ride || !user) return;
    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(false);
    setBookingMessage("");

    // Don't allow booking if user is the ride owner
    if (isOwner) {
      setBookingError("You cannot book your own ride.");
      setBookingLoading(false);
      return;
    }

    // Don't allow booking if user already has a booking
    if (hasBooked) {
      setBookingError("You already have an active booking for this ride.");
      setBookingLoading(false);
      return;
    }

    const result = await bookSeats(
      rideId,
      user.uid,
      Number.parseInt(bookingSeats)
    );

    setBookingLoading(false);
    if (result.success) {
      setBookingSuccess(true);
      setHasBooked(true);
      setBookingId(result.bookingId);
      setBookingMessage(
        "Booking successful! You can now chat with the driver."
      );
    } else {
      setBookingError(result.message || "Failed to book seats.");
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId || !user || !ride) return;

    setCancellingBooking(true);
    setBookingError("");
    setBookingMessage("");

    try {
      // Get the booking to find out how many seats to return
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingSnap.data();
      const seatsToReturn = bookingData.seatsBooked || 1;

      // Update the booking status to cancelled
      await updateDoc(bookingRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });

      // Return the seats to the ride
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        availableSeats: ride.availableSeats + seatsToReturn,
      });

      // Create notification for ride owner
      await addDoc(collection(db, "notifications"), {
        userId: ride.ownerId,
        title: "Booking Cancelled",
        message: `A booking for ${seatsToReturn} seat(s) on your ride from ${ride.pickupLocation} to ${ride.destinationLocation} has been cancelled.`,
        type: "cancellation",
        rideId: rideId,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Update local state
      setHasBooked(false);
      setBookingId(null);
      setBookingMessage("Your booking has been cancelled successfully.");

      // Refresh ride data
      const updatedRideSnap = await getDoc(rideRef);
      if (updatedRideSnap.exists()) {
        setRide({ id: updatedRideSnap.id, ...updatedRideSnap.data() });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setBookingError("Failed to cancel booking: " + error.message);
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!ride) return;
    setUpdating(true);
    setError("");
    try {
      // Update the ride status
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Fetch all bookings for this ride to notify riders
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("rideId", "==", rideId));
      const bookingsSnapshot = await getDocs(q);

      // Create notifications for each rider who booked this ride
      const notificationPromises = [];
      bookingsSnapshot.forEach((bookingDoc) => {
        const booking = bookingDoc.data();
        // Only send notification if the rider is not the owner
        if (user && booking.riderId !== user.uid) {
          const notification = {
            userId: booking.riderId,
            title: `Ride Status Updated: ${
              newStatus.charAt(0).toUpperCase() +
              newStatus.slice(1).replace(/_/g, " ")
            }`,
            message: `Your ride from ${ride.pickupLocation} to ${
              ride.destinationLocation
            } has been updated. The ride has ${newStatus.replace(/_/g, " ")}.`,
            rideId: rideId,
            read: false,
            createdAt: serverTimestamp(),
          };

          notificationPromises.push(
            addDoc(collection(db, "notifications"), notification)
          );
        }
      });

      // Wait for all notifications to be sent
      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

      setUpdating(false);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
      setUpdating(false);
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

  // Check if ride has ended
  const isRideEnded = ride && ["finished", "cancelled"].includes(ride.status);

  // Check if current date is past the end date
  const isRideExpired = ride && new Date() > new Date(ride.endDateTime);

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

        {isOwner && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <p className="text-blue-800">
              You are the owner of this ride. You can update the ride status
              below.
            </p>
          </div>
        )}

        {(isRideEnded || isRideExpired) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
            <p className="text-yellow-800">
              This ride has {isRideEnded ? "ended" : "expired"} and is no longer
              available for booking.
            </p>
          </div>
        )}

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
                  <p className="font-medium text-black">${ride.pricePerSeat}</p>
                </div>
              </div>
              {ride.tollsIncluded && (
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-[#8163e9]" />
                  <div>
                    <p className="text-sm text-gray-500">Toll Price</p>
                    <p className="font-medium text-black">${ride.tollPrice}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-4">
              {ride.airConditioning && (
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                  <Wind className="h-4 w-4 text-[#8163e9]" />
                  <span className="text-sm text-black">AC Available</span>
                </div>
              )}
              {ride.wifiAvailable && (
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                  <Wifi className="h-4 w-4 text-[#8163e9]" />
                  <span className="text-sm text-black">WiFi Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section (visible only to the driver) */}
          {isOwner ? (
            <div className="border-t p-6 bg-gray-50">
              <h2 className="text-lg font-semibold text-black mb-4">
                Update Ride Status
              </h2>
              <div className="space-y-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors text-black bg-white"
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
          ) : (
            user &&
            !isRideEnded &&
            !isRideExpired && (
              <div className="border-t p-6 bg-gray-50">
                <h2 className="text-lg font-semibold text-black mb-4">
                  {hasBooked ? "Manage Your Booking" : "Book Seats"}
                </h2>

                {bookingMessage && (
                  <div
                    className={`mb-4 p-3 rounded-md ${
                      bookingMessage.includes("cancelled")
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {bookingMessage}
                  </div>
                )}

                {bookingError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                    {bookingError}
                  </div>
                )}

                {hasBooked ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
                          <p className="text-blue-800">
                            You have booked {bookingSeats} seat(s) for this ride
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCancelBooking}
                      disabled={cancellingBooking}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingBooking ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 mr-2" />
                          Cancel Booking
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        getOrCreateChat(ride.ownerId, user.uid).then(
                          (chatId) => {
                            if (chatId) router.push(`/chat/${chatId}`);
                          }
                        )
                      }
                      className="w-full bg-[#8163e9] text-white py-3 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Chat with Driver
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={ride.availableSeats}
                        value={bookingSeats}
                        onChange={(e) =>
                          setBookingSeats(parseInt(e.target.value) || 1)
                        }
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors text-black bg-white"
                        placeholder="Number of seats"
                      />
                      <button
                        onClick={handleBookSeats}
                        disabled={bookingLoading || ride.availableSeats === 0}
                        className="bg-[#8163e9] text-white py-3 px-6 rounded-lg hover:bg-[#8163e9]/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Booking...
                          </>
                        ) : (
                          "Book Seats"
                        )}
                      </button>
                    </div>
                    {ride.availableSeats === 0 && (
                      <div className="text-red-500 text-sm">
                        No seats available.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
