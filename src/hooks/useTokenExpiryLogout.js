"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { parseJwt } from "@/utils/jwt"; // adjust path if necessary

const useTokenExpiryLogout = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.stsTokenManager?.accessToken) {
      // Decode the token using our custom parseJwt function
      const decoded = parseJwt(user.stsTokenManager.accessToken);
      if (!decoded) return;

      const expirationTime = decoded.exp * 1000; // Convert seconds to ms
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      console.log("Decoded token:", decoded);
      console.log("Token expires in:", timeUntilExpiry, "ms");

      // If token is already expired, sign out immediately
      if (timeUntilExpiry <= 0) {
        signOut(auth);
        console.log("Token already expired, user logged out.");
        return;
      }

      // Set a timeout to log out the user when the token expires
      const timeout = setTimeout(() => {
        signOut(auth);
        console.log("Token expired, user logged out.");
      }, timeUntilExpiry);

      return () => clearTimeout(timeout);
    }
  }, [user]);
};

export default useTokenExpiryLogout;
