"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Car,
  Search,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  getDoc,
  doc,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Improved city extraction function
const extractCity = (address) => {
  if (!address) return "";

  // Split the address by commas and clean up whitespace
  const parts = address.split(",").map((part) => part.trim());

  // Try to find a city part - usually the second-to-last or third-to-last part
  for (let i = 1; i < parts.length; i++) {
    const part = parts[parts.length - i];
    // Skip parts that are likely postal codes or country names
    if (part && isNaN(part) && part.length > 2) {
      return part;
    }
  }

  // Fallback to the original method
  return parts[parts.length > 2 ? parts.length - 2 : parts.length - 1];
};

export default function Home() {
  const router = useRouter();
  const [searchForm, setSearchForm] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  // Autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [pickupCity, setPickupCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [disable, setDisable] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const pickupSuggestionsRef = useRef(null);
  const destinationSuggestionsRef = useRef(null);

  // Modify the fetchPickupSuggestions function to also fetch rides when a location is selected
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

  // Add a new function to handle when a pickup location is selected
  const handlePickupLocationSelected = (suggestion) => {
    setSearchForm({
      ...searchForm,
      from: suggestion.formatted,
    });
    setPickupCity(suggestion.city);
    setShowPickupSuggestions(false);

    // Fetch rides for the selected location if it has a city
    if (suggestion.formatted) {
      const locationToUse = suggestion.formatted;
      fetchRidesForLocation(locationToUse);
    }
  };

  // Modify the fetchProfile function to not automatically call fetchRidesForLocation
  const fetchProfile = async () => {
    if (authLoading) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user found. Exiting...");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));

      if (userDoc.exists()) {
        const userProfile = { id: userDoc.id, ...userDoc.data() };
        setProfile(userProfile);

        // Fetch rides from users at the same university
        if (userProfile.university) {
          fetchRidesFromSameUniversity(userProfile.university);
        } else {
          // Don't automatically fetch location-based rides
          console.log("User has no university. Waiting for location input.");
          setLoading(false);
        }
      } else {
        console.log("No profile found, redirecting to profile creation.");
        router.push("/profileform");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error loading profile data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Set today's date as default
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setSearchForm((prev) => ({ ...prev, date: formattedDate }));

    // Add click outside listeners for suggestion dropdowns
    const handleClickOutside = (event) => {
      if (
        pickupSuggestionsRef.current &&
        !pickupSuggestionsRef.current.contains(event.target)
      ) {
        setShowPickupSuggestions(false);
      }
      if (
        destinationSuggestionsRef.current &&
        !destinationSuggestionsRef.current.contains(event.target)
      ) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [authLoading, router]);

  // Fetch rides from users at the same university
  const fetchRidesFromSameUniversity = async (university) => {
    console.log("Fetching rides from users at", university);
    setLoading(true);

    try {
      // First, get all users from the same university
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("university", "==", university));
      const usersSnapshot = await getDocs(usersQuery);

      // Extract user IDs
      const userIds = [];
      usersSnapshot.forEach((doc) => {
        if (doc.id !== user?.uid) {
          // Exclude current user
          userIds.push(doc.id);
        }
      });

      console.log(`Found ${userIds.length} users from ${university}`);

      if (userIds.length === 0) {
        setRides([]);
        setFilteredRides([]);
        setLoading(false);
        return;
      }

      // Now fetch rides from these users
      const ridesRef = collection(db, "rides");
      const currentDate = new Date();

      // Get all rides
      const q = query(ridesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedRides = [];

      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };

        if (userIds.includes(ride.ownerId)) {
          const rideStartDate = new Date(ride.startDateTime);
          if (ride.status === "not_started" && rideStartDate > currentDate) {
            fetchedRides.push(ride);
          }
        }
      });

      console.log(
        `Found ${fetchedRides.length} valid rides from university peers`
      );
      setRides(fetchedRides);
      setFilteredRides(fetchedRides);
    } catch (err) {
      console.error("Error fetching university rides:", err);
      setError("Failed to fetch rides. Please try again.");
    }

    setLoading(false);
  };

  const fetchRidesForLocation = async (location) => {
    console.log("Fetching rides for location:", location);
    setLoading(true);

    try {
      const ridesRef = collection(db, "rides");
      const q = query(ridesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedRides = [];
      const cityName = extractCity(location).toLowerCase();
      const currentDate = new Date();

      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };

        // Only include rides not created by the current user
        if (ride.ownerId !== user?.uid) {
          const rideFromCity = extractCity(ride.pickupLocation).toLowerCase();
          const rideStartDate = new Date(ride.startDateTime);

          // Check if ride is from the same city, hasn't started, and hasn't expired
          if (
            (rideFromCity.includes(cityName) ||
              cityName.includes(rideFromCity)) &&
            ride.status === "not_started" &&
            rideStartDate > currentDate &&
            ride.availableSeats > 0
          ) {
            fetchedRides.push(ride);
          }
        }
      });

      setRides(fetchedRides);
      setFilteredRides(fetchedRides);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Failed to fetch rides. Please try again.");
    }

    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchForm.from === "") {
      setDisable(true);
      return;
    }
    if (searchForm.to === "") {
      setDisable(true);
      return;
    }

    const queryParams = new URLSearchParams({
      from: searchForm.from,
      to: searchForm.to,
      date: searchForm.date || "",
      passengers: searchForm.passengers || 1,
      pickupCity: pickupCity,
      destinationCity: destinationCity,
    }).toString();

    // Redirect to search page with query parameters
    router.push(`/search-rides?${queryParams}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <section className="bg-[#8163e9] py-10 md:py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Find Your Perfect Ride
            </h1>
            <p className="text-white/80 text-lg">
              Connect with drivers heading your way and travel together
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="space-y-5 bg-white/10 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location with Autocomplete */}
                <div className="relative" ref={pickupSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Leaving from..."
                    value={searchForm.from}
                    onChange={(e) => {
                      setSearchForm({ ...searchForm, from: e.target.value });
                      fetchPickupSuggestions(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3.5 rounded-lg border-0 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
                  />

                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {pickupSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() =>
                            handlePickupLocationSelected(suggestion)
                          }
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
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
                <div className="relative" ref={destinationSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Going to..."
                    value={searchForm.to}
                    onChange={(e) => {
                      setSearchForm({ ...searchForm, to: e.target.value });
                      fetchDestinationSuggestions(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3.5 rounded-lg border-0 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
                  />
                  {showDestinationSuggestions &&
                    destinationSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {destinationSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setSearchForm({
                                ...searchForm,
                                to: suggestion.formatted,
                              });
                              setDestinationCity(suggestion.city);
                              setShowDestinationSuggestions(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
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
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-[#8163e9] py-3.5 px-6 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  Search Rides
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-10 md:py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Rides List */}
          {error && !loading ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#8163e9] mx-auto mb-4" />
                <p className="text-gray-500">Loading available rides...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.university ? `Rides Nearby` : "Available Rides"}
                </h2>
                <span className="text-sm bg-[#8163e9]/10 text-[#8163e9] px-3 py-1 rounded-full font-medium">
                  {filteredRides.length}{" "}
                  {filteredRides.length === 1 ? "ride" : "rides"} found
                </span>
              </div>

              {filteredRides.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No rides found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    We couldn't find any rides from your university peers. Try
                    searching for a specific route or check back later.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {filteredRides.map((ride) => (
                    <Link key={ride.id} href={`/home/rides/${ride.id}`}>
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:border-[#8163e9] hover:shadow-lg transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#8163e9]/10 p-2 rounded-full">
                                <MapPin className="h-5 w-5 text-[#8163e9]" />
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">
                                  From
                                </span>
                                <p className="font-medium text-black">
                                  {ride.pickupLocation}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="bg-[#8163e9]/10 p-2 rounded-full">
                                <MapPin className="h-5 w-5 text-[#8163e9]" />
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">
                                  To
                                </span>
                                <p className="font-medium text-black">
                                  {ride.destinationLocation}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-center sm:text-right">
                            <div className="text-2xl font-bold text-[#8163e9]">
                              ${ride.pricePerSeat}
                            </div>
                            <div className="text-sm text-gray-500">
                              per seat
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                            <Calendar className="h-4 w-4 text-[#8163e9]" />
                            <span>{formatDateTime(ride.startDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                            <Users className="h-4 w-4 text-[#8163e9]" />
                            <span>{ride.availableSeats} seats left</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
