"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  ChevronLeft,
  Plus,
  Tag,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  MoreVertical,
  Check,
  RefreshCw,
} from "lucide-react";

// Categories mapping
const categories = {
  "sports-tickets": "Sports Tickets",
  "dorm-supplies": "Dorm Supplies",
  textbooks: "Textbooks & School Supplies",
  electronics: "Electronics & Gadgets",
  clothing: "Clothing & Accessories",
  furniture: "Furniture & Appliances",
  miscellaneous: "Miscellaneous",
};

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [deletingId, setDeletingId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [markingAsSold, setMarkingAsSold] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  // Fetch listings whenever the active tab changes
  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [activeTab, user]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchListings();
      } else {
        router.push("/login?redirect=/marketplace/my-listings");
      }
    }
  }, [authLoading, router, user]);

  const fetchListings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const listingsRef = collection(db, "marketplace_listings");

      // Create query based on active tab
      const q = query(
        listingsRef,
        where("sellerId", "==", user.uid),
        where(
          "status",
          activeTab === "active" ? "in" : "==",
          activeTab === "active" ? ["active", null] : "sold"
        ),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const fetchedListings = [];

      querySnapshot.forEach((doc) => {
        fetchedListings.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`Fetched ${fetchedListings.length} ${activeTab} listings`);
      setListings(fetchedListings);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${activeTab} listings:`, err);
      setError(`Failed to load your ${activeTab} listings`);
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      try {
        setDeletingId(id);
        await deleteDoc(doc(db, "marketplace_listings", id));

        // Update local state
        setListings(listings.filter((listing) => listing.id !== id));
        setDeletingId(null);
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert("Failed to delete listing. Please try again.");
        setDeletingId(null);
      }
    }
  };

  const handleMarkAsSold = async (listingId) => {
    try {
      setMarkingAsSold(listingId);

      // Get the current listing to verify it exists and is active
      const listingRef = doc(db, "marketplace_listings", listingId);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        throw new Error("Listing not found");
      }

      // Update the listing status to "sold" in Firestore
      await updateDoc(listingRef, {
        status: "sold",
        soldAt: serverTimestamp(),
      });

      // Refresh the listings to show the updated state
      await fetchListings();

      // Close the dropdown
      setShowDropdown(null);
      setMarkingAsSold(null);
    } catch (err) {
      console.error("Error marking item as sold:", err);
      alert("Failed to mark item as sold. Please try again.");
      setMarkingAsSold(null);
    }
  };

  const handleRestoreListing = async (listingId) => {
    try {
      setRestoringId(listingId);

      // Get the current listing to verify it exists and is sold
      const listingRef = doc(db, "marketplace_listings", listingId);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        throw new Error("Listing not found");
      }

      // Update the listing status back to "active" in Firestore
      await updateDoc(listingRef, {
        status: "active",
        soldAt: null,
      });

      // Refresh the listings to show the updated state
      await fetchListings();

      // Close the dropdown
      setShowDropdown(null);
      setRestoringId(null);
    } catch (err) {
      console.error("Error restoring listing:", err);
      alert("Failed to restore listing. Please try again.");
      setRestoringId(null);
    }
  };

  const toggleDropdown = (id) => {
    if (showDropdown === id) {
      setShowDropdown(null);
    } else {
      setShowDropdown(id);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="ml-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <Link
          href="/marketplace"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Marketplace
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>

          <Link href="/marketplace/create-listing">
            <button className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Listing
            </button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`py-3 px-4 font-medium text-sm border-b-2 ${
              activeTab === "active"
                ? "border-[#8163e9] text-[#8163e9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Active Listings
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`py-3 px-4 font-medium text-sm border-b-2 ${
              activeTab === "sold"
                ? "border-[#8163e9] text-[#8163e9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Sold Items
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
            <p className="ml-2 text-gray-600">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} listings found
            </h2>
            <p className="text-gray-600 mb-6">
              {activeTab === "active"
                ? "You don't have any active listings. Create a new listing to start selling!"
                : "You don't have any sold items yet."}
            </p>
            {activeTab === "active" && (
              <Link href="/marketplace/create-listing">
                <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
                  Create Listing
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Listing Image */}
                  <div className="sm:w-48 h-48 bg-gray-100 flex-shrink-0">
                    {listing.imageUrls && listing.imageUrls.length > 0 ? (
                      <img
                        src={listing.imageUrls[0] || "/placeholder.svg"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}

                    {/* Status Badge */}
                    {listing.status === "sold" && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        SOLD
                      </div>
                    )}
                  </div>

                  {/* Listing Details */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center mb-1">
                      <Tag className="h-3.5 w-3.5 text-[#8163e9] mr-1" />
                      <span className="text-xs text-gray-500">
                        {categories[listing.category] || listing.category}
                      </span>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-1">
                      {listing.title}
                    </h3>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-[#8163e9]">
                        ${listing.price}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activeTab === "sold" && listing.soldAt
                          ? `Sold: ${formatDate(listing.soldAt)}`
                          : `Listed: ${formatDate(listing.createdAt)}`}
                      </span>
                    </div>

                    {listing.location && (
                      <p className="text-sm text-gray-500 mb-2">
                        {listing.location}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {listing.description || "No description provided."}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Link href={`/marketplace/listing/${listing.id}`}>
                          <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </Link>
                        {activeTab === "active" && (
                          <Link
                            href={`/marketplace/edit-listing/${listing.id}`}
                          >
                            <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                          </Link>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(listing.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>

                        {showDropdown === listing.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                            {activeTab === "active" && (
                              <button
                                onClick={() => handleMarkAsSold(listing.id)}
                                disabled={markingAsSold === listing.id}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                              >
                                {markingAsSold === listing.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                )}
                                Mark as Sold
                              </button>
                            )}
                            {activeTab === "sold" && (
                              <button
                                onClick={() => handleRestoreListing(listing.id)}
                                disabled={restoringId === listing.id}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                              >
                                {restoringId === listing.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                                )}
                                Restore Listing
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={deletingId === listing.id}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center disabled:opacity-50"
                            >
                              {deletingId === listing.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete Listing
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
