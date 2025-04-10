"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
} from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  Loader2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (searchQuery) {
      setCurrentSearchQuery(searchQuery);
      fetchSearchResults(true);
    } else {
      setLoading(false);
    }
  }, [searchQuery, categoryParam]);

  const fetchSearchResults = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setListings([]);
      } else {
        setLoadingMore(true);
      }

      const listingsRef = collection(db, "marketplace_listings");

      // Base query - filter by active status
      const baseQuery = [where("status", "in", ["active", null])];

      // Add category filter if selected
      if (selectedCategory) {
        baseQuery.push(where("category", "==", selectedCategory));
      }

      // Add sorting
      let orderByField = "createdAt";
      let orderByDirection = "desc";

      if (sortBy === "price_low") {
        orderByField = "price";
        orderByDirection = "asc";
      } else if (sortBy === "price_high") {
        orderByField = "price";
        orderByDirection = "desc";
      }

      let q;

      if (isInitial) {
        q = query(
          listingsRef,
          ...baseQuery,
          orderBy(orderByField, orderByDirection),
          limit(24)
        );
      } else {
        q = query(
          listingsRef,
          ...baseQuery,
          orderBy(orderByField, orderByDirection),
          startAfter(lastVisible),
          limit(24)
        );
      }

      const querySnapshot = await getDocs(q);

      // Set the last visible document for pagination
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);

      // Check if there are more results
      setHasMore(querySnapshot.docs.length === 24);

      let fetchedListings = [];

      querySnapshot.forEach((doc) => {
        const listingData = { id: doc.id, ...doc.data() };

        // Exclude current user's listings
        if (!user || listingData.sellerId !== user.uid) {
          fetchedListings.push(listingData);
        }
      });

      // Client-side search filtering
      if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(" ");

        fetchedListings = fetchedListings.filter((listing) => {
          const titleMatch =
            listing.title &&
            searchTerms.some((term) =>
              listing.title.toLowerCase().includes(term)
            );

          const descriptionMatch =
            listing.description &&
            searchTerms.some((term) =>
              listing.description.toLowerCase().includes(term)
            );

          const categoryMatch =
            listing.category &&
            searchTerms.some((term) =>
              categories[listing.category]?.toLowerCase().includes(term)
            );

          const locationMatch =
            listing.location &&
            searchTerms.some((term) =>
              listing.location.toLowerCase().includes(term)
            );

          return (
            titleMatch || descriptionMatch || categoryMatch || locationMatch
          );
        });
      }

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

      // Sort by relevance if needed
      if (sortBy === "relevance" && searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(" ");

        fetchedListings.sort((a, b) => {
          const aTitle = a.title?.toLowerCase() || "";
          const bTitle = b.title?.toLowerCase() || "";

          // Count how many search terms match in each title
          const aMatches = searchTerms.filter((term) =>
            aTitle.includes(term)
          ).length;
          const bMatches = searchTerms.filter((term) =>
            bTitle.includes(term)
          ).length;

          // If match counts differ, sort by match count
          if (aMatches !== bMatches) {
            return bMatches - aMatches;
          }

          // Otherwise, sort by recency
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      }

      if (isInitial) {
        setListings(fetchedListings);
      } else {
        setListings((prevListings) => [...prevListings, ...fetchedListings]);
      }
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError("Failed to load search results. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (currentSearchQuery.trim()) {
      let queryParams = `q=${encodeURIComponent(currentSearchQuery.trim())}`;

      if (selectedCategory) {
        queryParams += `&category=${selectedCategory}`;
      }

      router.push(`/marketplace/search?${queryParams}`);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleConditionToggle = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const applyFilters = () => {
    fetchSearchResults(true);
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setSelectedConditions([]);
    setSelectedCategory("");
    setSortBy("relevance");
    fetchSearchResults(true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSearchResults(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : "Search Marketplace"}
          </h1>
          <p className="text-white/80 mb-6">
            {searchQuery
              ? `Found ${listings.length} items matching your search`
              : "Find exactly what you're looking for"}
          </p>

          <form onSubmit={handleSearch} className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search for items..."
              value={currentSearchQuery}
              onChange={(e) => setCurrentSearchQuery(e.target.value)}
              className="w-full py-3 pl-10 pr-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
          </form>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {(selectedCategory ||
                  priceRange.min ||
                  priceRange.max ||
                  selectedConditions.length > 0 ||
                  sortBy !== "relevance") && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#8163e9] hover:underline flex items-center"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Category
                </h3>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Categories</option>
                  {Object.entries(categories).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
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
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors"
              >
                Apply Filters
              </button>
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
                    <h2 className="text-lg font-semibold text-gray-900">
                      Filters
                    </h2>
                    {(selectedCategory ||
                      priceRange.min ||
                      priceRange.max ||
                      selectedConditions.length > 0 ||
                      sortBy !== "relevance") && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-[#8163e9] hover:underline flex items-center"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Category
                    </h3>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Categories</option>
                      {Object.entries(categories).map(([value, name]) => (
                        <option key={value} value={value}>
                          {name}
                        </option>
                      ))}
                    </select>
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
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Sort By
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="newest">Newest First</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      applyFilters();
                      setShowFilters(false);
                    }}
                    className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results
              </h2>
              <span className="text-sm text-gray-500">
                {listings.length} {listings.length === 1 ? "item" : "items"}{" "}
                found
              </span>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
                <p className="ml-2 text-gray-600">Searching...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            ) : !searchQuery ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Enter a search term
                </h2>
                <p className="text-gray-600 mb-6">
                  Type what you're looking for in the search box above
                </p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h2>
                <p className="text-gray-600 mb-6">
                  We couldn't find any items matching "{searchQuery}".
                </p>
                <div className="space-y-4">
                  <p className="text-gray-600">Try:</p>
                  <ul className="text-gray-600 list-disc list-inside text-left max-w-md mx-auto">
                    <li>Checking your spelling</li>
                    <li>Using more general keywords</li>
                    <li>Removing filters</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
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
                            {categories[listing.category] || listing.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
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

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center mx-auto disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Load More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
