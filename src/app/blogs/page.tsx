"use client";

import BlogCard from "@/components/BlogCard";
import { Blog, getAllBlogs } from "@/data/blogs";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Blogs = () => {
  const featuredPost = {
    id: 1,
    title: "How to Find Reliable Rideshare Partners on Campus",
    excerpt:
      "Essential tips for connecting with trustworthy fellow students for safe and convenient campus rides.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    author: "Sarah Johnson",
    date: "June 15, 2024",
    readTime: "8 min read",
    category: "Safety",
    slug: "test",
  };

  // const blogPosts = [
  //   {
  //     id: 2,
  //     title: "Splitting Gas Money: A Student's Guide",
  //     excerpt: "Learn the best ways to fairly divide ride costs with your campus rideshare group without the awkwardness.",
  //     image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
  //     author: "Mike Chen",
  //     date: "June 12, 2024",
  //     readTime: "6 min read",
  //     category: "Finance",
  //     slug:"test"
  //   },
  //   {
  //     id: 3,
  //     title: "Campus Safety: Rideshare Best Practices",
  //     excerpt: "Stay safe while sharing rides with fellow students. Essential safety tips every college student should know.",
  //     image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
  //     author: "Emma Davis",
  //     date: "June 10, 2024",
  //     readTime: "7 min read",
  //     category: "Safety",
  //     slug:"test"
  //   },
  //   {
  //     id: 4,
  //     title: "Making Friends Through Campus Rideshares",
  //     excerpt: "How sharing rides to class and events can help you build lasting friendships during your college years.",
  //     image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=600&q=80",
  //     author: "David Wilson",
  //     date: "June 8, 2024",
  //     readTime: "5 min read",
  //     category: "Community",
  //     slug:"test"
  //   },
  //   {
  //     id: 5,
  //     title: "Weekend Trip Planning for Student Groups",
  //     excerpt: "Organize epic weekend getaways with your classmates using smart rideshare coordination and planning.",
  //     image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
  //     author: "Jennifer Lee",
  //     date: "June 5, 2024",
  //     readTime: "9 min read",
  //     category: "Travel",
  //     slug:"test"
  //   },
  //   {
  //     id: 6,
  //     title: "Getting Home for the Holidays: Student Edition",
  //     excerpt: "Navigate holiday travel on a student budget by coordinating rides with classmates heading your way.",
  //     image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  //     author: "Alex Rodriguez",
  //     date: "June 3, 2024",
  //     readTime: "6 min read",
  //     category: "Travel",
  //     slug:"test"
  //   },
  //   {
  //     id: 7,
  //     title: "Campus Events: Coordinate Group Transportation",
  //     excerpt: "Make getting to games, concerts, and campus events easier by organizing rideshares with your friends.",
  //     image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=600&q=80",
  //     author: "Taylor Brown",
  //     date: "June 1, 2024",
  //     readTime: "8 min read",
  //     category: "Campus Life",
  //     slug:"test"
  //   }
  // ];

  const [blogPosts, setBlogPosts] = useState<Blog[]>();

  useEffect(() => {
    const fetchBlogs = async () => {
      const fetchedBlogs = await getAllBlogs();
      if (!fetchedBlogs) {
        toast.error("Error fetching blogs!");
      }
      setBlogPosts(fetchedBlogs);
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Travel Stories & Insights
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Discover expert tips, inspiring stories, and practical advice to
            make your next adventure unforgettable.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Post */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Featured Article
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                  {featuredPost.title}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium text-gray-900">
                    {featuredPost.author}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{featuredPost.date}</span>
                  <span className="mx-2">•</span>
                  <span>{featuredPost.readTime}</span>
                </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Link
                    href={`blogs/test`}
                    className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors rounded-md group/btn"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {blogPosts ? (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Loading posts...</span>
            <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
