import { db } from "@/lib/firebase";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";

/**
 * @typedef {Object} Group
 * @property {string} id - Unique group ID
 * @property {string} name - Name of the group
 * @property {string} destination - Destination of the ride
 * @property {string} description - Description of the group
 * @property {string} color - Color tag (e.g. 'red', 'yellow')
 * @property {string|null} imageUrl - Optional image URL for the group
 * @property {string} ownerId - User ID of the group creator
 * @property {string[]} members - Array of user IDs in the group
 * @property {firebase.firestore.Timestamp} createdAt - Firestore timestamp of group creation
 */

/**
 * @typedef {Object} GroupError
 * @property {string} error - Error message
 */

/**
 * @typedef {Group[] | GroupError} MaybeGroups
 * @typedef {Group | GroupError} MaybeGroup
 */

/**
 * Returns all groups based off the user ID
 * @param {string} userId The user's UID
 * @returns {Promise<MaybeGroups>} All groups or error if not found
 */
export async function getGroupsByUserId(userId: string) {
  const groupsRef = collection(db, "groups");
  const q = query(
    groupsRef,
    orderBy("createdAt", "desc"),
    where("members", "array-contains-any", [userId])
  );

  const querySnapshot = await getDocs(q);
  const groups = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return groups;
}

/**
 * Returns a group with the given group ID
 * @param {string} groupId The group's id
 * @returns {Promise<MaybeGroup>} A group or an error if not found
 */
export async function getGroupById(groupId: string) {
  try {
    const docRef = doc(db, "groups", groupId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { error: `Group code ${groupId} doesn't exist!` };
    }

    const group = { id: docSnap.id, ...docSnap.data() };
    return group;
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

interface Ride {
  id: string;
  groupId: string;
  driver: Rider;
  vibe: string;
  carId: string;
  maxRiders: number;
  riders: Rider[];
  createdAt: Timestamp;
}

interface Rider {
  id: string;
  name: string;
  profileUrl: string;
}

export async function getRidesByGroupId(
  groupId: string,
  setAllRides: Dispatch<SetStateAction<Ride[]>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
) {
  try {
    const ridesRef = query(
      collection(db, "groups", groupId, "rides"),
      orderBy("createdAt", "desc") // or "asc" for oldest first
    );

    const unsubscribe = onSnapshot(ridesRef, (querySnapshot) => {
      const newRides: Ride[] = [];
      querySnapshot.forEach((doc) => {
        newRides.push({ id: doc.id, ...(doc.data() as Omit<Ride, "id">) });
      });
      setAllRides(newRides);
      setLoading(false)
    });

    return unsubscribe;
  } catch (e: any) {
    console.log(e.message);
    return { error: e.message || "Unknown error" };
  }
}


export async function checkUserInRides(userId: string, groupId: string) {
  const rideDocRef = collection(db, "groups", groupId, "rides")
  const rideDocs = await getDocs(rideDocRef)

  for (const rideDoc of rideDocs.docs) {
    const ride = rideDoc.data() as Ride


    const isDriver = ride.driver.id === userId

    const isRider = ride.riders.some((r: any) => r.id === userId)


    if (isDriver || isRider) {
      // user already in a ride
      return true
    }
  }

  // not in any rides
  return false
}