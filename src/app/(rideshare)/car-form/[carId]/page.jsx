"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Upload, X, Car, ChevronLeft } from "lucide-react";
import Link from "next/link";

const EditCarForm = () => {
  const router = useRouter();
  const { carId } = useParams();

  const [carName, setCarName] = useState("");
  const [model, setModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [images, setImages] = useState([null, null, null, null, null]);
  const [existingImageURLs, setExistingImageURLs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const carDoc = await getDoc(doc(db, "cars", carId));
        if (carDoc.exists()) {
          const carData = carDoc.data();
          setCarName(carData.carName || "");
          setModel(carData.model || "");
          setCarNumber(carData.carNumber || "");
          setMaxCapacity(carData.maxCapacity || "");

          // Store existing image URLs
          const urls = carData.imageURLs || [];
          setExistingImageURLs(urls);

          // Initialize images array with nulls
          const newImages = [null, null, null, null, null];
          setImages(newImages);
        } else {
          setMessage("Car not found");
          setTimeout(() => router.push("/my-cars"), 2000);
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
        setMessage("Error loading car data");
      }
      setInitialLoading(false);
    };

    if (carId) {
      fetchCarData();
    }
  }, [carId, router]);

  const handleFileChange = (index, file) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const removeExistingImage = (index) => {
    const newUrls = [...existingImageURLs];
    newUrls.splice(index, 1);
    setExistingImageURLs(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setMessage("You must be logged in to update a car.");
      router.push("/login");
      return;
    }

    if (existingImageURLs.length === 0 && !images[0]) {
      setMessage("Please upload at least one image for the car.");
      return;
    }

    setLoading(true);
    try {
      // Upload new images if any
      const newImageURLs = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        if (file) {
          const storageRef = ref(
            storage,
            `cars/${user.uid}/${Date.now()}_${i}_${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          newImageURLs.push(url);
        }
      }

      // Combine existing and new image URLs
      const updatedImageURLs = [...existingImageURLs, ...newImageURLs];

      const carData = {
        carName,
        model,
        carNumber,
        maxCapacity,
        imageURLs: updatedImageURLs,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "cars", carId), carData);

      setMessage("Car updated successfully!");
      setTimeout(() => router.push("/my-cars"), 1500);
    } catch (error) {
      console.error("Error updating car:", error);
      setMessage("Error updating car. Please try again.");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6 px-6 flex items-center justify-between">
            <Link href="/my-cars" className="text-white hover:text-white/80">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center">
              <Car className="w-6 h-6 mr-2" />
              Edit Car
            </h2>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>

          <div className="p-6 md:p-8">
            {message && (
              <div
                className={`mb-6 text-center p-4 rounded-lg ${
                  message.includes("success")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Car Name
                  </label>
                  <input
                    type="text"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Enter car name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Enter car model"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Enter License Plate Number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Max Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Enter max capacity"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  Current Images
                </label>

                {existingImageURLs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingImageURLs.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className="border-2 border-gray-300 rounded-lg p-4">
                          <div className="relative">
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Car image ${idx + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No current images</p>
                )}

                <label className="block text-sm font-medium text-gray-900 mt-6">
                  Add New Images
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* New Images */}
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="relative group">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-[#8163e9]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(idx, e.target.files[0])
                          }
                          className="hidden"
                          id={`image-${idx}`}
                        />
                        <label
                          htmlFor={`image-${idx}`}
                          className="cursor-pointer block text-center"
                        >
                          {images[idx] ? (
                            <div className="relative">
                              <img
                                src={
                                  URL.createObjectURL(images[idx]) ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                                alt={`Car preview ${idx + 1}`}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImage(idx);
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                              <Upload className="w-8 h-8 mb-2" />
                              <span className="text-sm font-medium">
                                Add Image {idx + 1}
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/my-cars"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Updating Car...
                    </>
                  ) : (
                    "Update Car"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCarForm;
