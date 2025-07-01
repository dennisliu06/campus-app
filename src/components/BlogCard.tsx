import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
}

interface Blog {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogCardProps {
  post: Blog;
}

const BlogCard = ({ post }: BlogCardProps) => {

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <div className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105">
          {post.image ? (
            <Image
            src={post.image}
            alt={post.title}
            layout="fill"
            objectFit="cover"
          />
          ) : (
            <Image
              src="/bus.jpg"
              alt={post.title}
              layout="fill"
              objectFit="cover"
            />
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Read Time */}
        {/* <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">{post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.createdAt}</span>
          </div>
          <span className="text-sm text-gray-500">{post.readTime}</span>
        </div> */}

        <div className="pt-4 border-t border-gray-100">
          <Link
            href={`blogs/${post.slug}`}
            className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors rounded-md group/btn"
          >
            <span>Read Article</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
