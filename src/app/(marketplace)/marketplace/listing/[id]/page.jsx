"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ChevronLeft,
  Tag,
  MapPin,
  Clock,
  MessageSquare,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  Heart,
  User,
  CheckCircle,
  Check,
} from "lucide-react";

// Categories mapping
const categories = {
  "sports-tickets": "Sports Tickets",
  "dorm-supplies": "Dorm Supplies",
  textbooks: "Textbooks & School Supplies",
  electronics: "Electronics & Gadgets",
  clothing: "Clothing & Accessories",
  furniture: "Furniture & Appliances",
  miscellaneous: "Miscellaneous",
};

// Condition mapping
const conditions = {
  new: "New",
  "like-new": "Used - Like New",
  good: "Used - Good",
  fair: "Used - Fair",
  poor: "Used - Poor",
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const listingDoc = await getDoc(doc(db, "marketplace_listings", id));

        if (!listingDoc.exists()) {
          setError("Listing not found");
          setLoading(false);
          return;
        }

        const listingData = { id: listingDoc.id, ...listingDoc.data() };
        setListing(listingData);

        // Fetch seller details
        if (listingData.sellerId) {
          const sellerDoc = await getDoc(
            doc(db, "users", listingData.sellerId)
          );
          if (sellerDoc.exists()) {
            setSeller({ id: sellerDoc.id, ...sellerDoc.data() });
          }
        }

        // Check if the item is saved by the current user
        if (user) {
          const savedItemRef = doc(db, "saved_items", `${user.uid}_${id}`);
          const savedItemDoc = await getDoc(savedItemRef);
          setIsSaved(savedItemDoc.exists());
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError("Failed to load listing details");
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, user]);

  const handleDeleteListing = async () => {
    if (!user || (listing && listing.sellerId !== user.uid)) {
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(true);
        await deleteDoc(doc(db, "marketplace_listings", id));
        router.push("/marketplace/my-listings");
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert("Failed to delete listing. Please try again.");
        setIsDeleting(false);
      }
    }
  };

  const handleSaveItem = async () => {
    if (!user) {
      router.push(`/login?redirect=/marketplace/listing/${id}`);
      return;
    }

    try {
      setSavingItem(true);
      const savedItemRef = doc(db, "saved_items", `${user.uid}_${id}`);

      if (isSaved) {
        // Unsave the item
        await deleteDoc(savedItemRef);
        setIsSaved(false);
      } else {
        // Save the item
        await setDoc(savedItemRef, {
          userId: user.uid,
          listingId: id,
          title: listing.title,
          price: listing.price,
          imageUrl:
            listing.imageUrls && listing.imageUrls.length > 0
              ? listing.imageUrls[0]
              : null,
          category: listing.category,
          condition: listing.condition,
          savedAt: serverTimestamp(),
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error saving/unsaving item:", err);
      alert("Failed to save item. Please try again.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/marketplace/listing/${id}`);
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      setSendingMessage(true);

      // Check if a chat already exists between these users
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingChatId = null;

      // Find a chat that contains both the current user and the seller
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(listing.sellerId)) {
          existingChatId = doc.id;
        }
      });

      let chatId;

      if (existingChatId) {
        // Use existing chat
        chatId = existingChatId;

        // Update the existing chat
        await setDoc(
          doc(db, "chats", chatId),
          {
            updatedAt: serverTimestamp(),
            lastMessage: message,
            lastMessageSenderId: user.uid,
            lastMessageSeen: false,
            [`unreadCount.${listing.sellerId}`]:
              (querySnapshot.docs.find((d) => d.id === chatId)?.data()
                ?.unreadCount?.[listing.sellerId] || 0) + 1,
          },
          { merge: true }
        );
      } else {
        // Create a new chat
        const chatRef = await addDoc(collection(db, "chats"), {
          participants: [user.uid, listing.sellerId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: message,
          lastMessageSenderId: user.uid,
          lastMessageSeen: false,
          unreadCount: {
            [listing.sellerId]: 1,
          },
          // Add these two fields:
          chatType: "marketplace",
          listingId: id,
        });
        chatId = chatRef.id;
      }

      // Add the message to the chat
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: message,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        seen: false,
        seenAt: null,
      });

      // Create a notification for the seller
      await addDoc(collection(db, "notifications"), {
        userId: listing.sellerId,
        title: `New message about "${listing.title}"`,
        message: `${
          user.displayName || "Someone"
        } is interested in your listing: "${message.substring(0, 50)}${
          message.length > 50 ? "..." : ""
        }"`,
        read: false,
        createdAt: serverTimestamp(),
        chatId: chatId,
        type: "chat",
      });

      setMessageSent(true);
      setMessage("");
      setSendingMessage(false);

      // Redirect to chat after a short delay
      setTimeout(() => {
        router.push(`/chat/${chatId}`);
      }, 1500);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
      setSendingMessage(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="ml-2 text-gray-600">Loading listing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Marketplace
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h2>
            <p className="text-gray-600 mb-6">
              The listing you're looking for might have been removed or doesn't
              exist.
            </p>
            <Link href="/marketplace">
              <button className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#6f51d9] transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const isOwner = user && listing.sellerId === user.uid;

  const handleMarkAsSold = async () => {
    try {
      // Update the listing status to "sold" in Firestore
      const listingRef = doc(db, "marketplace_listings", id);
      await updateDoc(listingRef, {
        status: "sold",
        soldAt: serverTimestamp(),
      });

      // Refresh the page or update UI
      router.refresh();
    } catch (err) {
      console.error("Error marking item as sold:", err);
      alert("Failed to mark item as sold. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Link
          href="/marketplace"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-video bg-gray-100">
                {listing.imageUrls && listing.imageUrls.length > 0 ? (
                  <img
                    src={
                      listing.imageUrls[activeImageIndex] || "/placeholder.svg"
                    }
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {listing.imageUrls && listing.imageUrls.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {listing.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                        index === activeImageIndex
                          ? "border-[#8163e9]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 p-6">
              <div className="flex items-center mb-4">
                <Tag className="h-5 w-5 text-[#8163e9] mr-2" />
                <span className="text-sm text-gray-600">
                  {categories[listing.category] || listing.category}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>

              <div className="flex items-center mb-6">
                <span className="text-3xl font-bold text-[#8163e9]">
                  ${listing.price}
                </span>
                <span className="ml-3 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                  {conditions[listing.condition] || listing.condition}
                </span>
              </div>

              {listing.location && (
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                  <span className="text-gray-700">{listing.location}</span>
                </div>
              )}

              <div className="flex items-start mb-6">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                <span className="text-gray-700">
                  Posted {formatDate(listing.createdAt)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Description
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!isOwner && (
                  <>
                    <button
                      onClick={() => setShowContactForm(!showContactForm)}
                      className="flex-1 bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors flex items-center justify-center"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Contact Seller
                    </button>
                    <button
                      onClick={handleSaveItem}
                      disabled={savingItem}
                      className={`${
                        isSaved
                          ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50`}
                    >
                      {savingItem ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : isSaved ? (
                        <>
                          <Heart className="h-5 w-5 mr-2 fill-pink-700" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Heart className="h-5 w-5 mr-2" />
                          Save
                        </>
                      )}
                    </button>
                  </>
                )}

                {isOwner && (
                  <>
                    <Link
                      href={`/marketplace/edit-listing/${id}`}
                      className="flex-1"
                    >
                      <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                        <Edit className="h-5 w-5 mr-2" />
                        Edit Listing
                      </button>
                    </Link>
                    <button
                      onClick={handleDeleteListing}
                      disabled={isDeleting}
                      className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-5 w-5 mr-2" />
                      )}
                      Delete Listing
                    </button>
                    <button
                      onClick={handleMarkAsSold}
                      className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Mark as Sold
                    </button>
                  </>
                )}
              </div>

              {/* Contact Form */}
              {showContactForm && !isOwner && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Seller
                  </h3>

                  {messageSent ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-green-700 font-medium">
                          Message sent successfully!
                        </p>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        Redirecting to chat...
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage}>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Hi, I'm interested in your "${listing.title}". Is this still available?`}
                        className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-[#8163e9] focus:border-[#8163e9] mb-4"
                        rows={4}
                        required
                      ></textarea>
                      <button
                        type="submit"
                        disabled={sendingMessage || !message.trim()}
                        className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {sendingMessage ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seller Info and Similar Listings */}
          <div className="lg:col-span-1">
            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Seller Information
              </h2>

              <div className="flex items-center mb-4">
                {seller?.profilePicURL ? (
                  <img
                    src={seller.profilePicURL || "/placeholder.svg"}
                    alt={seller.fullName || "Seller"}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900">
                    {seller?.fullName || listing.sellerName || "Anonymous"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {seller?.university || "University Student"}
                  </p>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={async () => {
                    if (!user) {
                      router.push(`/login?redirect=/marketplace/listing/${id}`);
                      return;
                    }

                    try {
                      // Check if a chat already exists between these users
                      const chatsRef = collection(db, "chats");
                      const q = query(
                        chatsRef,
                        where("participants", "array-contains", user.uid)
                      );

                      const querySnapshot = await getDocs(q);
                      let existingChatId = null;

                      // Find a chat that contains both the current user and the seller
                      querySnapshot.forEach((doc) => {
                        const chatData = doc.data();
                        if (chatData.participants.includes(listing.sellerId)) {
                          existingChatId = doc.id;
                        }
                      });

                      let chatId;

                      if (existingChatId) {
                        // Use existing chat
                        chatId = existingChatId;
                      } else {
                        // Create a new chat
                        const chatRef = await addDoc(collection(db, "chats"), {
                          participants: [user.uid, listing.sellerId],
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp(),
                          lastMessage: `Inquiry about: ${listing.title}`,
                          lastMessageSenderId: user.uid,
                          lastMessageSeen: false,
                          unreadCount: {
                            [listing.sellerId]: 1,
                          },
                          // Add these two fields:
                          chatType: "marketplace",
                          listingId: id,
                        });
                        chatId = chatRef.id;

                        // Add initial message to the chat
                        await addDoc(
                          collection(db, "chats", chatId, "messages"),
                          {
                            text: `Hi, I'm interested in your listing: "${listing.title}"`,
                            senderId: user.uid,
                            createdAt: serverTimestamp(),
                            seen: false,
                            seenAt: null,
                          }
                        );

                        // Create a notification for the seller
                        await addDoc(collection(db, "notifications"), {
                          userId: listing.sellerId,
                          title: `New message about "${listing.title}"`,
                          message: `${
                            user.displayName || "Someone"
                          } is interested in your listing.`,
                          read: false,
                          createdAt: serverTimestamp(),
                          chatId: chatId,
                          type: "chat",
                        });
                      }

                      // Navigate to the chat
                      router.push(`/chat/${chatId}`);
                    } catch (err) {
                      console.error("Error creating/finding chat:", err);
                      alert("Failed to start conversation. Please try again.");
                    }
                  }}
                  className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#6f51d9] transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Message Seller
                </button>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-[#8163e9]/5 rounded-lg border border-[#8163e9]/20 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Safety Tips
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                    1
                  </div>
                  <span className="ml-2 text-gray-700">
                    Meet in a public place on campus
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                    2
                  </div>
                  <span className="ml-2 text-gray-700">
                    Inspect items before purchasing
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8163e9] flex items-center justify-center text-white text-xs mt-0.5">
                    3
                  </div>
                  <span className="ml-2 text-gray-700">
                    Use our in-app messaging system
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
