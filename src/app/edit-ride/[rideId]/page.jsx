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
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  Car,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const EditRide = () => {
  const router = useRouter();
  const { rideId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [loadingRide, setLoadingRide] = useState(true);
  const [rideExists, setRideExists] = useState(true);

  // Form fields
  const [selectedCarId, setSelectedCarId] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [tollsIncluded, setTollsIncluded] = useState(false);
  const [tollPrice, setTollPrice] = useState("");

  const [selectedCar, setSelectedCar] = useState(null);

  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [airConditioning, setAirConditioning] = useState(false);
  const [wifiAvailable, setWifiAvailable] = useState(false);
  const [status, setStatus] = useState("not_started");
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

  // Fetch the ride data
  useEffect(() => {
    if (!user || !rideId) return;

    const fetchRideData = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", rideId));

        if (!rideDoc.exists()) {
          setRideExists(false);
          setLoadingRide(false);
          return;
        }

        const rideData = rideDoc.data();

        // Check if the user is the owner of this ride
        if (rideData.ownerId !== user.uid) {
          router.push("/driver/dashboard");
          return;
        }

        // Populate form fields with ride data
        setSelectedCarId(rideData.carId || "");
        setAvailableSeats(rideData.availableSeats || "");
        setPricePerSeat(rideData.pricePerSeat || "");
        setTollsIncluded(rideData.tollsIncluded || false);
        setTollPrice(rideData.tollPrice || "");
        setPickupLocation(rideData.pickupLocation || "");
        setPickupCity(rideData.pickupCity || "");
        setDestinationLocation(rideData.destinationLocation || "");
        setDestinationCity(rideData.destinationCity || "");

        // Format date-time strings for input fields
        if (rideData.startDateTime) {
          const startDate = new Date(rideData.startDateTime);
          setStartDateTime(formatDateTimeForInput(startDate));
        }

        if (rideData.endDateTime) {
          const endDate = new Date(rideData.endDateTime);
          setEndDateTime(formatDateTimeForInput(endDate));
        }

        setAirConditioning(rideData.airConditioning || false);
        setWifiAvailable(rideData.wifiAvailable || false);
        setStatus(rideData.status || "not_started");

        setLoadingRide(false);
      } catch (error) {
        console.error("Error fetching ride:", error);
        setLoadingRide(false);
      }
    };

    fetchRideData();
  }, [user, rideId, router]);

  // Helper function to format date for datetime-local input
  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  // Fetch the user's cars
  useEffect(() => {
    if (!user) {
      setLoadingCars(false);
      return;
    }
    const q = query(collection(db, "cars"), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCars = [];
        snapshot.forEach((doc) => {
          fetchedCars.push({ id: doc.id, ...doc.data() });
        });
        setCars(fetchedCars);
        setLoadingCars(false);
      },
      (error) => {
        console.error("Error fetching cars:", error);
        setLoadingCars(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedCarId) {
      const car = cars.find((car) => car.id === selectedCarId);
      setSelectedCar(car);
    } else {
      setSelectedCar(null);
    }
  }, [selectedCarId, cars]);

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

    if (!selectedCarId) {
      setMessage("Please select a car for your ride.");
      return;
    }
    if (!pickupLocation || !destinationLocation) {
      setMessage("Please fill in both pickup and destination locations.");
      return;
    }
    if (!startDateTime || !endDateTime) {
      setMessage("Please select both start and end date/time for the ride.");
      return;
    }

    const seats = Number(availableSeats);
    const price = Number(pricePerSeat);
    const toll = tollsIncluded ? Number(tollPrice) : 0;

    const selectedCar = cars.find((car) => car.id === selectedCarId);
    if (!selectedCar) {
      setMessage("Selected car not found.");
      return;
    }

    if (seats > Number(selectedCar.seats || selectedCar.maxCapacity)) {
      const maxSeats = selectedCar.seats || selectedCar.maxCapacity;
      setMessage(`Available seats cannot exceed car capacity of ${maxSeats}.`);
      return;
    }

    setSubmitting(true);
    try {
      const rideData = {
        carId: selectedCarId,
        availableSeats: seats,
        pricePerSeat: price,
        tollsIncluded,
        tollPrice: toll,
        pickupLocation,
        pickupCity,
        destinationLocation,
        destinationCity,
        startDateTime,
        endDateTime,
        airConditioning,
        wifiAvailable,
        status,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "rides", rideId), rideData);
      setMessage("Ride updated successfully!");

      // Redirect after successful update
      setTimeout(() => {
        router.push("/my-rides");
      }, 1500);
    } catch (error) {
      console.error("Error updating ride:", error);
      setMessage("Error updating ride. Please try again.");
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

  if (authLoading || loadingCars || loadingRide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (!rideExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Ride Not Found
          </h2>
          <p className="text-black mb-4">
            The ride you're trying to edit doesn't exist or has been removed.
          </p>
          <Link
            href="/driver/dashboard"
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Car className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Authentication Required
          </h2>
          <p className="text-black mb-4">Please log in to edit a ride.</p>
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

  if (cars.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Car className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            No Cars Found
          </h2>
          <p className="text-black mb-4">
            You need to add a car before you can edit a ride.
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
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Edit Ride
            </h1>
            <p className="text-gray-500 mt-1">Update your ride details</p>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6">
            <div className="flex items-center justify-center">
              <Car className="h-8 w-8 text-white mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Ride Details
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
                {/* Select Car */}
                <div className="col-span-2">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Car className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Select Car
                  </label>
                  <select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">-- Choose a car --</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.carName} {car.carNumber} {car.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Users className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Available Seats
                  </label>
                  {selectedCar ? (
                    <select
                      value={availableSeats}
                      onChange={(e) => setAvailableSeats(e.target.value)}
                      className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-[#8163e9] focus:border-transparent transition-colors"
                      required
                    >
                      <option value="">-- Select seats --</option>
                      {[...Array(Number.parseInt(selectedCar.maxCapacity))].map(
                        (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={availableSeats}
                      onChange={(e) => setAvailableSeats(e.target.value)}
                      min="1"
                      max="8"
                      className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-[#8163e9] focus:border-transparent transition-colors"
                      required
                      disabled={!selectedCar}
                      placeholder="Select a car first"
                    />
                  )}
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

                {/* Tolls Section */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="tollsIncluded"
                      checked={tollsIncluded}
                      onChange={(e) => setTollsIncluded(e.target.checked)}
                      className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                    />
                    <label
                      htmlFor="tollsIncluded"
                      className="text-sm font-medium text-black"
                    >
                      Include Toll Price?
                    </label>
                  </div>

                  {tollsIncluded && (
                    <div className="mt-4">
                      <label className="flex items-center text-sm font-medium text-black mb-2">
                        <DollarSign className="h-4 w-4 mr-2 text-[#8163e9]" />
                        Toll Price ($)
                      </label>
                      <input
                        type="number"
                        value={tollPrice}
                        onChange={(e) => setTollPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                  )}
                </div>

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

                {/* Start Date & Time */}
                <div className="col-span-2 md:col-span-1">
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

                {/* End Date & Time */}
                <div className="col-span-2 md:col-span-1">
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

                {/* Ride Status */}
                <div className="col-span-2">
                  <label className="flex items-center text-sm font-medium text-black mb-2">
                    <Car className="h-4 w-4 mr-2 text-[#8163e9]" />
                    Ride Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                    required
                  >
                    <option value="not_started">Not Started</option>
                    <option value="waiting_for_customer">
                      Waiting for Customer
                    </option>
                    <option value="started">Started</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Updating Ride...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Update Ride
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRide;
