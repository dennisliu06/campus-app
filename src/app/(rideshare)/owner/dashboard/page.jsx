"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Car,
  Users,
  Calendar,
  MessageSquare,
  PlusCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    cars: 0,
    rides: 0,
    bookings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });
        }

        // Fetch cars count
        const carsRef = collection(db, "cars");
        const carsQuery = query(carsRef, where("ownerId", "==", user.uid));
        const carsSnapshot = await getDocs(carsQuery);
        const carsCount = carsSnapshot.size;

        // Fetch rides
        const ridesRef = collection(db, "rides");
        const ridesQuery = query(ridesRef, where("ownerId", "==", user.uid));
        const ridesSnapshot = await getDocs(ridesQuery);
        const ridesCount = ridesSnapshot.size;

        // Calculate revenue and get ride IDs for booking query
        let totalRevenue = 0;
        const rideIds = [];

        ridesSnapshot.forEach((doc) => {
          const ride = doc.data();
          rideIds.push(doc.id);
          console.log("this is rides", ride);
          // Calculate potential revenue (price per seat * total seats)
          const totalSeats = ride.totalSeats || 0;
          const availableSeats = ride.availableSeats || 0;
          const bookedSeats = totalSeats - availableSeats;

          if (bookedSeats > 0 && ride.pricePerSeat) {
            totalRevenue += bookedSeats * ride.pricePerSeat;
          }
        });

        // Fetch bookings for user's rides
        let bookingsCount = 0;
        if (rideIds.length > 0) {
          const bookingsRef = collection(db, "bookings");
          const bookingsPromises = rideIds.map((rideId) => {
            const q = query(bookingsRef, where("rideId", "==", rideId));
            return getDocs(q);
          });

          const bookingsSnapshots = await Promise.all(bookingsPromises);
          bookingsCount = bookingsSnapshots.reduce(
            (total, snapshot) => total + snapshot.size,
            0
          );
        }

        // Update metrics
        setMetrics({
          cars: carsCount,
          rides: ridesCount,
          bookings: bookingsCount,
          totalRevenue: totalRevenue,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your dashboard.
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Dashboard action cards
  const actionCards = [
    {
      title: "My Rides",
      description: "Manage your published rides",
      icon: Car,
      href: "/my-rides",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Publish Ride",
      description: "Create a new ride listing",
      icon: PlusCircle,
      href: "/publish-ride",
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "My Cars",
      description: "Manage your vehicles",
      icon: Car,
      href: "/my-cars",
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Messages",
      description: "View your conversations",
      icon: MessageSquare,
      href: "/owner/chats",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-[#8163e9] rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome, {profile?.fullName || user.email || "Driver"}
              </h1>
              <p className="text-white/80">
                Here's an overview of your ride-sharing activity
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/publish-ride"
                className="inline-flex items-center bg-white text-[#8163e9] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Publish New Ride
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">My Cars</h3>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.cars}</p>
            <Link
              href="/my-cars"
              className="text-sm text-[#8163e9] hover:underline mt-2 inline-block"
            >
              Manage cars
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Active Rides
              </h3>
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.rides}</p>
            <Link
              href="/my-rides"
              className="text-sm text-[#8163e9] hover:underline mt-2 inline-block"
            >
              View rides
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Bookings
              </h3>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.bookings}
            </p>
            <p className="text-sm text-gray-500 mt-2">From all your rides</p>
          </div>

          {/* <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Revenue
              </h3>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${metrics.totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Earnings from all rides
            </p>
          </div> */}
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {actionCards.map((card) => (
            <Link key={card.title} href={card.href} className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:border-[#8163e9] hover:shadow-lg transition-all duration-200 h-full">
                <div className="flex items-start gap-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#8163e9] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{card.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Performance Overview
            </h2>
            <div className="bg-gray-100 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Booking Rate</span>
                <span className="text-gray-900 font-medium">
                  {metrics.rides > 0
                    ? Math.round((metrics.bookings / metrics.rides) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-[#8163e9] h-2.5 rounded-full"
                  style={{
                    width: `${
                      metrics.rides > 0
                        ? Math.round((metrics.bookings / metrics.rides) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Average Revenue per Ride</span>
                <span className="text-gray-900 font-medium">
                  $
                  {metrics.rides > 0
                    ? (metrics.totalRevenue / metrics.rides).toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cars Utilization</span>
                <span className="text-gray-900 font-medium">
                  {metrics.cars > 0
                    ? Math.round((metrics.rides / metrics.cars) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{
                    width: `${
                      metrics.cars > 0
                        ? Math.min(
                            100,
                            Math.round((metrics.rides / metrics.cars) * 100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Average Bookings per Ride</span>
                <span className="text-gray-900 font-medium">
                  {metrics.rides > 0
                    ? (metrics.bookings / metrics.rides).toFixed(1)
                    : "0.0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
