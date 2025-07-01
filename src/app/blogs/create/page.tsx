"use client";
import { createBlog } from "@/actions/blogs";
import { useAuth } from "@/context/AuthContext";
import { User, getUserById } from "@/data/users";
import { parseJwt } from "@/utils/jwt";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CreateBlog = () => {
  const {user} = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    category: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getRole = async () => {
      if (user) {
        const fetch = await getUserById(user.uid)
        if (fetch.error) {
          console.log("no profile found")
          router.push('/blogs')
          return
        }
        const profile = fetch as User
        setUserRole(profile.role)

      }
    }
    
    getRole()
  }, [user]);


  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Generate slug from title
      const slug = generateSlug(formData.title);
      
      if (!slug) {
        alert("Please enter a valid title");
        return;
      }

      console.log("Submitting blog with data:", { ...formData, slug });

      // Create the blog
      const result = await createBlog({
        ...formData,
        slug
      });

      console.log("Blog created:", result);
      
      // Reset form
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: "",
        image: null
      });
      
      router.push(`/blogs/${slug}`)
      
    } catch (error) {
      console.error("Error creating blog:", error);
      alert("Error creating blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCancel = () => {
    // Navigate back to blogs (simulated)
    router.push("/blogs");
  };

  if (userRole !== "ADMIN") {
    return <div className="min-h-screen bg-gray-50">NOT ADMIN</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create New Blog Post
          </h1>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog post title"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="excerpt"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
              >
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Brief description of your blog post"
                rows={3}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-vertical"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your blog post content here..."
                rows={10}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-vertical"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="author"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
                >
                  Author
                </label>
                <input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
                >
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Safety, Finance, Community"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="image"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2"
              >
                Image
              </label>
              <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="mt-1 w-full"
                  />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-700"
              >
                Create Blog Post
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
