"use client";

import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import { Filter, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import GroupRideForm from "./GroupRideForm";
import GroupRideModal from "./GroupRideForm";
import { createGroup } from "@/actions/create-group";
import toast from "react-hot-toast";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getGroupById, getGroupsByUserId } from "@/data/group-rides";

const colors = [
  { value: "red", label: "Red", primary: "#e53e3e", hover: "#c53030" },
  { value: "blue", label: "Blue", primary: "#3182ce", hover: "#2b6cb0" },
  { value: "green", label: "Green", primary: "#38a169", hover: "#2f855a" },
  { value: "yellow", label: "Yellow", primary: "#d69e2e", hover: "#b7791f" },
  { value: "purple", label: "Purple", primary: "#8163e9", hover: "#6f51d9" },
];

export default function GroupRide() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getGroupsByUserId(user.uid)
      .then((group) => {
        setAllGroups(group);
      })
      .catch((e) => {
        console.log(e);
      });
  }, [user]);

  const handleCreateGroup = async (data) => {
    data.ownerId = user.uid;

    const createdGroup = await createGroup(data);

    if (createdGroup.error) {
      toast.error(createdGroup.error);
    }

    if (createdGroup.success && createdGroup.id) {
      toast.success(createdGroup.success);

      getGroupById(createdGroup.id)
        .then((group) => {
          setAllGroups((prev) => [group, ...prev]);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  const handleJoinGroup = (code) => {
    const matchedGroup = allGroups.find((group) => group.id == code);

    if (matchedGroup) {
      toast.error(`You are already in ${matchedGroup.name}`);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  return (
    <>
      {/* Modal */}
      <GroupRideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateGroup}
        onJoin={handleJoinGroup}
      />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                Group Rides
              </h1>
              <p className="text-gray-500 mt-1">
                Post your ride details, join a car, and travel together
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col py-10 gap-8">
            <h1 className="text-black text-2xl sm:text-3xl font-bold">
              All Rides
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-64 sm:h-72 border-solid border-2 rounded-xl flex flex-col justify-center items-center hover:bg-gray-100 text-black"
              >
                <h1 className="relative -top-10 sm:-top-20 text-gray-500 text-lg">
                  Add new group
                </h1>
                <Plus size={50} className="opacity-50 absolute" />
              </button>

              {allGroups.map((group) => {
                const color = colors.find((c) => c.value === group.color);
                const bgColor = color?.primary || "#8163e9";
                const hoverColor = color?.hover || "#6f51d9";

                return (
                  <Link href={`/group-ride/${group.id}`} key={group.id}>
                    <div
                      className="h-64 sm:h-72 border-solid border-2 rounded-xl overflow-hidden text-white cursor-pointer transition-colors duration-200"
                      style={{ backgroundColor: bgColor }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = hoverColor)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = bgColor)
                      }
                    >
                      <Image
                        src={group.imageUrl || "/bus.jpg"}
                        alt={group.id}
                        width={260}
                        height={144}
                        className="object-cover w-full h-1/2"
                        priority
                      />
                      <div className="p-4">
                        <h1 className="text-xl font-semibold truncate">
                          {group.name}
                        </h1>
                        <p className="text-sm mt-1">
                          {group.members?.length || 1} rider
                          {group.members?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
