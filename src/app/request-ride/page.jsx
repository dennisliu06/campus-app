"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const RequestRide = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [passengers, setPassengers] = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);

  // For Destination Location
  const [destinationLocation, setDestinationLocation] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  // Fetch user profile to get university
  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("user", user, user.uid);
      if (!user) {
        setLoading(false);
        return;
      }
      console.log("Fetching profile for user:", user.uid);

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        console.log("user doc ", userDoc, user.empty);

        if (userDoc.exists()) {
          setUserProfile({ id: userDoc.id, ...userDoc.data() });
        } else {
          console.log("No profile found, redirecting to profile creation.");
          router.push("/profileform");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setMessage("Error loading user profile. Please try again.");
      }

      setLoading(false);
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user, router]);

  // Set up click outside listeners for suggestion dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".pickup-suggestions")) {
        setShowPickupSuggestions(false);
      }
      if (!event.target.closest(".destination-suggestions")) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!pickupLocation || !destinationLocation) {
      setMessage("Please fill in both pickup and destination locations.");
      return;
    }
    if (!startDateTime) {
      setMessage("Please select Start  date and time for the ride.");
      return;
    }
    if (!endDateTime) {
      setMessage("Please select end date and time for the ride.");
      return;
    }

    const numPassengers = Number(passengers);
    const price = Number(pricePerSeat);

    if (!userProfile?.university) {
      setMessage("You need to set your university in your profile first.");
      return;
    }

    setSubmitting(true);
    try {
      // Create the ride request
      const rideRequestData = {
        requesterId: user.uid,
        requesterName: userProfile.fullName || "Anonymous",
        requesterUniversity: userProfile.university,
        passengers: numPassengers,
        pricePerSeat: price,
        pickupLocation,
        pickupCity,
        destinationLocation,
        destinationCity,
        startDateTime,
        endDateTime,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "rideRequests"),
        rideRequestData
      );

      // Find eligible drivers (same university and has cars)
      console.log(
        "userProfile.university .............",
        userProfile.university
      );
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("university", "==", userProfile.university)
      );

      const usersSnapshot = await getDocs(usersQuery);
      console.log("usersSnapshot ..........", usersSnapshot);
      const eligibleUserIds = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        // Skip the requester
        if (userData.uid === auth.currentUser.uid) continue;
        console.log("userData in map lllllllllll", userData, userData.uid);
        // Check if user has cars
        const carsRef = collection(db, "cars");
        const carsQuery = query(carsRef, where("ownerId", "==", userData.uid));
        const carsSnapshot = await getDocs(carsQuery);

        if (!carsSnapshot.empty) {
          eligibleUserIds.push(userData.uid);
        }
      }

      // Send notifications to eligible drivers
      const notificationsRef = collection(db, "notifications");
      const notificationPromises = eligibleUserIds.map((userId) =>
        addDoc(notificationsRef, {
          userId,
          title: "New Ride Request",
          message: `Someone from your university is looking for a ride from ${
            pickupCity || pickupLocation
          } to ${destinationCity || destinationLocation}`,
          type: "rideRequest",
          rideRequestId: docRef.id,
          read: false,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(notificationPromises);

      setMessage("Ride request published successfully!");

      // Reset form fields
      setPassengers(1);
      setPricePerSeat("");
      setPickupLocation("");
      setPickupCity("");
      setDestinationLocation("");
      setDestinationCity("");
      setStartDateTime("");
      setEndDateTime("");

      // Redirect to my requested rides page
      setTimeout(() => {
        router.push("/my-requested-rides");
      }, 1500);
    } catch (error) {
      console.error("Error publishing ride request:", error);
      setMessage("Error publishing ride request. Please try again.");
    }
    setSubmitting(false);
  };

  const fetchPickupSuggestions = async (input) => {
    if (!input) return setPickupSuggestions([]);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
      );
      const data = await response.json();
      const suggestions = data.features.map((feature) => ({
        formatted: feature.properties.formatted,
        city: feature.properties.city || "",
      }));
      setPickupSuggestions(suggestions);
      setShowPickupSuggestions(true);
    } catch (error) {
      console.error("Error fetching pickup suggestions:", error);
    }
  };

  const fetchDestinationSuggestions = async (input) => {
    if (!input) return setDestinationSuggestions([]);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
      );
      const data = await response.json();
      const suggestions = data.features.map((feature) => ({
        formatted: feature.properties.formatted,
        city: feature.properties.city || "",
      }));
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
    } catch (error) {
      console.error("Error fetching destination suggestions:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Authentication Required
          </h2>
          <p className="text-black mb-4">Please log in to request a ride.</p>
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

  console.log("user profile ", userProfile, userProfile.university);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <div
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Request a Ride
            </h1>
            <p className="text-gray-500 mt-1">Find drivers heading your way</p>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6">
            <div className="flex items-center justify-center">
              <Users className="h-8 w-8 text-white mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Ride Request Details
              </h2>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {message && (
              <div
                className={`mb-6 text-center p-4 rounded-lg ${
                  message.includes("success")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Pickup Location with Autocomplete */}
                <div className="col-span-2 relative pickup-suggestions">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => {
                      setPickupLocation(e.target.value);
                      fetchPickupSuggestions(e.target.value);
                    }}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  />
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                      {pickupSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setPickupLocation(suggestion.formatted);
                            setPickupCity(suggestion.city);
                            setShowPickupSuggestions(false);
                          }}
                          className="p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion.formatted}
                          {suggestion.city && (
                            <span className="block text-xs text-gray-500 mt-1">
                              City: {suggestion.city}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Destination Location with Autocomplete */}
                <div className="col-span-2 relative destination-suggestions">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Destination Location
                  </label>
                  <input
                    type="text"
                    value={destinationLocation}
                    onChange={(e) => {
                      setDestinationLocation(e.target.value);
                      fetchDestinationSuggestions(e.target.value);
                    }}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  />
                  {showDestinationSuggestions &&
                    destinationSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                        {destinationSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setDestinationLocation(suggestion.formatted);
                              setDestinationCity(suggestion.city);
                              setShowDestinationSuggestions(false);
                            }}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                          >
                            {suggestion.formatted}
                            {suggestion.city && (
                              <span className="block text-xs text-gray-500 mt-1">
                                City: {suggestion.city}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                {/* Number of Passengers */}
                <div>
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Users className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Number of Passengers
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  >
                    {[
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                      18, 19, 20, 21, 22, 23, 24, 25,
                    ].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Per Seat */}
                <div>
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <DollarSign className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Price Per Seat ($)
                  </label>
                  <input
                    type="number"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Start Date & Time */}
                <div className="col-span-2">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-[#8163e9]" />
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Requesting Ride...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Request Ride
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestRide;
