"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Loader2,
  UserCircle,
  Mail,
  School,
  Calendar,
  Edit,
  LogOut,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  LayoutDashboard,
  MapPin,
  Tag,
  PackageCheck,
  PackageOpen,
  Heart,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import Image from "next/image";

const MarketplaceProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({
    activeListings: 0,
    soldItems: 0,
    savedItems: 0,
    totalSales: 0,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      try {
        if (!auth.currentUser) {
          router.push("/login");
          return;
        }

        console.log("Fetching profile for:", auth.currentUser.uid);
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });

          // Fetch marketplace stats
          await fetchMarketplaceStats(auth.currentUser.uid);
        } else {
          console.log("No profile found, redirecting to profile creation.");
          router.push("/profileform");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Error loading profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, router]);

  const fetchMarketplaceStats = async (userId) => {
    try {
      // Fetch active listings count
      const activeListingsQuery = query(
        collection(db, "marketplace_listings"),
        where("sellerId", "==", userId),
        where("status", "in", ["active", null])
      );
      const activeListingsSnapshot = await getDocs(activeListingsQuery);

      // Fetch sold items count
      const soldItemsQuery = query(
        collection(db, "marketplace_listings"),
        where("sellerId", "==", userId),
        where("status", "==", "sold")
      );
      const soldItemsSnapshot = await getDocs(soldItemsQuery);

      // Fetch saved items count
      const savedItemsQuery = query(
        collection(db, "saved_items"),
        where("userId", "==", userId)
      );
      const savedItemsSnapshot = await getDocs(savedItemsQuery);

      // Calculate total sales
      let totalSales = 0;
      soldItemsSnapshot.forEach((doc) => {
        const item = doc.data();
        if (item.price) {
          totalSales += item.price;
        }
      });

      setStats({
        activeListings: activeListingsSnapshot.size,
        soldItems: soldItemsSnapshot.size,
        savedItems: savedItemsSnapshot.size,
        totalSales: totalSales,
      });
    } catch (error) {
      console.error("Error fetching marketplace stats:", error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No profile found. Please create one.</p>
      </div>
    );
  }

  const marketplaceLinks = [
    {
      title: "My Listings",
      description: "Manage your active listings",
      icon: ShoppingBag,
      href: "/marketplace/my-listings",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: stats.activeListings > 0 ? stats.activeListings : null,
    },
    {
      title: "Sold Items",
      description: "View your sales history",
      icon: PackageCheck,
      href: "/marketplace/sold-items",
      color: "bg-green-100",
      iconColor: "text-green-600",
      badge: stats.soldItems > 0 ? stats.soldItems : null,
    },
    {
      title: "Create Listing",
      description: "List a new item for sale",
      icon: Tag,
      href: "/marketplace/create-listing",
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Saved Items",
      description: "View items you've saved",
      icon: Heart,
      href: "/marketplace/saved-items",
      color: "bg-pink-100",
      iconColor: "text-pink-600",
      badge: stats.savedItems > 0 ? stats.savedItems : null,
    },
    {
      title: "Purchase History",
      description: "View items you've bought",
      icon: PackageOpen,
      href: "/marketplace/purchases",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Browse Marketplace",
      description: "Discover items for sale",
      icon: ShoppingBag,
      href: "/marketplace/browse",
      color: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      title: "Messages",
      description: "View your marketplace conversations",
      icon: MessageSquare,
      href: "/marketplace/messages",
      color: "bg-teal-100",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden sticky top-8">
              {/* Cover Image / Header */}
              <div className="h-32 bg-[#8163e9] relative">
                <Link
                  href="/profileform"
                  className="absolute top-4 right-4 bg-white p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Edit className="w-5 h-5 text-[#8163e9]" />
                </Link>
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-6">
                {/* Profile Picture */}
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {profile.profilePicURL ? (
                      <Image
                        src={profile.profilePicURL || "/placeholder.svg"}
                        alt={profile.fullName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <UserCircle className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="text-center space-y-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.fullName}
                  </h1>
                  {auth.currentUser?.email && (
                    <div className="flex items-center justify-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{auth.currentUser.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center text-gray-600">
                    <School className="w-4 h-4 mr-2" />
                    <span>{profile.university}</span>
                  </div>
                  {/* Add Location Display */}
                  {profile.location && (
                    <div className="flex items-center justify-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.updatedAt && (
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Last updated:{" "}
                        {new Date(
                          profile.updatedAt.toDate()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Marketplace Stats */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Marketplace Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                        <span className="text-lg font-bold text-gray-900">
                          {stats.activeListings}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Active Listings
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <PackageCheck className="w-5 h-5 text-green-500" />
                        <span className="text-lg font-bold text-gray-900">
                          {stats.soldItems}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Sold Items</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <span className="text-lg font-bold text-gray-900">
                          {stats.savedItems}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Saved Items</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <DollarSign className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">
                          ${stats.totalSales}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Total Sales</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="mt-6 space-y-2">
                  <Link href="/my-profile">
                    <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                      <UserCircle className="w-5 h-5" />
                      Switch to Rides Profile
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Grid - Right Column */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {marketplaceLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="block group hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-white rounded-xl p-6 flex items-start gap-4 h-full border border-transparent hover:border-[#8163e9]/20 relative">
                    <div className={`${link.color} p-3 rounded-lg`}>
                      <link.icon className={`w-6 h-6 ${link.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#8163e9] transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#8163e9] transition-colors" />

                    {/* Badge */}
                    {link.badge && (
                      <div className="absolute top-4 right-4 bg-[#8163e9] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {link.badge}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProfile;
