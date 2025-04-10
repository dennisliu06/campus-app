"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  Loader2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

// Categories mapping with icons
const categories = {
  "sports-tickets": {
    name: "Sports Tickets",
    description: "Event tickets, sports game passes, season tickets",
  },
  "dorm-supplies": {
    name: "Dorm Supplies",
    description: "Furniture, mini-fridges, bedding, decor, kitchen gadgets",
  },
  textbooks: {
    name: "Textbooks & School Supplies",
    description: "Used textbooks, notebooks, pens, backpacks, binders",
  },
  electronics: {
    name: "Electronics & Gadgets",
    description: "Laptops, headphones, cameras, phones, chargers, tablets",
  },
  clothing: {
    name: "Clothing & Accessories",
    description: "Clothing, shoes, jewelry, backpacks, hats",
  },
  furniture: {
    name: "Furniture & Appliances",
    description: "Chairs, desks, sofas, small kitchen appliances",
  },
  miscellaneous: {
    name: "Miscellaneous",
    description:
      "Random items such as decorations, pet supplies, or other unique items",
  },
};

// Condition mapping
const conditions = {
  new: "New",
  "like-new": "Used - Like New",
  good: "Used - Good",
  fair: "Used - Fair",
  poor: "Used - Poor",
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchCategoryListings = async () => {
      if (!categoryId) return;

      try {
        setLoading(true);
        const listingsRef = collection(db, "marketplace_listings");
        console.log("category-id ", categoryId);
        // Base query - filter by category and active status
        const q = query(
          listingsRef,
          where("category", "==", categoryId),
          where("status", "in", ["active", null]),
          orderBy("createdAt", "desc")
        );

        console.log("...............", q);

        const querySnapshot = await getDocs(q);
        let fetchedListings = [];

        querySnapshot.forEach((doc) => {
          console.log("doccccccccccccc", doc);
          fetchedListings.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Apply client-side filtering
        if (priceRange.min) {
          fetchedListings = fetchedListings.filter(
            (listing) => listing.price >= Number.parseFloat(priceRange.min)
          );
        }

        if (priceRange.max) {
          fetchedListings = fetchedListings.filter(
            (listing) => listing.price <= Number.parseFloat(priceRange.max)
          );
        }

        if (selectedConditions.length > 0) {
          fetchedListings = fetchedListings.filter((listing) =>
            selectedConditions.includes(listing.condition)
          );
        }

        // Apply sorting
        if (sortBy === "price_low") {
          fetchedListings.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price_high") {
          fetchedListings.sort((a, b) => b.price - a.price);
        }
        // Default is already sorted by newest

        setListings(fetchedListings);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching category listings:", err);
        setError("Failed to load listings for this category");
        setLoading(false);
      }
    };

    fetchCategoryListings();
  }, [categoryId, priceRange, selectedConditions, sortBy]);

  const handleConditionToggle = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setSelectedConditions([]);
    setSortBy("newest");
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const categoryInfo = categories[categoryId] || {
    name:
      categoryId.charAt(0).toUpperCase() +
      categoryId.slice(1).replace(/-/g, " "),
    description: "Browse items in this category",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <section className="bg-[#8163e9] py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Marketplace
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {categoryInfo.name}
          </h1>
          <p className="text-white/80 mb-6">{categoryInfo.description}</p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">Filters</h2>
                {(priceRange.min ||
                  priceRange.max ||
                  selectedConditions.length > 0 ||
                  sortBy !== "newest") && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#8163e9] hover:underline flex items-center"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Price Range
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="w-full pl-7 pr-2 py-2 border text-black border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Condition
                </h3>
                <div className="space-y-2">
                  {Object.entries(conditions).map(([value, label]) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(value)}
                        onChange={() => handleConditionToggle(value)}
                        className="rounded border-gray-300 text-[#8163e9] focus:ring-[#8163e9]"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border text-black border-gray-300 rounded-md text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="flex-1">
            {/* Mobile Filters Button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-4 flex items-center justify-center text-gray-700"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>

              {showFilters && (
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Mobile Filters Content - Same as sidebar */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-black">
                      Filters
                    </h2>
                    {(priceRange.min ||
                      priceRange.max ||
                      selectedConditions.length > 0 ||
                      sortBy !== "newest") && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-[#8163e9] hover:underline flex items-center"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Price Range
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              min: e.target.value,
                            })
                          }
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <span className="text-gray-500">-</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              max: e.target.value,
                            })
                          }
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Condition
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(conditions).map(([value, label]) => (
                        <label key={value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedConditions.includes(value)}
                            onChange={() => handleConditionToggle(value)}
                            className="rounded border-gray-300 text-[#8163e9] focus:ring-[#8163e9]"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Sort By
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black">Results</h2>
              <span className="text-sm text-gray-500">
                {listings.length} {listings.length === 1 ? "item" : "items"}{" "}
                found
              </span>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
                <p className="ml-2 text-gray-600">Loading listings...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-black mb-2">
                  No listings found
                </h2>
                <p className="text-gray-600 mb-6">
                  There are no items in this category that match your filters.
                </p>
                {(priceRange.min ||
                  priceRange.max ||
                  selectedConditions.length > 0 ||
                  sortBy !== "newest") && (
                  <button
                    onClick={clearFilters}
                    className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/marketplace/listing/${listing.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img
                          src={listing.imageUrls[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image available
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                        {conditions[listing.condition] || listing.condition}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-1">
                        <Tag className="h-3.5 w-3.5 text-[#8163e9] mr-1" />
                        <span className="text-xs text-gray-500">
                          {categoryInfo.name}
                        </span>
                      </div>
                      <h3 className="font-medium text-black mb-1 line-clamp-1">
                        {listing.title}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[#8163e9]">
                          ${listing.price}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(listing.createdAt)}
                        </span>
                      </div>
                      {listing.location && (
                        <div className="mt-2 text-xs text-gray-500">
                          {listing.location}
                        </div>
                      )}
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
