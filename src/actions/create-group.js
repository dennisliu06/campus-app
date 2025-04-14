import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { nanoid } from 'nanoid'

export const createGroup = ({ name, color, imageUrl, ownerId }) => {
    
    const groupId = nanoid(10)
    
    // TODO: add check to see if a groupId already exists

    if (!name) {
        return { message: "Name is required to make a group!" }
    }

    if (!color) {
        return { message: "Color is required to make a group!" }
    }

    if (!imageUrl) {
        // add some default image here
        imageUrl = null
    }

    if (!ownerId) {
        return { message: "Error making group!" }
    }

    const groupData = {
        name,
        color,
        imageUrl,
        ownerId,
        members: []
    }

    try {
        const groupDocRef = setDoc(doc(db, "groups", groupId), groupData);

        console.log(groupDocRef)

        return { message: "Group created!" }
    } catch (e) {
        console.log(e);
        
        return { message: "An error occurred!" }
    }
}

