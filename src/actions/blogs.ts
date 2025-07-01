import { db, storage } from "@/lib/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

interface Blog {
  title: string,
  excerpt: string,
  content: string,
  author: string,
  category: string,
  image: File | null,
  slug: string
}

// Helper function to generate a slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50) // Limit length
}

export const createBlog = async (blog: Blog) => {
  try {
    // Validate and ensure slug exists
    let slug = blog.slug?.trim()
    
    if (!slug) {
      // Generate slug from title if slug is missing
      slug = generateSlug(blog.title)
    }
    
    if (!slug) {
      throw new Error("Unable to generate a valid slug from the blog title")
    }

    const createdAt = new Date().toISOString()
    const updatedAt = new Date().toISOString()

    let imageUrl = null
    if (blog.image) {
      const storageRef = ref(
        storage,
        `blogs/${slug}/${createdAt}_${blog.image.name}`
      );
      const snapshot = await uploadBytes(storageRef, blog.image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add timestamp and ensure slug is set
    const blogData = {
      ...blog,
      image: imageUrl,
      slug,
      createdAt,
      updatedAt
    }
    
    const blogsRef = doc(db, "blogs", slug)
    await setDoc(blogsRef, blogData)
    
    console.log("Blog created successfully with ID:", slug)
    return { success: true, slug }
    
  } catch (error) {
    console.error("Error creating blog:", error)
    throw error
  }
}

// Alternative: Let Firestore auto-generate the ID
export const createBlogWithAutoId = async (blog: Omit<Blog, 'slug'>) => {
  try {
    const blogsRef = collection(db, "blogs")
    const docRef = doc(blogsRef) // Auto-generates ID
    
    const blogData = {
      ...blog,
      slug: docRef.id, // Use the auto-generated ID as slug
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await setDoc(docRef, blogData)
    
    console.log("Blog created successfully with auto-generated ID:", docRef.id)
    return { success: true, slug: docRef.id }
    
  } catch (error) {
    console.error("Error creating blog:", error)
    throw error
  }
}