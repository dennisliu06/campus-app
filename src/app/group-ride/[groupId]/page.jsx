"use client";

import { getGroupById, getRidesByGroupId } from "@/data/group-rides";
import { Car, Coffee, Loader2, Music, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GroupRideModal from "../GroupRideForm";
import RideForm from "./RideForm";
import { useAuth } from "@/context/AuthContext";
import { createRide } from "@/actions/groups";
import { getUserById } from "@/data/users";

const colors = [
  "green",
  "red",
  "purple",
  "yellow",
  "blue",
  "cyan",
  "amber",
  "lime",
];

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState("");
  const [loading, setLoading] = useState(true);
  const [allRides, setAllRides] = useState([]);
  const [profile, setProfile] = useState();
  const { user, loading: authLoading } = useAuth();

  const onCopy = () => {};

  useEffect(() => {
    const fetchGroup = async () => {
      const fetchedGroup = await getGroupById(groupId);
      setLoading(true);

      if ("error" in fetchedGroup) {
        toast.error(fetchedGroup.error);
        setGroup(null);
      } else {
        setGroup(fetchedGroup);
      }

      setLoading(false);
    };

    if (!authLoading && user) {
      fetchGroup();
    }
  }, [groupId, authLoading, user]);

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      const unsubscribe = await getRidesByGroupId(
        groupId,
        setAllRides,
        setLoading
      );

      return () => unsubscribe();
    };

    fetchRides();
  }, [groupId]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      if (!user) {
        return;
      }
      const profile = await getUserById(user.uid);

      if (profile.error) {
        return;
      }

      setProfile(profile);
    };

    fetchProfile();
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-700">Group not found.</p>
      </div>
    );
  }

  const handleCreateGroup = async ({ carId, maxRiders, vibe }) => {
    const driverId = user.uid;
    const driverName = profile.fullName;
    const driverPfp = profile.profilePicUrl;

    const driver = {
      id: driverId,
      name: driverName,
      profilePicUrl: driverPfp,
    };

    const data = {
      groupId,
      driver,
      vibe,
      carId,
      maxRiders,
    };

    const createdRide = await createRide(data);

    if (createdRide.success && createdRide.id) {
      toast.success("Ride added!");
    } else {
      toast.error("Something went wrong!");
    }

    setAllRides((prev) => [createdRide, ...prev]);
  };

  const handleJoinGroup = () => {
    console.log("j");
  };

  return (
    <>
      {user && (
        <RideForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateGroup}
          userId={user.uid}
        />
      )}

      <div className="container mx-auto p-4 min-h-screen">
        {/* Group Header */}
        {group && (
          <div className="flex items-center space-x-4 border-b pb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden">
              <Image
                src={group.imageUrl}
                alt="Group Image"
                height={128}
                width={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-lg">{group.destination}</p>
              <p>{group.description}</p>
              <p>{group.members.length} riders</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Group Code:</span>
                <span className="bg-campus-purple text-white px-2 py-1 rounded">
                  {group.id}
                </span>
                <button
                  className="text-campus-purple"
                  onClick={() =>
                    navigator.clipboard.writeText(exampleGroup.groupId)
                  }
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Available Cars Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Available Cars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Car 1 */}
            {allRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <RandomBanner>
                  <div className="flex items-center gap-2">
                    <div className="bg-white text-purple-600 rounded-full p-2">
                      <Car size={24} />
                    </div>
                    <span className="font-bold text-lg">
                      {ride.driver.name}'s Ride
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                    <Users size={16} />
                    <span>3/{ride.maxRiders}</span>
                  </div>
                </RandomBanner>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative">
                      <Image
                        src={ride.driver.profilePicUrl || "/defaultPfp.jpg"}
                        alt={ride.driver.name ?? "Driver profile picture"}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-purple-400 object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-1">
                        <Coffee size={12} />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{ride.driver.name}</div>
                      <div className="text-xs text-purple-600 font-bold uppercase">
                        Driver Extraordinaire
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                    <Music size={16} className="text-purple-500" />
                    <span className="font-medium">{ride.vibe}</span>
                  </div>
                  <div className="pl-4 border-l-2 border-purple-200 ml-4">
                    <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                      <img
                        src="/api/placeholder/40/40"
                        alt="Taylor Smith"
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <span className="font-medium">Taylor Smith</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                      <img
                        src="/api/placeholder/40/40"
                        alt="Jamie Lee"
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <span className="font-medium">Jamie Lee</span>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => joinCar(1)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transform hover:scale-105 transition-all"
                      >
                        <UserPlus size={16} />
                        Join this adventure mobile!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="bg-campus-purple text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white text-purple-600 rounded-full p-2">
                    <Car size={24} />
                  </div>
                  <span className="font-bold text-lg">Alex Johnson's Ride</span>
                </div>
                <div className="flex items-center gap-1 bg-white text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                  <Users size={16} />
                  <span>3/4</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Alex Johnson"
                      className="w-12 h-12 rounded-full border-2 border-purple-400"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-1">
                      <Coffee size={12} />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Alex Johnson</div>
                    <div className="text-xs text-purple-600 font-bold uppercase">
                      Driver Extraordinaire
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                  <Music size={16} className="text-purple-500" />
                  <span className="font-medium">DJ & Karaoke</span>
                </div>
                <div className="pl-4 border-l-2 border-purple-200 ml-4">
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Taylor Smith"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Taylor Smith</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Jamie Lee"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Jamie Lee</span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => joinCar(1)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transform hover:scale-105 transition-all"
                    >
                      <UserPlus size={16} />
                      Join this adventure mobile!
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Car 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="bg-lime-500 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white text-purple-600 rounded-full p-2">
                    <Car size={24} />
                  </div>
                  <span className="font-bold text-lg">Chris Wilson's Ride</span>
                </div>
                <div className="flex items-center gap-1 bg-white text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                  <Users size={16} />
                  <span>2/3</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Chris Wilson"
                      className="w-12 h-12 rounded-full border-2 border-purple-400"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-1">
                      <Coffee size={12} />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Chris Wilson</div>
                    <div className="text-xs text-purple-600 font-bold uppercase">
                      Driver Extraordinaire
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                  <Music size={16} className="text-purple-500" />
                  <span className="font-medium">Podcasts & Snacks</span>
                </div>
                <div className="pl-4 border-l-2 border-purple-200 ml-4">
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Morgan Fields"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Morgan Fields</span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => joinCar(2)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transform hover:scale-105 transition-all"
                    >
                      <UserPlus size={16} />
                      Join this adventure mobile!
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional: Add a third example car that's full */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white text-purple-600 rounded-full p-2">
                    <Car size={24} />
                  </div>
                  <span className="font-bold text-lg">Pat Rivera's Ride</span>
                </div>
                <div className="flex items-center gap-1 bg-white text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                  <Users size={16} />
                  <span>4/4</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Pat Rivera"
                      className="w-12 h-12 rounded-full border-2 border-purple-400"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-1">
                      <Coffee size={12} />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Pat Rivera</div>
                    <div className="text-xs text-purple-600 font-bold uppercase">
                      Driver Extraordinaire
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                  <Music size={16} className="text-purple-500" />
                  <span className="font-medium">Party On Wheels</span>
                </div>
                <div className="pl-4 border-l-2 border-purple-200 ml-4">
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Sam Chen"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Sam Chen</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Jordan Patel"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Jordan Patel</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Blake Thompson"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">Blake Thompson</span>
                  </div>
                  <div className="mt-3 text-sm text-orange-500 flex items-center gap-2 bg-orange-50 p-2 rounded-lg font-medium">
                    <Users size={16} />
                    This ride is fully booked!
                  </div>
                </div>
              </div>
            </div>

            {/* "Add a car" card */}
            <div className="flex items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-8 bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-all">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center gap-3 text-purple-600 hover:text-purple-800 transform hover:scale-110 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center shadow-md">
                  <Car size={32} />
                </div>
                <span className="font-bold text-lg">Be a Road Hero!</span>
                <span className="text-sm text-purple-500">
                  Add your car to the adventure
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RandomBanner({ children }) {
  // Build your full bg‑class names
  const bgClasses = colors.map((c) => `bg-${c}-500`);



  // Pick one at mount
  const [bgClass] = useState(() => {
    const idx = Math.floor(Math.random() * bgClasses.length);
    console.log(bgClasses[idx])
    return bgClasses[idx];
  }, []);

  return (
    <div className={`${bgClass} text-white p-4 flex justify-between items-center`}>
      {children}
    </div>
  );
}