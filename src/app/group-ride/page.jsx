"use client";

import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import { Filter, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import GroupRideForm from "./GroupRideForm";

export default function GroupRide() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className="h-96 text-black">
            <GroupRideForm onSubmit={(data) => {
    console.log("Form submitted:", data);
    setIsModalOpen(false);
  }} />
            </div>
          </Modal>

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

              <div className="h-72 bg-[#8163e9] hover:bg-[#8163e9]/90 border-solid border-2 rounded-xl overflow-hidden">
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
                <p className="justify-self-center relative top-10">30 Riders</p>
              </div>

              <div className="h-72 bg-red-500 border-solid border-2 rounded-xl"></div>

              <div className="h-72 bg-red-500 border-solid border-2 rounded-xl"></div>

              <div className="h-72 bg-red-500 border-solid border-2 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
