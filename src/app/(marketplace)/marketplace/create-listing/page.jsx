"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronLeft, X, Camera, Loader2, Check } from "lucide-react";

// Categories with their descriptions
const categories = [
  {
    id: "sports-tickets",
    name: "Sports Tickets",
    description: "Event tickets, sports game passes, season tickets",
  },
  {
    id: "dorm-supplies",
    name: "Dorm Supplies",
    description: "Furniture, mini-fridges, bedding, decor, kitchen gadgets",
  },
  {
    id: "textbooks",
    name: "Textbooks & School Supplies",
    description: "Used textbooks, notebooks, pens, backpacks, binders",
  },
  {
    id: "electronics",
    name: "Electronics & Gadgets",
    description: "Laptops, headphones, cameras, phones, chargers, tablets",
  },
  {
    id: "clothing",
    name: "Clothing & Accessories",
    description: "Clothing, shoes, jewelry, backpacks, hats",
  },
  {
    id: "furniture",
    name: "Furniture & Appliances",
    description: "Chairs, desks, sofas, small kitchen appliances",
  },
  {
    id: "miscellaneous",
    name: "Miscellaneous",
    description:
      "Random items such as decorations, pet supplies, or other unique items",
  },
];

// Condition options
const conditions = [
  { id: "new", name: "New" },
  { id: "like-new", name: "Used - Like New" },
  { id: "good", name: "Used - Good" },
  { id: "fair", name: "Used - Fair" },
  { id: "poor", name: "Used - Poor" },
];

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    location: "",
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const locationRef = useRef(null);

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchLocationSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
      );
      const data = await response.json();
      const suggestions = data.features.map((feature) => ({
        formatted: feature.properties.formatted,
        city: feature.properties.city || "",
      }));
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setLocationSuggestions([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    e.preventDefault();

    const files = Array.from(e.target.files);

    if (files.length + imageFiles.length > 5) {
      setError("You can only upload up to 5 images");
      return;
    }

    // Add new files to existing files
    setImageFiles([...imageFiles, ...files]);

    // Create preview URLs for new files
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    const newImageFiles = [...imageFiles];
    const newImagePreviewUrls = [...imagePreviewUrls];

    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(newImagePreviewUrls[index]);

    newImageFiles.splice(index, 1);
    newImagePreviewUrls.splice(index, 1);

    setImageFiles(newImageFiles);
    setImagePreviewUrls(newImagePreviewUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    // Validate form
    if (
      !formData.title ||
      !formData.price ||
      !formData.category ||
      !formData.condition
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (imageFiles.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload images to Firebase Storage
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const storageRef = ref(
            storage,
            `marketplace/${user.uid}/${Date.now()}_${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );

      // Create listing document in Firestore
      const listingData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        imageUrls,
        sellerId: user.uid,
        sellerName: user.displayName || "Anonymous",
        sellerPhoto: user.photoURL || null,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "marketplace_listings"),
        listingData
      );

      setSuccess(true);

      // Redirect to the listing page after a short delay
      setTimeout(() => {
        router.push(`/marketplace/listing/${docRef.id}`);
      }, 2000);
    } catch (error) {
      console.error("Error creating listing:", error);
      setError("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="ml-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  console.log("form data ", formData);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to create a listing.
          </p>
          <Link href="/login">
            <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/marketplace" className="mr-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Listing</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-green-700 font-medium">
                Listing created successfully!
              </p>
              <p className="text-green-600 text-sm">
                Redirecting to your listing...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Image Upload Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black mb-4">
              Upload Images
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {imagePreviewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {imagePreviewUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Camera className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-black">Add Photo</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="text-sm text-black">
              <p>• Upload up to 5 clear photos of your item</p>
              <p>• First image will be the cover photo</p>
            </div>
          </div>

          {/* Listing Details */}
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-[#8163e9] focus:border-[#8163e9]"
                placeholder="e.g., 'UConn Basketball Ticket' or 'Mini Fridge'"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-[#8163e9] focus:border-[#8163e9]"
                placeholder="Describe your item, including details about condition, features, etc."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">
                    $
                  </span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 pl-8 border border-gray-300 text-black rounded-lg focus:ring-[#8163e9] focus:border-[#8163e9]"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div ref={locationRef}>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <div className="relative" ref={locationRef}>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        location: e.target.value,
                      });
                      fetchLocationSuggestions(e.target.value);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-[#8163e9] focus:border-[#8163e9]"
                    placeholder="e.g., 'UConn Campus' or 'North Campus'"
                  />
                  {locationSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border text-black border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              location: suggestion.formatted,
                            });
                            setLocationSuggestions([]);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                        >
                          {suggestion.formatted}
                          {suggestion.city && (
                            <span className="block text-xs text-black mt-1">
                              City: {suggestion.city}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-[#8163e9] focus:border-[#8163e9] bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="condition"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-[#8163e9] focus:border-[#8163e9] bg-white"
                  required
                >
                  <option value="">Select condition</option>
                  {conditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#8163e9] text-white py-3 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Listing...
                </>
              ) : success ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Listing Created!
                </>
              ) : (
                "Create Listing"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
