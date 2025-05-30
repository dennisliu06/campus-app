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
} from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  Loader2,
  AlertCircle,
  Heart,
  Trash2,
  ShoppingBag,
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

export default function SavedItemsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchSavedItems = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const savedItemsRef = collection(db, "saved_items");
        const q = query(
          savedItemsRef,
          where("userId", "==", user.uid),
          orderBy("savedAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const items = [];

        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        setSavedItems(items);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching saved items:", err);
        setError("Failed to load your saved items");
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchSavedItems();
      } else {
        router.push("/login?redirect=/marketplace/saved-items");
      }
    }
  }, [user, authLoading, router]);

  const handleRemoveSavedItem = async (itemId) => {
    try {
      setRemovingId(itemId);
      await deleteDoc(doc(db, "saved_items", itemId));
      setSavedItems(savedItems.filter((item) => item.id !== itemId));
      setRemovingId(null);
    } catch (err) {
      console.error("Error removing saved item:", err);
      alert("Failed to remove item. Please try again.");
      setRemovingId(null);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="ml-2 text-gray-600">Loading your saved items...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {savedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No saved items yet
            </h2>
            <p className="text-gray-600 mb-6">
              When you save items, they will appear here for easy access.
            </p>
            <Link href="/marketplace/browse">
              <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <Link href={`/marketplace/listing/${item.listingId}`}>
                  <div className="relative h-48 bg-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {conditions[item.condition] || item.condition}
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-center mb-1">
                    <Tag className="h-3.5 w-3.5 text-[#8163e9] mr-1" />
                    <span className="text-xs text-gray-500">
                      {categories[item.category] || item.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#8163e9]">
                      ${item.price}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.savedAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <Link href={`/marketplace/listing/${item.listingId}`}>
                      <button className="text-sm text-[#8163e9] hover:underline">
                        View Details
                      </button>
                    </Link>
                    <button
                      onClick={() => handleRemoveSavedItem(item.id)}
                      disabled={removingId === item.id}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      Remove
                    </button>
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
