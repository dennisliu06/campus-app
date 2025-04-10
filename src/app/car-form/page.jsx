"use client";

import { useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Car, ArrowLeft } from "lucide-react";

const CarForm = () => {
  const router = useRouter();
  const [carName, setCarName] = useState("");
  const [model, setModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [images, setImages] = useState([null, null, null, null, null]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setMessage("You must be logged in to add a car.");
      router.push("/login");
      return;
    }

    if (!images[0]) {
      setMessage("Please upload at least one image for the car.");
      return;
    }

    setLoading(true);
    try {
      const imageURLs = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        if (file) {
          const storageRef = ref(
            storage,
            `cars/${user.uid}/${Date.now()}_${i}_${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageURLs.push(url);
        }
      }

      const carData = {
        carName,
        model,
        carNumber,
        maxCapacity,
        imageURLs,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "cars"), carData);

      setMessage("Car added successfully!");
      setCarName("");
      setModel("");
      setCarNumber("");
      setMaxCapacity("");
      setImages([null, null, null, null, null]);
      setTimeout(() => {
        router.push("/my-cars");
      }, 500);
    } catch (error) {
      console.error("Error adding car:", error);
      setMessage("Error adding car. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6 relative">
            <button
              onClick={() => router.back()}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors flex items-center justify-center bg-[#6f51d9] p-2 rounded-full"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center">
              <Car className="w-6 h-6 mr-2" />
              Add a New Car
            </h2>
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
                  Car Images
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Required Image */}
                  <div className="relative group">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-[#8163e9]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(0, e.target.files[0])}
                        required
                        className="hidden"
                        id="image-0"
                      />
                      <label
                        htmlFor="image-0"
                        className="cursor-pointer block text-center"
                      >
                        {images[0] ? (
                          <div className="relative">
                            <img
                              src={
                                URL.createObjectURL(images[0]) ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt="Car preview"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                removeImage(0);
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
                              Main Image (Required)
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Optional Images */}
                  {[1, 2, 3, 4].map((idx) => (
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
                                Optional Image {idx + 1}
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Adding Car...
                  </>
                ) : (
                  "Add Car"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarForm;
