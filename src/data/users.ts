import { db } from "@/lib/firebase";
import { Timestamp, collection, doc, getDoc } from "firebase/firestore";

export interface User {
  bio: string,
  createAt: Timestamp,
  email: string
  fullName: string
  location: string
  profilePicUrl: string
  role?: string
  uid: string
  university: string
  updatedAt: Timestamp
}

export async function getUserById(userId: string) {
  const userRef = collection(db, "users")

  try {
    const userDocRef = doc(userRef, userId)

    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return { error: "User doesnt exist!" }
    }

    return { id: userDoc.id, ...userDoc.data() as User }
  } catch (e: any) {
    console.log(e)

    return { error: `Error: ${e.message}` }
  }
}