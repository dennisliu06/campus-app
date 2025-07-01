"use client";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, User, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Blog, getBlogBySlug } from "@/data/blogs";
import Image from "next/image";

const BlogPost = () => {
  const { blogId } = useParams();
  const [blogPost, setBlog] = useState<Blog>();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!blogId) {
        console.log("NO SLUG FOUND");
        return;
      }

      const fetchedBlog = await getBlogBySlug(
        Array.isArray(blogId) ? blogId[0] : blogId
      );

      if (!fetchedBlog) {
        console.log("no blog fetched");
        return;
      }
      setBlog(fetchedBlog);
    };
    fetchBlog();
  }, []);

  if (!blogPost)
    return <div className="min-h-screen bg-gray-50">no blog found :</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/blogs"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative w-full h-64 md:h-96">
            {" "}
            {/* Add 'relative' */}
            {blogPost.image ? (
              <Image
                src={blogPost.image}
                alt={blogPost.title}
                fill // Use 'fill' instead of layout="fill" in Next.js 13+
                className="object-cover" // Move object-cover to Image component
              />
            ) : (
              <Image
                src="/bus.jpg"
                alt={blogPost.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span className="font-medium text-gray-900">
                  {blogPost.author}
                </span>
              </div>
              {/* READ TIME ADD LATER */}
              {/* <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{blogPost.readTime}</span>
              </div> */}
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                <span>{blogPost.category}</span>
              </div>
              <span>{blogPost.createdAt}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              {blogPost.title}
            </h1>

            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Read More Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
