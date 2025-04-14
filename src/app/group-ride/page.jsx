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
import { collection, deleteDoc, doc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const colors = [
  { value: "red", label: "Red", primary: "#e53e3e", hover: "#c53030" },
  { value: "blue", label: "Blue", primary: "#3182ce", hover: "#2b6cb0" },
  { value: "green", label: "Green", primary: "#38a169", hover: "#2f855a" },
  { value: "yellow", label: "Yellow", primary: "#d69e2e", hover: "#b7791f" },
  { value: "purple", label: "Purple", primary: "#8163e9", hover: "#6f51d9" },
];

export default function GroupRide() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    if (!user) {
      console.log("NO USER");
      return;
    }

    async function fetchData() {
      const groupsRef = collection(db, "users", user.uid, "groups")
      const q = query(groupsRef, orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(
        q
      );
      const groups = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      

      setAllGroups(groups);
      console.log("groups: ", groups);

    }
    fetchData();
  }, [user]);

  const handleCreateGroup = async (data) => {
    data.ownerId = user.uid;

    const createdGroup = await createGroup(data);

    if (createdGroup.error) {
      toast.error(createdGroup.error);
    }

    if (createdGroup.success && createdGroup.groupDocRef) {
      console.log(data);
      toast.success(createdGroup.success);
      setAllGroups([{id: createdGroup.groupDocRef.id, ...createdGroup.groupDocRef}, ...allGroups])
    }
  };

  const handleJoinGroup = (code) => {
    console.log("Group Joined with Code:", code);
    // Process the join group code as needed
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto gap-y-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                Group Rides
              </h1>
              <p className="text-gray-500 mt-1">
                Post your ride details, join a car, and travel together
              </p>
            </div>

            {/* <Link
              href="/request-ride"
              className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
            >
              Create new group
            </Link> */}
          </div>

          {/* Modal */}
          <GroupRideModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleCreateGroup}
            onJoin={handleJoinGroup}
          />

          {/* Body */}
          <div className="flex flex-col py-10 gap-8">
            <h1 className="text-black text-2xl sm:text-3xl font-bold">
              All Rides
            </h1>

            <div className="grid grid-flow-row grid-cols-4 w-full h-full gap-8">
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-72 border-solid border-2 rounded-xl flex flex-col justify-center items-center hover:bg-gray-100 text-black"
              >
                <h1 className="relative -top-20 text-gray-500 text-lg">
                  Add new group
                </h1>
                <Plus size={50} className="opacity-50 absolute" />
              </button>

              {/* Test card */}
              {/* <Link href="/about">
                <div className="h-72 bg-campus-purple hover:bg-campus-purple-hover border-solid border-2 rounded-xl overflow-hidden text-white click">
                  <Image
                    src="/bus.jpg"
                    alt="img"
                    width={260}
                    height={144}
                    className="object-cover w-full h-1/2"
                  />
                  <h1 className="justify-self-center mt-10 text-xl font-semibold">
                    Bus Trip 2025
                  </h1>
                  <p className="justify-self-center relative top-10">
                    30 Riders
                  </p>
                </div>
              </Link> */}

              {allGroups.map((group) => (
                <Link href={`/group-ride/${group.id}`} key={group.id}>
                  <div className={`h-72 bg-[${colors.find(c => c.value === group.color).primary}] hover:bg-[${colors.find(c => c.value === group.color).hover}] border-solid border-2 rounded-xl overflow-hidden text-white click`}>
                    <Image
                      src={group.imageUrl || "/bus.jpg"}
                      alt={group.id}
                      width={260}
                      height={144}
                      className="object-cover w-full h-1/2"
                    />
                    <h1 className="justify-self-center mt-10 text-xl font-semibold">
                      {group.name}
                    </h1>
                    <p className="justify-self-center relative top-10">
                      {group.members.length} riders
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
