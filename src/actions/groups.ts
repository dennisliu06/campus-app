"use server";
import { db, storage } from "@/lib/firebase";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
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
  name: string;
  destination: string;
  description: string;
  color: string;
  image: File;
  ownerId: string;
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
  const createdAt = serverTimestamp();

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
  const groupDocRef = doc(db, "groups", groupId);

  try {
    await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupDocRef);
      if (!groupDoc.exists()) {
        return { error: "Group does not exist!" };
      }

      const group = groupDoc.data();
      const currentMembers = group.members;
      const newMembers = [...currentMembers, userId];
      transaction.update(groupDocRef, { members: newMembers });
    });
    return { success: "Joined group!" };
  } catch (e) {
    console.log("error: ", e);
  }
};

interface CreateRideForm {
  groupId: string;
  driver: Rider;
  vibe: string;
  carId: string;
  maxRiders: number;
  riders?: Rider[];
  startDateTime: string;
}

interface Rider {
  id: string;
  name: string;
  profileUrl: string;
}

export const createRide = async ({
  groupId,
  driver,
  vibe,
  carId,
  maxRiders,
  riders,
  startDateTime,
}: CreateRideForm) => {
  const createdAt = serverTimestamp();

  if (!riders) {
    riders = [];
  }

  const rideData = {
    groupId,
    driver,
    vibe,
    carId,
    maxRiders,
    riders,
    createdAt,
    startDateTime,
  };

  const ridesCollectionRef = collection(db, "groups", groupId, "rides");

  try {
    const rideDocRef = await addDoc(ridesCollectionRef, rideData);

    return { success: "Ride added!", id: rideDocRef.id };
  } catch (e) {
    console.log(e);
  }
};

export const joinRide = async (
  groupId: string,
  rideId: string,
  rider: Rider
) => {
  const ridesCollectionRef = collection(db, "groups", groupId, "rides");
  const rideDocRef = doc(ridesCollectionRef, rideId);

  try {
    let inRide = false;
    let rideExists = true;
    await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideDocRef);
      if (!rideDoc.exists()) {
        rideExists = false;
        return;
      }

      const ride = rideDoc.data();

      if (
        (ride.riders && ride.riders.some((r: Rider) => r.id === rider.id)) ||
        ride.driver.id == rider.id
      ) {
        inRide = true;
        return;
      }

      const riderList = ride.riders;

      riderList.push(rider);

      transaction.update(rideDocRef, { riders: riderList });
    });

    if (inRide) {
      return { error: "Already in this ride!" };
    }
    if (!rideExists) {
      return { error: "This ride doesnt exist!" };
    }

    return { success: "Joined ride!" };
  } catch (e) {
    console.log(e);
  }

  // if (!rideDoc.exists()) {
  //   return { error: "Ride doesnt exist!" };
  // }

  // const ride = rideDoc.data();
};

export const deleteRide = async (rideId: string, groupId: string) => {
  const ridesCollectionRef = collection(db, "groups", groupId, "rides");
  const rideDocRef = doc(ridesCollectionRef, rideId);

  try {
    await deleteDoc(rideDocRef);

    return { success: "Ride successfully deleted!" };
  } catch (e: any) {
    return { error: e.message };
  }
};

export const leaveRide = async (
  rideId: string,
  groupId: string,
  userId: string
) => {
  const ridesCollectionRef = collection(db, "groups", groupId, "rides");
  const rideDocRef = doc(ridesCollectionRef, rideId);

  try {
    let notInRide = false;
    let rideExists = true;

    await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideDocRef);
      if (!rideDoc.exists()) {
        rideExists = false;
        return;
      }

      const ride = rideDoc.data();

      if (
        !(ride.riders && ride.riders.some((r: Rider) => r.id === userId)) &&
        ride.driver.id == userId
      ) {
        notInRide = true;
        return;
      }

      const riderList = ride.riders as Array<Rider>;

      const newRiderList = riderList.filter((r) => r.id != userId);

      transaction.update(rideDocRef, { riders: newRiderList });
    });

    if (notInRide) {
      return { error: "You are not in this ride!" };
    }
    if (!rideExists) {
      return { error: "This ride doesnt exist!" };
    }

    return { success: "Left ride!" };
  } catch (e) {
    console.log(e);
  }
};

export const editRide = async (
  groupId: string,
  rideId: string,
  data: {
    carId: string;
    maxRiders: number;
    vibe: string;
    startDateTime: string;
  }
) => {
  const ridesCollectionRef = collection(db, "groups", groupId, "rides");
  const rideDocRef = doc(ridesCollectionRef, rideId);

  try {
    await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideDocRef)
      if (!rideDoc.exists()) {
        return { error: "This ride does not exist!" }
      }

      transaction.update(rideDocRef, data);
    })
    return { success: "Ride edited!" }
  } catch (e) {
    console.log(e)
  }
};
