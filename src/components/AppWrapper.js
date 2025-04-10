"use client";
import useTokenExpiryLogout from "@/hooks/useTokenExpiryLogout";

const AppWrapper = ({ children }) => {
  useTokenExpiryLogout();

  return <>{children}</>;
};

export default AppWrapper;
