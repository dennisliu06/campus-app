"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
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
  Calendar,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";

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

export default function AvailableRequests() {
  const router = useRouter();
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [hasCars, setHasCars] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [maxPassengers, setMaxPassengers] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    const fetchUserProfileAndCars = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user profile to check university
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          router.push("/profileform");
          return;
        }

        const userData = userDoc.data();
        setUserProfile(userData);

        // Check if user has cars
        const carsRef = collection(db, "cars");
        const carsQuery = query(carsRef, where("ownerId", "==", user.uid));
        const carsSnapshot = await getDocs(carsQuery);

        setHasCars(!carsSnapshot.empty);

        if (!carsSnapshot.empty) {
          // Fetch ride requests from users at the same university
          fetchRideRequests(userData.university);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Error loading user profile");
      }

      setLoading(false);
    };

    fetchUserProfileAndCars();
  }, [user, router]);

  const fetchRideRequests = async (university) => {
    try {
      // Get all pending ride requests from users at the same university
      const requestsRef = collection(db, "rideRequests");
      const requestsQuery = query(
        requestsRef,
        where("requesterUniversity", "==", university),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
        const requests = [];

        for (const doc of snapshot.docs) {
          const request = { id: doc.id, ...doc.data() };

          // Skip requests from the current user
          if (request.requesterId === user.uid) continue;

          // Check if user has already rejected this request
          const rejectionsRef = collection(
            db,
            "rideRequests",
            doc.id,
            "rejections"
          );
          const rejectionsQuery = query(
            rejectionsRef,
            where("userId", "==", user.uid)
          );
          const rejectionsSnapshot = await getDocs(rejectionsQuery);

          // Skip if user has rejected this request
          if (!rejectionsSnapshot.empty) continue;

          requests.push(request);
        }

        // Sort by creation date (newest first)
        requests.sort((a, b) => {
          return b.createdAt?.seconds - a.createdAt?.seconds;
        });

        setRideRequests(requests);
        setFilteredRequests(requests);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching ride requests:", error);
      setError("Failed to load ride requests");
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...rideRequests];

    // Filter by max passengers
    if (maxPassengers) {
      filtered = filtered.filter(
        (request) => request.passengers <= Number.parseInt(maxPassengers)
      );
    }

    // Filter by min price
    if (minPrice) {
      filtered = filtered.filter(
        (request) => request.pricePerSeat >= Number.parseFloat(minPrice)
      );
    }

    // Filter by location
    if (searchLocation) {
      const searchTerm = searchLocation.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.pickupLocation.toLowerCase().includes(searchTerm) ||
          request.destinationLocation.toLowerCase().includes(searchTerm) ||
          request.pickupCity?.toLowerCase().includes(searchTerm) ||
          request.destinationCity?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredRequests(filtered);

    // Close filter panel on mobile
    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
  };

  const clearFilters = () => {
    setMaxPassengers("");
    setMinPrice("");
    setSearchLocation("");
    setFilteredRequests(rideRequests);
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
            Please log in to view available ride requests.
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
          <p className="text-black">Loading ride requests...</p>
        </div>
      </div>
    );
  }

  if (!hasCars) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            No Cars Found
          </h2>
          <p className="text-black mb-4">
            You need to add a car before you can view and accept ride requests.
          </p>
          <Link
            href="/my-cars"
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Add a Car
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Available Ride Requests
            </h1>
            <p className="text-gray-500 mt-1">
              Find passengers looking for rides
            </p>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden bg-white p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>

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
              {/* Search Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] focus:border-transparent"
                    placeholder="City or address"
                  />
                </div>
              </div>

              {/* Max Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Passengers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={maxPassengers}
                    onChange={(e) => setMaxPassengers(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] focus:border-transparent"
                    placeholder="Any"
                    min="1"
                  />
                </div>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] focus:border-transparent"
                    placeholder="Any"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleFilter}
                  className="flex-1 py-2 px-4 bg-[#8163e9] text-white rounded-md hover:bg-[#8163e9]/90 transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Ride Requests List */}
          <div className="flex-1">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Ride Requests Found
                </h3>
                <p className="text-gray-500">
                  There are no pending ride requests from your university at the
                  moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <Link key={request.id} href={`/ride-request/${request.id}`}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-[#8163e9] hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#8163e9]" />
                            <span className="font-medium text-black">
                              {request.pickupLocation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#8163e9]" />
                            <span className="font-medium text-black">
                              {request.destinationLocation}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#8163e9]">
                            ${request.pricePerSeat}
                          </div>
                          <div className="text-sm text-gray-500">per seat</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(request.startDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {request.passengers} passenger
                            {request.passengers > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="ml-auto">
                          <span className="text-[#8163e9] font-medium flex items-center">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
