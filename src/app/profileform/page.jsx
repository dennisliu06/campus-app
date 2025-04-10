"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import universityList from "@/data/universities.json";
import { useRouter } from "next/navigation";
import { Loader2, UserCircle, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import Select from "react-select";

const ProfileForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicURL, setProfilePicURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProfile, setIsNewProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase user loaded:", firebaseUser);
        fetchUserProfile(firebaseUser.uid);
      } else {
        setIsLoading(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFullName(data.fullName || "");
        setBio(data.bio || "");
        setUniversity(data.university || "");
        setLocation(data.location || "");
        setProfilePicURL(data.profilePicURL || "");
        setIsNewProfile(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Error loading profile data.");
    }
    setIsLoading(false);
  };

  // Function to fetch location suggestions using Geoapify
  const fetchLocationSuggestions = async (input) => {
    if (!input) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          input
        )}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
      );
      const data = await response.json();
      setLocationSuggestions(
        data.features.map((feature) => feature.properties.formatted)
      );
      setShowLocationSuggestions(true);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  // Set up click outside listener for location suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".location-suggestions")) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
      setProfilePicURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setMessage("User not logged in.");
      router.push("/login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let uploadedProfilePicURL = profilePicURL;

      if (profilePic) {
        const storageRef = ref(
          storage,
          `profilePictures/${auth.currentUser.uid}`
        );
        const snapshot = await uploadBytes(storageRef, profilePic);
        uploadedProfilePicURL = await getDownloadURL(snapshot.ref);
      }

      const profileData = {
        fullName,
        bio,
        university,
        location,
        profilePicURL: uploadedProfilePicURL,
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "users", auth.currentUser.uid), profileData, {
        merge: true,
      });

      setMessage("Profile updated successfully!");
      router.push("/my-profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile.");
    }
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  const universityOptions = universityList.map((uni) => ({
    value: uni,
    label: uni,
  }));
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              {isNewProfile ? "Create Profile" : "Update Profile"}
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
              {/* Profile Picture Preview */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#8163e9] shadow-lg">
                  {profilePicURL ? (
                    <img
                      src={profilePicURL || "/placeholder.svg"}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <UserCircle className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <label className="mt-4 px-4 py-2 bg-[#8163e9] text-white rounded-lg cursor-pointer hover:bg-[#6f51d9] transition-colors">
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* University */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University
                  </label>
                  <Select
                    value={universityOptions.find(
                      (u) => u.value === university
                    )}
                    onChange={(selectedOption) =>
                      setUniversity(selectedOption.value)
                    }
                    options={universityOptions}
                    isSearchable={true}
                    // isDisabled={!isNewProfile && university !== ""}
                    placeholder="Select University"
                    className="w-full text-gray-900"
                  />
                  ;
                </div>

                {/* Location with Autocomplete */}
                <div className="col-span-2 relative location-suggestions">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        fetchLocationSuggestions(e.target.value);
                      }}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                      placeholder="Enter your location"
                      required
                    />
                  </div>
                  {showLocationSuggestions &&
                    locationSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setLocation(suggestion);
                              setShowLocationSuggestions(false);
                            }}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                {/* Bio */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    required
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg   focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isNewProfile
                      ? "Creating Profile..."
                      : "Updating Profile..."}
                  </>
                ) : isNewProfile ? (
                  "Create Profile"
                ) : (
                  "Update Profile"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
