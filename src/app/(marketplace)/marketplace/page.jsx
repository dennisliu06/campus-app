"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  limit,
} from "firebase/firestore";
import {
  Search,
  Plus,
  Filter,
  Tag,
  ChevronRight,
  ShoppingBag,
  BookOpen,
  Tv,
  Shirt,
  Home,
  Ticket,
  Package,
  MessageSquare,
} from "lucide-react";

// Categories with their icons and descriptions
const categories = [
  {
    id: "sports-tickets",
    name: "Sports Tickets",
    icon: <Ticket className="h-6 w-6" />,
    description: "Event tickets, sports game passes, season tickets",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "dorm-supplies",
    name: "Dorm Supplies",
    icon: <Home className="h-6 w-6" />,
    description: "Furniture, mini-fridges, bedding, decor, kitchen gadgets",
    color: "bg-green-100 text-green-700",
  },
  {
    id: "textbooks",
    name: "Textbooks & School Supplies",
    icon: <BookOpen className="h-6 w-6" />,
    description: "Used textbooks, notebooks, pens, backpacks, binders",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "electronics",
    name: "Electronics & Gadgets",
    icon: <Tv className="h-6 w-6" />,
    description: "Laptops, headphones, cameras, phones, chargers, tablets",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "clothing",
    name: "Clothing & Accessories",
    icon: <Shirt className="h-6 w-6" />,
    description: "Clothing, shoes, jewelry, backpacks, hats",
    color: "bg-pink-100 text-pink-700",
  },
  {
    id: "furniture",
    name: "Furniture & Appliances",
    icon: <Home className="h-6 w-6" />,
    description: "Chairs, desks, sofas, small kitchen appliances",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "miscellaneous",
    name: "Miscellaneous",
    icon: <Package className="h-6 w-6" />,
    description:
      "Random items such as decorations, pet supplies, or other unique items",
    color: "bg-gray-100 text-gray-700",
  },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        setLoading(true);
        const listingsRef = collection(db, "marketplace_listings");
        let listingsQuery;

        if (selectedCategory === "all") {
          listingsQuery = query(
            listingsRef,
            orderBy("createdAt", "desc"),
            limit(12)
          );
        } else {
          listingsQuery = query(
            listingsRef,
            where("category", "==", selectedCategory),
            orderBy("createdAt", "desc"),
            limit(12)
          );
        }

        const querySnapshot = await getDocs(listingsQuery);
        const listings = [];

        querySnapshot.forEach((doc) => {
          const listingData = { id: doc.id, ...doc.data() };
          if (
            !user ||
            (listingData.sellerId !== user.uid && listingData.status !== "sold")
          ) {
            console.log("listing data", listingData.sellerId, user?.uid);
            listings.push(listingData);
          }
        });

        setRecentListings(listings);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, [selectedCategory, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  console.log("------------", recentListings);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-[#8163e9] py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white max-w-xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Campus Marketplace
              </h1>
              <p className="text-white/90 text-lg mb-6">
                Buy and sell items with other students at your university. Find
                textbooks, dorm supplies, tickets, and more!
              </p>
              <div className="flex gap-4">
                <Link href="/marketplace/create-listing">
                  <button className="bg-white text-[#8163e9] px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Listing
                  </button>
                </Link>
                <Link href="/marketplace/my-listings">
                  <button className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors">
                    My Listings
                  </button>
                </Link>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={handleSearch} className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/marketplace/category/${category.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div
                  className={`${category.color} w-12 h-12 rounded-full flex items-center justify-center mb-3`}
                >
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className="py-10 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Listings
            </h2>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === "all"
                    ? "bg-[#8163e9] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === category.name
                      ? "bg-[#8163e9] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/listing/${listing.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={
                        listing.imageUrls[0] ||
                        "/placeholder.svg?height=200&width=300"
                      }
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {listing.condition}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-1">
                      <Tag className="h-3.5 w-3.5 text-[#8163e9] mr-1" />
                      <span className="text-xs text-gray-500">
                        {categories.find((c) => c.id === listing.category)
                          ?.name || listing.category}
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
                    <div className="mt-2 text-xs text-gray-500">
                      {listing.location}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6  justify-center">
              <h1 className="text-black text-3xl">No Item is listed yet </h1>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/marketplace/browse">
              <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-lg font-medium transition-colors">
                View All Listings
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-[#8163e9]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create a Listing
              </h3>
              <p className="text-gray-600">
                Take photos, set a price, and write a description for the item
                you want to sell.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-[#8163e9]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect with Buyers
              </h3>
              <p className="text-gray-600">
                Respond to messages from interested buyers and arrange a
                meeting.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-6 w-6 text-[#8163e9]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete the Sale
              </h3>
              <p className="text-gray-600">
                Meet in a safe location on campus and exchange the item for
                payment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#8163e9]/5 border border-[#8163e9]/20 rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Safety Tips
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                  1
                </div>
                <span className="ml-2 text-gray-700">
                  Meet in a public place on campus, such as the student center
                  or library.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                  2
                </div>
                <span className="ml-2 text-gray-700">
                  Bring a friend with you when meeting someone for the first
                  time.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                  3
                </div>
                <span className="ml-2 text-gray-700">
                  Inspect items thoroughly before purchasing.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                  4
                </div>
                <span className="ml-2 text-gray-700">
                  Use our in-app messaging to communicate rather than sharing
                  personal contact information.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                  5
                </div>
                <span className="ml-2 text-gray-700">
                  Report any suspicious activity or users to our moderation
                  team.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
