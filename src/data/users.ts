import { db } from "@/lib/firebase";
import { collection, doc, getDoc } from "firebase/firestore";

export async function getUserById(userId: string) {
  const userRef = collection(db, "users")

  try {
    const userDocRef = doc(userRef, userId)

    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return { error: "User doesnt exist!" }
    }

    return { id: userDoc.id, ...userDoc.data() }
  } catch (e: any) {
    console.log(e)

    return { error: `Error: ${e.message}` }
  }
}