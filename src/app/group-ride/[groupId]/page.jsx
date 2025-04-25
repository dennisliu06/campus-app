"use client";

import {
  checkUserInRides,
  getGroupById,
  getRidesByGroupId,
} from "@/data/group-rides";
import { Car, Coffee, Loader2, Music, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GroupRideModal from "../GroupRideForm";
import RideForm from "./RideForm";
import { useAuth } from "@/context/AuthContext";
import { createRide, deleteRide, joinRide } from "@/actions/groups";
import { getUserById } from "@/data/users";
import RideCard from "./RideCard";

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
  const [inRide, setInRide] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rideToDelete, setRideToDelete] = useState(null);

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
    const fetchUserInRide = async () => {
      if (!user) {
        return;
      }

      const isInRide = await checkUserInRides(user.uid, groupId);

      setInRide(isInRide);
    };

    fetchUserInRide();
  }, [groupId, user]);

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

  const handleOpenDialog = (rideId) => {
    setRideToDelete(rideId);
    setShowConfirmDialog(true);
  };

  const handleCloseDialog = () => {
    setRideToDelete(null);
    setShowConfirmDialog(false);
  };

  const handleDeleteRide = async () => {
    if (rideToDelete) {
      handleCloseDialog();

      // Call your function to delete the ride here
      const deleteStatus = await deleteRide(rideToDelete, groupId)

      if (deleteStatus.success) {
        toast.success(deleteStatus.success)
      } else {
        toast.error(deleteStatus.error)
      }
      
    }
  };

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
    const driverPfp = profile.profilePicURL;

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

  const handleJoinRide = async (rideId) => {
    const riderId = user.uid;
    const riderName = profile.fullName;
    const riderPfp = profile.profilePicURL;
    const riderUniversity = profile.university;

    console.log(riderPfp);
    console.log(riderUniversity);

    const rider = {
      id: riderId,
      name: riderName,
      profilePicUrl: riderPfp,
    };

    console.log(rideId);

    const joinedRide = await joinRide(groupId, rideId, rider);

    if (joinedRide.success) {
      toast.success(joinedRide.success);
    } else {
      toast.error(joinedRide.error);
    }
  };

  const uniqueRides = Array.from(
    new Map(allRides.map((ride) => [ride.id, ride])).values()
  );

  return (
    <>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="text-lg font-bold mb-4">Are you sure?</div>
            <p className="mb-4">
              This action cannot be undone. Do you want to delete this ride?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseDialog}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRide}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
            {uniqueRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                joinGroup={() => handleJoinRide(ride.id)}
                inRide={inRide}
                userId={user.uid}
                handleOpenDialog={() => handleOpenDialog(ride.id)}
              />
            ))}

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
    console.log(bgClasses[idx]);
    return bgClasses[idx];
  }, []);

  return (
    <div
      className={`${bgClass} text-white p-4 flex justify-between items-center`}
    >
      {children}
    </div>
  );
}
