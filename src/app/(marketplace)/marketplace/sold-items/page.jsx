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
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Package,
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

// Condition mapping
const conditions = {
  new: "New",
  "like-new": "Used - Like New",
  good: "Used - Good",
  fair: "Used - Fair",
  poor: "Used - Poor",
};

export default function SoldItemsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [soldItems, setSoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalSales, setTotalSales] = useState(0);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    const fetchSoldItems = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const soldItemsRef = collection(db, "marketplace_listings");

        // Explicitly query for items with status "sold"
        const q = query(
          soldItemsRef,
          where("sellerId", "==", user.uid),
          where("status", "==", "sold"),
          orderBy("soldAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const items = [];
        let sales = 0;

        querySnapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() };
          items.push(item);
          sales += item.price || 0;
        });

        console.log(`Fetched ${items.length} sold items`);
        setSoldItems(items);
        setTotalSales(sales);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sold items:", err);
        setError("Failed to load your sold items");
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchSoldItems();
      } else {
        router.push("/login?redirect=/marketplace/sold-items");
      }
    }
  }, [user, authLoading, router]);

  const handleRestoreListing = async (itemId) => {
    if (
      window.confirm("Are you sure you want to restore this listing as active?")
    ) {
      try {
        setRestoringId(itemId);

        // Get the current listing to verify it exists and is sold
        const listingRef = doc(db, "marketplace_listings", itemId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          throw new Error("Listing not found");
        }

        // Update the listing status back to "active" in Firestore
        await updateDoc(listingRef, {
          status: "active",
          soldAt: null,
        });

        // Update the local state
        const updatedItem = soldItems.find((item) => item.id === itemId);
        const updatedPrice = updatedItem?.price || 0;

        setSoldItems(soldItems.filter((item) => item.id !== itemId));
        setTotalSales((prev) => prev - updatedPrice);

        setRestoringId(null);
      } catch (err) {
        console.error("Error restoring listing:", err);
        alert("Failed to restore listing. Please try again.");
        setRestoringId(null);
      }
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="ml-2 text-gray-600">Loading your sold items...</p>
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
          href="/marketplace/profile"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Marketplace Profile
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Sold Items</h1>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center">
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalSales.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {soldItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No sold items yet
            </h2>
            <p className="text-gray-600 mb-6">
              When you sell items, they will appear here.
            </p>
            <Link href="/marketplace/create-listing">
              <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
                Create a Listing
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {soldItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            {item.imageUrls && item.imageUrls.length > 0 ? (
                              <img
                                src={item.imageUrls[0] || "/placeholder.svg"}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Tag className="h-3 w-3 mr-1" />
                              {categories[item.category] || item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${item.price}
                        </div>
                        <div className="text-xs text-gray-500">
                          {conditions[item.condition] || item.condition}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {formatDate(item.soldAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          <Link href={`/marketplace/listing/${item.id}`}>
                            <span className="text-[#8163e9] hover:underline">
                              View
                            </span>
                          </Link>
                          <button
                            onClick={() => handleRestoreListing(item.id)}
                            disabled={restoringId === item.id}
                            className="text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
                          >
                            {restoringId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
