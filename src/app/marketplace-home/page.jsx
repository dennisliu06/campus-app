import Link from "next/link";
import { ArrowRight, ShoppingBag, Tag, Users } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Campus Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Buy, sell, and trade items with students from your university. The
            safe and easy way to find what you need on campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md font-medium bg-[#8163e9] text-white hover:bg-[#7a67be] h-12 px-6 text-base"
            >
              Sign in to get started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md font-medium border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 h-12 px-6 text-base"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-[#8163e9]" />
            </div>
            <h3 className="text-xl text-black font-semibold mb-3">
              University Verified
            </h3>
            <p className="text-black">
              Connect with verified students from your university for safer
              transactions.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-8 w-8 text-[#8163e9]" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">
              Easy Listings
            </h3>
            <p className="text-black">
              Create listings in seconds with our simple interface. Add photos,
              descriptions, and set your price.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="h-8 w-8 text-[#8163e9]" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">
              Categories
            </h3>
            <p className="text-black">
              Find exactly what you need with organized categories for
              textbooks, electronics, furniture, and more.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#8163e9] rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start buying and selling?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join your campus community today and discover items for sale from
            students just like you.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-md font-medium bg-white text-[#8163e9] hover:bg-gray-100 h-12 px-6 text-base"
          >
            Sign in now
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#8163e9] text-white flex items-center justify-center text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-black mb-2 text-center">
              Create an account
            </h3>
            <p className="text-black text-center">
              Sign up with your university email to join your campus
              marketplace.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#8163e9] text-white flex items-center justify-center text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-xl text-black font-semibold mb-2 text-center">
              Browse or list items
            </h3>
            <p className=" text-black text-center">
              Search for items you need or create listings for items you want to
              sell.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#8163e9] text-white flex items-center justify-center text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-xl text-black font-semibold mb-2 text-center">
              Connect and exchange
            </h3>
            <p className="text-black text-center">
              Message other students and arrange safe on-campus meetups to
              complete transactions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
