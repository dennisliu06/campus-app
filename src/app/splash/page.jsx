"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Image from "next/image";

const SplashPage = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      setTimeout(async () => {
        const user = auth.currentUser;
        if (user) {
          await user.reload();
          if (user.emailVerified) {
            router.push("/home");
          } else {
            const interval = setInterval(async () => {
              await user.reload();
              if (user.emailVerified) {
                clearInterval(interval);
                router.push("/home");
              }
            }, 10000);

            setTimeout(() => {
              clearInterval(interval);
              signOut(auth);
              router.push("/login");
            }, 30 * 60 * 1000);
          }
        } else {
          router.push("/login");
        }
        setChecking(false);
      }, 1 * 60 * 1000);
    };

    checkVerification();
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#8163e9]">
      <div className=" p-6 rounded-lg  w-full max-w-md text-center">
        {checking ? (
          <div className="flex flex-col items-center">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={400}
              height={400}
              className="mt-6"
            />
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <p className="text-gray-700">
            If you are not redirected, please log in again.
          </p>
        )}
      </div>
    </div>
  );
};

export default SplashPage;
