import Link from "next/link";
import { Shield, Users, Globe, ChevronLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="container px-4 pt-3 pb-3">
        <Link
          href="/my-profile"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Go Back</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative bg-[#8163e9] text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Connecting University Students Through Safe Rides
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              We're building the future of student transportation, making it
              easier and safer for students to travel between campuses and
              cities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="bg-white text-[#8163e9] px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Join Our Community
              </Link>
              <Link
                href="#learn-more"
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24" id="learn-more">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600">
              To create a safe, reliable, and affordable transportation network
              for university students, reducing the stress of travel while
              building meaningful connections within the student community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#8163e9]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Safety First
              </h3>
              <p className="text-gray-600">
                Comprehensive verification process and real-time tracking ensure
                safe journeys for all users.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#8163e9]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Community Driven
              </h3>
              <p className="text-gray-600">
                Building connections between students while making travel more
                accessible and affordable.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#8163e9]/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-[#8163e9]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sustainability
              </h3>
              <p className="text-gray-600">
                Reducing carbon footprint through ride sharing and promoting
                eco-friendly transportation options.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
