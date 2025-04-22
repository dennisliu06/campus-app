import { Timestamp } from "firebase/firestore";
import { Car, Coffee, Music, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
  id: string
  carId: string,
  createdAt: Timestamp
  driver: Rider
  groupId: string
  maxRiders: number
  riders: Rider[]
  vibe: string
}

interface Rider {
  id: string
  name: string
  profilePicUrl?: string
}

export default function RideCard({ ride }: { ride: Ride }, joinGroup: () => void) {


  return (
    <div
      key={ride.id}
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
    >
      <RandomBanner>
        <div className="flex items-center gap-2">
          <div className="bg-white text-purple-600 rounded-full p-2">
            <Car size={24} />
          </div>
          <span className="font-bold text-lg">{ride.driver.name}'s Ride</span>
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
              onClick={joinGroup}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 py-2 px-4 rounded-full flex items-center gap-2 font-medium text-sm transform hover:scale-105 transition-all"
            >
              <UserPlus size={16} />
              Join this adventure mobile!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function RandomBanner({ children } : any) {
  // Build your full bg‑class names
  const bgClasses = colors.map((c) => `bg-${c}-500`);

  // Pick one at mount
  const [bgClass] = useState(() => {
    const idx = Math.floor(Math.random() * bgClasses.length);
    console.log(bgClasses[idx]);
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
