import { db } from "@/lib/firebase"
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData 
} from "firebase/firestore"

export interface Blog {
  id: string;
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

// Get all blogs
export const getAllBlogs = async (): Promise<Blog[]> => {
  try {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    console.log(`Fetched ${blogs.length} blogs`);
    return blogs;
  } catch (error) {
    console.error("Error fetching all blogs:", error);
    throw error;
  }
};

// Get a single blog by slug
export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  try {
    if (!slug) {
      throw new Error("Slug is required");
    }

    const blogRef = doc(db, "blogs", slug);
    const blogSnap = await getDoc(blogRef);
    
    if (blogSnap.exists()) {
      return {
        id: blogSnap.id,
        ...blogSnap.data()
      } as Blog;
    } else {
      console.log("No blog found with slug:", slug);
      return null;
    }
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    throw error;
  }
};

// Get blogs by category
export const getBlogsByCategory = async (category: string): Promise<Blog[]> => {
  try {
    if (!category) {
      throw new Error("Category is required");
    }

    const blogsRef = collection(db, "blogs");
    const q = query(
      blogsRef, 
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    console.log(`Fetched ${blogs.length} blogs for category: ${category}`);
    return blogs;
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    throw error;
  }
};

// Get blogs by author
export const getBlogsByAuthor = async (author: string): Promise<Blog[]> => {
  try {
    if (!author) {
      throw new Error("Author is required");
    }

    const blogsRef = collection(db, "blogs");
    const q = query(
      blogsRef, 
      where("author", "==", author),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    console.log(`Fetched ${blogs.length} blogs for author: ${author}`);
    return blogs;
  } catch (error) {
    console.error("Error fetching blogs by author:", error);
    throw error;
  }
};

// Get recent blogs with limit
export const getRecentBlogs = async (limitCount: number = 10): Promise<Blog[]> => {
  try {
    const blogsRef = collection(db, "blogs");
    const q = query(
      blogsRef, 
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    console.log(`Fetched ${blogs.length} recent blogs`);
    return blogs;
  } catch (error) {
    console.error("Error fetching recent blogs:", error);
    throw error;
  }
};

// Get paginated blogs
export const getPaginatedBlogs = async (
  limitCount: number = 10, 
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ blogs: Blog[], lastDoc?: QueryDocumentSnapshot<DocumentData> }> => {
  try {
    const blogsRef = collection(db, "blogs");
    let q = query(
      blogsRef, 
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    // If we have a lastDoc, start after it for pagination
    if (lastDoc) {
      q = query(
        blogsRef, 
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    // Get the last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    console.log(`Fetched ${blogs.length} blogs (paginated)`);
    return { 
      blogs, 
      lastDoc: lastVisible 
    };
  } catch (error) {
    console.error("Error fetching paginated blogs:", error);
    throw error;
  }
};

// Search blogs by title (simple text search)
export const searchBlogsByTitle = async (searchTerm: string): Promise<Blog[]> => {
  try {
    if (!searchTerm) {
      return [];
    }

    // Note: Firestore doesn't have full-text search built-in
    // This is a simple prefix search - for better search, consider Algolia or similar
    const blogsRef = collection(db, "blogs");
    const q = query(
      blogsRef,
      where("title", ">=", searchTerm),
      where("title", "<=", searchTerm + '\uf8ff'),
      orderBy("title"),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    
    const blogs: Blog[] = [];
    querySnapshot.forEach((doc) => {
      blogs.push({
        id: doc.id,
        ...doc.data()
      } as Blog);
    });
    
    console.log(`Found ${blogs.length} blogs matching: ${searchTerm}`);
    return blogs;
  } catch (error) {
    console.error("Error searching blogs:", error);
    throw error;
  }
};

// Get all unique categories
export const getBlogCategories = async (): Promise<string[]> => {
  try {
    const blogsRef = collection(db, "blogs");
    const querySnapshot = await getDocs(blogsRef);
    
    const categories = new Set<string>();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    const uniqueCategories = Array.from(categories).sort();
    console.log(`Found ${uniqueCategories.length} unique categories`);
    return uniqueCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Get blog count
export const getBlogCount = async (): Promise<number> => {
  try {
    const blogsRef = collection(db, "blogs");
    const querySnapshot = await getDocs(blogsRef);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting blog count:", error);
    throw error;
  }
};