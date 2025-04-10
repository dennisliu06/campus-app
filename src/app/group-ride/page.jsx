"use client";

import { useAuth } from "@/context/AuthContext";
import { Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GroupRide() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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

            <Link
              href="/request-ride"
              className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
            >
              Create new group
            </Link>
          </div>

          <div></div>
        </div>
      </div>
    </>
  );
}
