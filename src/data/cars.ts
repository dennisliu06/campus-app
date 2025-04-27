import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

interface CarForm {
  id: string,
  name: string,
  maxCapacity: number
}

export const getCarsByUserId = async (userId: string): Promise<CarForm[]> => {
  const carsCollectionRef = collection(db, "cars")
  
  try {
    const q = query(carsCollectionRef, where("ownerId", "==", userId))
    const querySnapshot = await getDocs(q)

    const rides = querySnapshot.docs.map((doc) => {
      const { carName, maxCapacity } = doc.data()

      return {
        id: doc.id,
        name: carName,
        maxCapacity,
      }
    })

    return rides
  } catch (e) {
    console.log("Failed to fetch cars: ", e);
    return []
  }
}