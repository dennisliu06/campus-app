"use server";

import { db, storage } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { nanoid } from "nanoid";

export const createGroup = async ({
  name,
  destination,
  description,
  color,
  image,
  ownerId,
}) => {
  const groupId = nanoid(10);
  let imageUrl = null;
  const createdAt = serverTimestamp()

  // TODO: add check to see if a groupId already exists
  if (!name) return { error: "Name is required to make a group!" };
  if (!destination)
    return { error: "Destination is required to make a group!" };
  if (!color) return { error: "Color is required to make a group!" };
  if (!ownerId) return { error: "Error making group!" };
  if (!description) {
    description = "";
  }

  if (image) {
    const storageRef = ref(
      storage,
      `groups/${groupId}/${createdAt}_${image.name}`
    );
    const snapshot = await uploadBytes(storageRef, image);
    imageUrl = await getDownloadURL(snapshot.ref);
  }

  const groupRef = doc(db, "groups", groupId);

  //   // Optional: check for collision
  //   const existingDoc = await getDoc(groupRef);
  //   if (existingDoc.exists()) {
  //     groupId = nanoid(11); // fallback if there's a collision
  //   }

  const groupData = {
    name,
    destination,
    description,
    color,
    imageUrl,
    ownerId,
    members: [ownerId],
    createdAt,
  };

  try {
    await setDoc(groupRef, groupData);

    console.log(groupRef.id);
    return { success: "Group created!", id: groupRef.id };
  } catch (e) {
    console.log(e);

    return { error: "An error occurred!" };
  }
};

export const addMember = async (userId, groupId) => {
  const groupDocRef = doc(db, "groups", groupId)

  try {
    await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupDocRef)
      if (!groupDoc.exists()) {
        return { error: "Group does not exist!" }
      }

      const group = groupDoc.data()
      const currentMembers = group.members
      const newMembers = [...currentMembers, userId]
      transaction.update(groupDocRef, { members: newMembers } )
    })
    console.log("joined group")
    return { success: "Joined group!" }
  } catch (e) {
    console.log("error: ", e)
  }
}