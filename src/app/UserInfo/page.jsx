"use client";
import { useAuth } from "@/context/AuthContext";

const UserInfo = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {user ? (
        <p>
          Logged in as: {user.email}{" "}
          {user.emailVerified ? "✅ Verified" : "❌ Not Verified"}
        </p>
      ) : (
        <p>No user logged in</p>
      )}
    </div>
  );
};

export default UserInfo;
