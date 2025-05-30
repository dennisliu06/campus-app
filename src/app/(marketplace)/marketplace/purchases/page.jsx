"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Package,
  ShoppingBag,
} from "lucide-react";

export default function PurchasesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const purchasesRef = collection(db, "marketplace_purchases");
        const q = query(
          purchasesRef,
          where("buyerId", "==", user.uid),
          orderBy("purchaseDate", "desc")
        );

        const querySnapshot = await getDocs(q);
        const items = [];
        let spent = 0;

        querySnapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() };
          items.push(item);
          spent += item.price || 0;
        });

        setPurchases(items);
        setTotalSpent(spent);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching purchases:", err);
        setError("Failed to load your purchases");
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchPurchases();
      } else {
        router.push("/login?redirect=/marketplace/purchases");
      }
    }
  }, [user, authLoading, router]);

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
        <p className="ml-2 text-gray-600">Loading your purchases...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center">
            <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalSpent.toFixed(2)}
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

        {purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No purchases yet
            </h2>
            <p className="text-gray-600 mb-6">
              When you buy items, they will appear here.
            </p>
            <Link href="/marketplace/browse">
              <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
                Browse Marketplace
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
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchases.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
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
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          ${item.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {item.sellerName || "Anonymous"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {formatDate(item.purchaseDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link href={`/marketplace/listing/${item.listingId}`}>
                          <span className="text-[#8163e9] hover:underline">
                            View Details
                          </span>
                        </Link>
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
