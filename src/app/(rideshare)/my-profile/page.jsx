"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  getDoc,
  getFirestore,
  writeBatch,
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
  BookOpen,
  Car,
  ChevronRight,
  AlertCircle,
  Settings,
  MessageSquare,
  LayoutDashboard,
  MapPin,
  Trash2,
  CarFront,
  CarTaxiFront,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import Image from "next/image";

const MyProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Add new state variables for account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      try {
        console.log("Fetching profile for:", auth.currentUser.uid);
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });
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

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const userId = user.uid;
      const batch = writeBatch(db); // ✅ Use writeBatch(db) instead of db.batch()

      // 1. Delete user's bookings
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("riderId", "==", userId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      bookingsSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 2. Delete user's cars
      const carsQuery = query(
        collection(db, "cars"),
        where("ownerId", "==", userId)
      );
      const carsSnapshot = await getDocs(carsQuery);
      carsSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 3. Delete user's rides
      const ridesQuery = query(
        collection(db, "rides"),
        where("ownerId", "==", userId)
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      ridesSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 4. Delete user's chats
      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", userId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      chatsSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 5. Delete user document
      batch.delete(doc(db, "users", userId));

      // Execute batch
      await batch.commit();

      // 6. Delete Firebase Auth account
      await user.delete();

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Failed to delete account. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  const quickLinks = [
    {
      title: "Dashboard",
      description: "View your activity overview",
      icon: LayoutDashboard,
      href: "/owner/dashboard",
      color: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "My Bookings",
      description: "View and manage your trip bookings",
      icon: BookOpen,
      href: "/my-booking",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "My Rides",
      description: "Manage your rides and schedules",
      icon: MapPin,
      href: "/my-rides",
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
    {
      title: "About",
      description: "Details About us",
      icon: CarTaxiFront,
      href: "/about",
      color: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      title: "My Request",
      description: "My Requested Rides",
      icon: CarFront,
      href: "/my-requested-rides",
      color: "bg-gray-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Requested Rides",
      description: "Requested Rides to me",
      icon: Settings,
      href: "/available-requests",
      color: "bg-gray-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Group Rides",
      description: "Organize carpooling for events",
      icon: UsersRound,
      href: "/group-ride",
      color: "bg-green-100",
      iconColor: "text-green-600",
    }
  ];

  return (
    <>
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

                  {/* Bio */}
                  <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      About
                    </h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>

                  {/* Logout Button */}

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut || isDeleting}
                    className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                  </button>

                  {/* Delete Account Button */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoggingOut || isDeleting}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </button>
                  {/* marketplace hidden for now */}
                  {/* <Link href="/marketplace/profile">
                    <button className="w-full py-2 mt-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                      <UserCircle className="w-5 h-5" />
                      Switch to Marketplace Profile
                    </button>
                  </Link> */}
                </div>
              </div>
            </div>

            {/* Quick Links Grid - Right Column */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="block group hover:shadow-md transition-all duration-200"
                  >
                    <div className="bg-white rounded-xl p-6 flex items-start gap-4 h-full border border-transparent hover:border-[#8163e9]/20">
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Delete Account
              </h3>
            </div>

            <p className="text-gray-700 mb-4">
              Are you sure you want to delete your account? This action cannot
              be undone and all your data will be permanently removed.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 font-medium mb-2">
                The following data will be deleted:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
                <li>Your profile information</li>
                <li>All your cars</li>
                <li>All your rides</li>
                <li>All your bookings</li>
                <li>All your messages and chats</li>
              </ul>
            </div>

            {deleteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyProfile;
