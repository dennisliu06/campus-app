"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Timer,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

const Signin = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isMarketplace = pathname?.includes("/marketplace");

  const validateEmail = (email) => {
    // Check if email ends with .edu
    if (!email.toLowerCase().endsWith(".edu")) {
      return "Only .edu email addresses are allowed";
    }
    return null;
  };
  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // Validate email domain
    // const emailError = validateEmail(email);
    // if (emailError) {
    //   setError(emailError);
    //   setLoading(false);
    //   return;
    // }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setShowPopup(true);
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      console.log(userDoc);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.university) {
          router.push("/profileform");
        } else {
          if (isMarketplace) {
            router.push("/marketplace");
          } else {
            router.push("/home");
          }
        }
      } else {
        router.push("/profileform");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError("");
    setMessage("");

    try {
      if (auth.currentUser) {
        console.log("auth current user ");
        await sendEmailVerification(auth.currentUser);
        setMessage("Verification email sent. Please check your inbox.");
      }
    } catch (err) {
      setError("Failed to send verification email. Try again later.");
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              Welcome Back
            </h2>
          </div>

          <div className="p-6 md:p-8">
            {/* Messages */}
            {(message || error) && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                  message
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm">{message || error}</p>
              </div>
            )}

            {!showPopup ? (
              <form onSubmit={handleSignin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg  focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                      placeholder="Enter your email"
                    />
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg  focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                      placeholder="Create a password"
                    />
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-[#8163e9] hover:text-[#6f51d9] transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#8163e9] flex items-center justify-center mb-4">
                    <Timer className="w-10 h-10 text-[#8163e9]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Email Not Verified
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Please verify your email address to continue. Check your
                    inbox for the verification link.
                  </p>
                </div>

                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </button>

                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {!showPopup && (
              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-[#8163e9] hover:text-[#6f51d9] transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
