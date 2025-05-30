"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Car,
  Search,
  Wind,
  Wifi,
  Users,
  Loader2,
  AlertCircle,
  X,
  Filter,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

const extractCity = (address) => {
  if (!address) return "";
  const parts = address.split(",").map((part) => part.trim());
  return parts[parts.length > 2 ? parts.length - 2 : parts.length - 1];
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default function SearchRides() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [searchForm, setSearchForm] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });
  const [rides, setRides] = useState([]);
  const [otherRides, setOtherRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Filter states
  const [maxPrice, setMaxPrice] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [sortBy, setSortBy] = useState("distance");

  // Location states
  const [pickupCity, setPickupCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  const pickupSuggestionsRef = useRef(null);
  const destinationSuggestionsRef = useRef(null);

  useEffect(() => {
    // Get search parameters from URL
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const date = searchParams.get("date") || "";
    const passengers = searchParams.get("passengers") || 1;
    const pick = searchParams.get("pickupCity") || "";
    const destination = searchParams.get("destinationCity") || "";

    setPickupCity(pick);
    setDestinationCity(destination);

    setSearchForm({
      from,
      to,
      date,
      passengers,
    });

    // If we have from and to, perform the search
    if (from && to) {
      performSearch(from, to, pick, destination);
    } else {
      setLoading(false);
    }

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchParams]);

  const performSearch = async (
    from,
    to,
    pickupCityParam,
    destinationCityParam
  ) => {
    setLoading(true);
    setError("");
    try {
      // Extract city names from the full addresses
      const fromCity = pickupCityParam || extractCity(from).toLowerCase();
      const toCity = destinationCityParam || extractCity(to).toLowerCase();
      const ridesRef = collection(db, "rides");
      const q = query(ridesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const exactMatches = [];
      const cityMatches = [];
      const otherAvailableRides = [];

      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };

        // Skip rides created by the current user
        if (ride.ownerId === user?.uid) return;

        // Extract city names from ride locations
        const rideFromCity = (
          ride.pickupCity || extractCity(ride.pickupLocation)
        ).toLowerCase();
        const rideToCity = (
          ride.destinationCity || extractCity(ride.destinationLocation)
        ).toLowerCase();
        if (
          ride.pickupLocation.toLowerCase().includes(from.toLowerCase()) &&
          ride.destinationLocation.toLowerCase().includes(to.toLowerCase()) &&
          ride.availableSeats > 0
        ) {
          exactMatches.push(ride);
        } else if (
          ride.pickupCity == pickupCityParam &&
          ride.destinationCity == destinationCityParam &&
          ride.availableSeats > 0
        ) {
          otherAvailableRides.push(ride);
        }
      });

      // Combine exact matches and city matches for primary results
      const allMatches = [...exactMatches, ...cityMatches];

      // Sort rides by proximity if coordinates are available
      if (userLocation) {
        allMatches.sort((a, b) => {
          const distanceA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.pickupLat || 0,
            a.pickupLng || 0
          );
          const distanceB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.pickupLat || 0,
            b.pickupLng || 0
          );
          return distanceA - distanceB;
        });
      }

      setRides(allMatches);
      setFilteredRides(allMatches);
      setOtherRides(otherAvailableRides);
    } catch (err) {
      console.error("Error searching rides:", err);
      setError("Failed to search rides. Please try again.");
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Update URL with new search parameters
    const queryParams = new URLSearchParams({
      from: searchForm.from,
      to: searchForm.to,
      date: searchForm.date,
      passengers: searchForm.passengers,
      pickupCity: pickupCity,
      destinationCity: destinationCity,
    }).toString();

    router.push(`/search-rides?${queryParams}`);

    // Perform the search
    performSearch(searchForm.from, searchForm.to, pickupCity, destinationCity);
  };

  const handleFilter = () => {
    // Apply filters to main rides
    let tempRides = [...rides];
    let tempOtherRides = [...otherRides];

    // Apply price filter
    if (maxPrice && maxPrice !== "") {
      tempRides = tempRides.filter(
        (ride) => Number(ride.pricePerSeat) <= Number(maxPrice)
      );
      tempOtherRides = tempOtherRides.filter(
        (ride) => Number(ride.pricePerSeat) <= Number(maxPrice)
      );
    }

    // Apply seats filter
    if (minSeats && minSeats !== "") {
      tempRides = tempRides.filter(
        (ride) => Number(ride.availableSeats) >= Number(minSeats)
      );
      tempOtherRides = tempOtherRides.filter(
        (ride) => Number(ride.availableSeats) >= Number(minSeats)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        tempRides.sort(
          (a, b) => Number(a.pricePerSeat) - Number(b.pricePerSeat)
        );
        tempOtherRides.sort(
          (a, b) => Number(a.pricePerSeat) - Number(b.pricePerSeat)
        );
        break;
      case "date":
        tempRides.sort(
          (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
        );
        tempOtherRides.sort(
          (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
        );
        break;
    }

    setFilteredRides(tempRides);
    setOtherRides(tempOtherRides);

    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button and header */}
      <div className="bg-[#8163e9] py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link href="/home" className="text-white hover:text-white/80 mr-4">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold text-white">Search Results</h1>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <section className="bg-[#8163e9] py-4 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={pickupSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                    className="w-full pl-10 pr-3 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
                  />

                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {pickupSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setSearchForm({
                              ...searchForm,
                              from: suggestion.formatted,
                            });
                            setPickupCity(suggestion.city);
                            setShowPickupSuggestions(false);
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
                <div className="relative" ref={destinationSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                    className="w-full pl-10 pr-3 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
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
                  className="flex-1 bg-white text-[#8163e9] py-3 px-6 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  Search Rides
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="md:hidden bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div
              className={`
              md:w-64 bg-white rounded-lg shadow-sm border border-gray-200
              ${
                isFilterOpen ? "fixed inset-0 z-50 p-6" : "hidden"
              } md:block md:static md:p-4
            `}
            >
              <div className="flex items-center justify-between mb-6 md:hidden">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border rounded-md  focus:ring-[#8163e9] text-black focus:border-transparent"
                  >
                    <option value="price" className="text-black">
                      Price
                    </option>
                    <option value="date" className="text-black">
                      Date
                    </option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-md  text-black focus:ring-[#8163e9] focus:border-transparent"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                {/* Seats Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Seats
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={minSeats}
                      onChange={(e) => setMinSeats(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-md  text-black focus:ring-[#8163e9] focus:border-transparent"
                      placeholder="Any"
                    />
                  </div>
                </div>

                <button
                  onClick={handleFilter}
                  className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Rides List */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Main Results */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {searchForm.from && searchForm.to
                          ? "Search Results"
                          : "Available Rides"}
                      </h2>
                      <span className="text-sm bg-[#8163e9]/10 text-[#8163e9] px-3 py-1 rounded-full font-medium">
                        {filteredRides.length}{" "}
                        {filteredRides.length === 1 ? "ride" : "rides"} found
                      </span>
                    </div>

                    {filteredRides.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No rides found
                        </h3>
                        <p className="text-gray-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredRides.map((ride) => (
                          <Link key={ride.id} href={`/home/rides/${ride.id}`}>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-[#8163e9] hover:shadow-md transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#8163e9]" />
                                    <span className="font-medium text-black">
                                      {ride.pickupLocation}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#8163e9]" />
                                    <span className="font-medium text-black">
                                      {ride.destinationLocation}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-[#8163e9]">
                                    ${ride.pricePerSeat}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    per seat
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {formatDateTime(ride.startDateTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{ride.availableSeats} seats left</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Other Available Rides */}
                  {otherRides.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Other Available Rides
                        </h2>
                        <span className="text-sm bg-[#8163e9]/10 text-[#8163e9] px-3 py-1 rounded-full font-medium">
                          {otherRides.length}{" "}
                          {otherRides.length === 1 ? "ride" : "rides"} found
                        </span>
                      </div>

                      <div className="grid gap-4">
                        {otherRides.map((ride) => (
                          <Link key={ride.id} href={`/home/rides/${ride.id}`}>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-[#8163e9] hover:shadow-md transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#8163e9]" />
                                    <span className="font-medium text-black">
                                      {ride.pickupLocation}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#8163e9]" />
                                    <span className="font-medium text-black">
                                      {ride.destinationLocation}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-[#8163e9]">
                                    ${ride.pricePerSeat}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    per seat
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {formatDateTime(ride.startDateTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{ride.availableSeats} seats left</span>
                                </div>
                                {ride.airConditioning && (
                                  <div className="flex items-center gap-1">
                                    <Wind className="h-4 w-4" />
                                    <span>AC</span>
                                  </div>
                                )}
                                {ride.wifiAvailable && (
                                  <div className="flex items-center gap-1">
                                    <Wifi className="h-4 w-4" />
                                    <span>WiFi</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
