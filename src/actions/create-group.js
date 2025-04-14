import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

export const createGroup = async ({
  name,
  destination,
  description,
  color,
  imageUrl,
  ownerId,
}) => {
  const groupId = nanoid(10);

  // TODO: add check to see if a groupId already exists
  if (!name) return { error: "Name is required to make a group!" };
  if (!destination)
    return { error: "Destination is required to make a group!" };
  if (!color) return { error: "Color is required to make a group!" };
  if (!ownerId) return { error: "Error making group!" };
  if (!description) { description = "" };
  if (!imageUrl) { imageUrl = null }


  const groupRef = doc(db, "users", ownerId, "groups", groupId);

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
    createdAt: Date.now()
  };

  try {
    const groupDocRef = await setDoc(
      groupRef,
      groupData
    );

    console.log(groupDocRef);

    console.log("SUCCESS");
    return { success: "Group created!", groupDocRef };
  } catch (e) {
    console.log(e);

    return { error: "An error occurred!" };
  }
};
