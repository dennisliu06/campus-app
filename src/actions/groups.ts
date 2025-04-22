"use server";

import { db, storage } from "@/lib/firebase";
import { Timestamp, addDoc, collection, doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { nanoid } from "nanoid";

/**
 * @typedef CreateGroupForm 
 * @property {string} name - Name of the group
 * @property {string} destination - Destination of the ride
 * @property {string} description - Description of the group
 * @property {string} color - Color tag (e.g. 'red', 'yellow')
 * @property {string|null} imageUrl - Optional image URL for the group
 * @property {string} ownerId - User ID of the group creator
 * 
 * @typedef ErrorMessage
 * @property {string} error - Error message
 * 
 * @typedef SuccessMessage
 * @property {string} success- Success message
 * 
 * @typedef ReturnedMessage
 * @property {ErrorMessage | SuccessMessage} message - Message returned
 */


interface createGroupForm {
  name: string,
  destination: string,
  description: string,
  color: string,
  image: File,
  ownerId: string
}

/**
 * 
 * @param {CreateGroupForm} param0 An object containing the name, destination, description, color, image, and owner ID
 * @returns {ReturnedMessage} A message based off if the group was created
 */
export const createGroup = async ({
  name,
  destination,
  description,
  color,
  image,
  ownerId,
}: createGroupForm) => {
  const groupId = nanoid(10);
  let imageUrl = null;
  const createdAt = serverTimestamp()

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


/**
 * 
 * @param {string} userId The user's ID
 * @param {string} groupId The group's ID
 * @returns {ReturnedMessage} Message based off if the user is able to join
 */
export const addMember = async (userId: string, groupId: string) => {
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

interface CreateRideForm {
  groupId: string,
  driver: Rider,
  vibe: string,
  carId: string,
  maxRiders: number,
  riders?: Rider[],
}

interface Rider {
  id: string,
  name: string,
  profileUrl: string,
}

export const createRide = async ({
  groupId,
  driver,
  vibe,
  carId,
  maxRiders,
  riders
}: CreateRideForm) => {
  const createdAt = serverTimestamp()

  if (!riders) { riders = [] }

  console.log("Driver, ", driver)

  const rideData = {
    groupId,
    driver,
    vibe,
    carId,
    maxRiders,
    riders,
    createdAt,
  }

  const ridesCollectionRef = collection(db, "groups", groupId, "rides")

  try {
    const rideDocRef = await addDoc(ridesCollectionRef, rideData)

    return { success: "Ride added!", id: rideDocRef.id}

  } catch(e) {
    console.log(e)
  }
}