import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";

export async function getGroupsByUserId(userId) {
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, orderBy("createdAt", "desc"), where("members", "array-contains-any", [userId]));

    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log("groups: ", groups)
    return groups
}

export async function getGroupById(groupId) {
    const docRef = doc(db, "groups", groupId);
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) { return { error: `Group code ${groupId} doesnt exist!` } }
    
    const group = {id: docSnap.id, ...docSnap.data()}
    return group
}   