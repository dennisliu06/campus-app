"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  Car,
  Users,
  Hash,
  Calendar,
  X,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MyCars = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    console.log("user in my cars", user);

    const q = query(collection(db, "cars"), where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const carList = [];
        querySnapshot.forEach((doc) => {
          carList.push({ id: doc.id, ...doc.data() });
        });
        setCars(carList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching cars:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDeleteCar = async (carId) => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "cars", carId));
      setMessage("Car deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting car:", error);
      setMessage("Error deleting car. Please try again.");
    }
    setDeleteLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100vh] flex  bg-gray-100 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Not Logged In</h2>
          <p className="text-gray-600">
            You must be logged in to view your cars.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Car className="w-16 h-16 text-[#8163e9] mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">No Cars Found</h2>
          <p className="text-gray-600">Start by adding your first car!</p>
          <Link
            href="/car-form"
            className="inline-block bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Add a Car
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#8163e9] rounded-2xl mb-8 py-6 px-4 sm:px-6 flex items-center justify-between relative">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors absolute left-4"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center ml-12">
            <Car className="w-6 h-6 mr-2" />
            My Cars
          </h1>
          <Link
            href="/car-form"
            className="bg-white text-[#8163e9] hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            Add New Car
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.includes("success") || message.includes("deleted")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.includes("success") || message.includes("deleted") ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p>{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Car Images Carousel */}
              <div className="relative h-48 sm:h-56 bg-gray-100">
                {car.imageURLs && car.imageURLs.length > 0 ? (
                  <>
                    <img
                      src={car.imageURLs[0] || "/placeholder.svg"}
                      alt={car.carName}
                      className="w-full h-full object-cover"
                    />
                    {car.imageURLs.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded-md">
                        +{car.imageURLs.length - 1} more
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Link href={`/car-form/${car.id}`}>
                    <button className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors">
                      <Edit className="w-4 h-4 text-[#8163e9]" />
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(car.id)}
                    className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Car Details */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {car.carName}
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Car className="w-5 h-5 mr-2 text-[#8163e9]" />
                    <span className="font-medium">Model:</span>
                    <span className="ml-2">{car.model}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Hash className="w-5 h-5 mr-2 text-[#8163e9]" />
                    <span className="font-medium">License Plate Number:</span>
                    <span className="ml-2">{car.carNumber}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-2 text-[#8163e9]" />
                    <span className="font-medium">Capacity:</span>
                    <span className="ml-2">{car.maxCapacity} seats</span>
                  </div>

                  {car.createdAt && (
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Added on{" "}
                        {new Date(car.createdAt.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === car.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 mb-3">
                      Are you sure you want to delete this car?
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
                        disabled={deleteLoading}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        {deleteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Gallery */}
                {car.imageURLs && car.imageURLs.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {car.imageURLs.slice(1).map((url, index) => (
                      <img
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`${car.carName} - Image ${index + 2}`}
                        className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => setSelectedImage(url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Car details"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCars;
