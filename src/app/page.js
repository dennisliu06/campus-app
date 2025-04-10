import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[85vh] bg-gradient-to-b from-[#8163e9] to-[#6f54c9] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Travel Together,{" "}
            <span className="text-[#ffd700]">Save Together</span>
          </h1>
          <p className="text-lg md:text-xl mb-12 max-w-2xl text-white/90">
            Join millions of people who've found their perfect travel companion.
            Share rides, split costs, and make new friends along the way.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              href="/register"
              className="bg-white text-[#8163e9] px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Trust Banner */}
      <div className="bg-gray-50 py-8 text-center">
        <div className="container mx-auto px-4">
          <p className="text-gray-600">
            Trusted by millions of users worldwide • Secure payments • 24/7
            customer support
          </p>
        </div>
      </div>
    </div>
  );
}
