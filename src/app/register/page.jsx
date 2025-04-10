"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, Mail, Lock, Timer, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [isContinueEnabled, setIsContinueEnabled] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let interval;
    if (timer > 0 && isRegistered) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      clearInterval(interval);
      setIsResendEnabled(true);
    }
    return () => clearInterval(interval);
  }, [timer, isRegistered]);

  const validateEmail = (email) => {
    // Check if email contains .edu
    if (!email.toLowerCase().includes(".edu")) {
      return "Only .edu email addresses are allowed";
    }
    return null;
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    // Validate email domain
    // const emailError = validateEmail(email);
    // if (emailError) {
    //   setError(emailError);
    //   setIsLoading(false);
    //   return;
    // }

    // // Validate password
    // const passwordError = validatePassword(password);
    // if (passwordError) {
    //   setError(passwordError);
    //   setIsLoading(false);
    //   return;
    // }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userObj = userCredential.user;

      if (userObj) {
        // Send verification email
        await sendEmailVerification(userObj);
        // Create a user document in Firestore under "users" collection
        await setDoc(doc(db, "users", userObj.uid), {
          email: userObj.email,
          uid: userObj.uid,
          createdAt: new Date().toISOString(),
        });
      }

      setMessage("Account created! Check your email for verification.");
      setError("");
      setIsContinueEnabled(true);
      setIsResendEnabled(false);
      setTimer(60);
      setIsRegistered(true);

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      // router.push("/profileform");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setIsLoading(false);
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const userObj = auth.currentUser;
      if (userObj) {
        await sendEmailVerification(userObj);
        setMessage("Verification email sent again!");
        setIsResendEnabled(false);
        setTimer(60);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setIsLoading(false);
  };

  const handleContinue = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          router.push("/profileform");
        } else {
          setError("Please verify your email before continuing");
          await auth.signOut();
          router.push("/login");
        }
      } else {
        setError("User not found. Please log in again.");
        router.push("/login");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#8163e9] py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              Create Account
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
                  <Loader2 className="w-5 h-5 shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm">{message || error}</p>
              </div>
            )}

            {!isRegistered ? (
              <form onSubmit={handleSignup} className="space-y-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg  focus:ring-[#8163e9] focus:border-transparent transition-colors text-gray-900"
                      placeholder="Confirm your password"
                    />
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#8163e9] flex items-center justify-center mb-4">
                    <Timer className="w-10 h-10 text-[#8163e9]" />
                  </div>
                  <div className="text-4xl font-bold text-[#8163e9] mb-2">
                    {timer}s
                  </div>
                  <p className="text-gray-600 text-center">
                    Please check your email to verify your account
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={!isResendEnabled || isLoading}
                    className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Resend Email"
                    )}
                  </button>
                  <button
                    onClick={handleContinue}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#8163e9] hover:text-[#6f51d9] transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
