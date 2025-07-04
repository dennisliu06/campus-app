import { Timestamp } from "firebase/firestore";
import { Car, Coffee, Music, Trash2, UserPlus, Users, SquarePen } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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

interface Ride {
  id: string;
  carId: string;
  createdAt: Timestamp;
  driver: Rider;
  groupId: string;
  maxRiders: number;
  riders: Rider[];
  vibe: string;
  startDateTime: string;
}

interface Rider {
  id: string;
  name: string;
  profilePicUrl?: string;
}

export default function RideCard({
  ride,
  joinGroup,
  leaveRide,
  inRide,
  isDriver,
  userId,
  handleOpenDialog,
  handleOpenDeleteDialog,
}: {
  ride: Ride;
  joinGroup: () => void;
  leaveRide: (rideId: string) => void;
  inRide: boolean;
  isDriver: boolean;
  userId: string;
  handleOpenDialog: (rideId: string) => void;
  handleOpenDeleteDialog: (rideId: string) => void;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<string | null>(null);

  

  if (!ride) {
    return <></>;
  }
  const startDate = new Date(ride.startDateTime)

  return (
    <div
      key={ride.id}
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
    >
      {ride.driver && ride.riders && ride.maxRiders && (
        <>
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
              <span>
                {ride.riders.length}/{ride.maxRiders}
              </span>
            </div>
          </RandomBanner>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400">
                  <Image
                    src={ride.driver.profilePicUrl || "/defaultPfp.jpg"}
                    alt={ride.driver.name ?? "Driver profile picture"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
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
            <div className="mb-2 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded-lg">
              <Music size={16} className="text-purple-500" />
              <span className="font-medium">{ride.vibe}</span>
            </div>
            {(!isNaN(startDate.getTime())) && (
              <div className="mb-4">
              <span className="font-small text-sm">Departure Time: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}</span>
              </div>
            )}
            <div className="pl-4 border-l-2 border-purple-200 ml-4">
              {ride.riders.length > 0 &&
                ride.riders.map((rider) => (
                  <div
                    key={rider.id}
                    className="flex items-center gap-2 mb-3 animate-fadeIn"
                  >
                    <img
                      src={rider.profilePicUrl || "/defaultPfp.jpg"}
                      alt={rider.id}
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <span className="font-medium">{rider.name}</span>
                  </div>
                ))}
              {ride.riders.length >= ride.maxRiders ? (
                <div className="mt-3 text-sm text-orange-500 flex items-center gap-2 bg-orange-50 p-2 rounded-lg font-medium">
                  <Users size={16} />
                  This ride is fully booked!
                </div>
              ) : !ride.riders.some((rider) => rider.id === userId) &&
                ride.driver.id !== userId && !inRide ? (
                <div className="mt-4">
                  <button
                    onClick={joinGroup}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transform hover:scale-105 transition-all"
                  >
                    <UserPlus size={16} />
                    Join this adventure mobile!
                  </button>
                </div>
              ) : null}
            </div>
            {ride.driver.id == userId && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleOpenDialog(ride.id)}
                  className="bg-orange-100 text-orange-600 hover:bg-orange-200 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transition-all"
                >
                  <SquarePen size={16} />
                  Edit this ride
                </button>
                <button
                  onClick={() => handleOpenDeleteDialog(ride.id)}
                  className="bg-red-100 text-red-600 hover:bg-red-200 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transition-all"
                >
                  <Trash2 size={16} />
                  Delete this ride
                </button>
              </div>
            )}
            {ride.driver.id !== userId &&
              ride.riders.some((rider) => rider.id === userId) && (
                <div className="mt-4">
                  <button
                    onClick={() => leaveRide(ride.id)}
                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transition-all"
                  >
                    <Trash2 size={16} />
                    Leave this ride
                  </button>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}
function RandomBanner({ children }: any) {
  // Build your full bg‑class names
  const bgClasses = colors.map((c) => `bg-${c}-500`);

  // Pick one at mount
  const [bgClass] = useState(() => {
    const idx = Math.floor(Math.random() * bgClasses.length);
    return bgClasses[idx];
  });

  return (
    <div
      className={`${bgClass} text-white p-4 flex justify-between items-center`}
    >
      {children}
    </div>
  );
}
