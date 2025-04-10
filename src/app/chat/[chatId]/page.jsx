"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  ChevronLeft,
  UserCircle,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatDetails, setChatDetails] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const [isUserActive, setIsUserActive] = useState(true);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // Fetch chat and user details
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatAndUserDetails = async () => {
      try {
        // Get chat details
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (!chatDoc.exists()) {
          setError("Chat not found");
          setLoading(false);
          return;
        }

        const chatData = { id: chatDoc.id, ...chatDoc.data() };
        setChatDetails(chatData);

        // Find the other participant
        const otherParticipantId = chatData.participants.find(
          (id) => id !== user.uid
        );
        if (otherParticipantId) {
          // Get other user's details
          const userDoc = await getDoc(doc(db, "users", otherParticipantId));
          if (userDoc.exists()) {
            setOtherUser({ id: userDoc.id, ...userDoc.data() });
          } else {
            setOtherUser({ id: otherParticipantId, fullName: "Unknown User" });
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching chat details:", err);
        setError("Failed to load chat details");
        setLoading(false);
      }
    };

    fetchChatAndUserDetails();
  }, [chatId, user]);

  // Track user activity to mark messages as seen
  useEffect(() => {
    const handleActivity = () => setIsUserActive(true);
    const handleInactivity = () => setIsUserActive(false);

    window.addEventListener("focus", handleActivity);
    window.addEventListener("blur", handleInactivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Set initial state
    setIsUserActive(document.hasFocus());

    return () => {
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("blur", handleInactivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  // Mark messages as seen when user is active
  useEffect(() => {
    if (!chatId || !user || !isUserActive) return;

    const markMessagesAsSeen = async () => {
      try {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(
          messagesRef,
          where("senderId", "!=", user.uid),
          where("seen", "==", false)
        );

        const querySnapshot = await getDocs(q);

        const batch = [];
        querySnapshot.forEach((doc) => {
          batch.push(
            updateDoc(doc.ref, { seen: true, seenAt: serverTimestamp() })
          );
        });

        if (batch.length > 0) {
          await Promise.all(batch);
          console.log(`Marked ${batch.length} messages as seen`);

          // Update unread count in the chat document
          await updateDoc(doc(db, "chats", chatId), {
            [`unreadCount.${user.uid}`]: 0,
          });
        }
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    };

    // Mark messages as seen when component mounts and user is active
    markMessagesAsSeen();

    // Set up interval to periodically mark messages as seen while user is active
    const interval = setInterval(markMessagesAsSeen, 5000);

    return () => clearInterval(interval);
  }, [chatId, user, isUserActive]);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    // Use a small timeout to ensure DOM has updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  // Add this new useEffect to handle initial load scrolling
  useEffect(() => {
    // Scroll to bottom when chat first loads
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [loading, messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    try {
      // Get the other user's ID
      const otherUserId = chatDetails.participants.find(
        (id) => id !== user.uid
      );

      // Add the message
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        seen: false,
        seenAt: null,
      });

      // Update the chat document with last message and timestamp
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: newMessage,
        lastMessageSenderId: user.uid, // Add this to track who sent the last message
        lastMessageSeen: false, // Add this to track if the last message was seen
        updatedAt: serverTimestamp(),
        // Increment unread count for the other user
        [`unreadCount.${otherUserId}`]:
          (chatDetails.unreadCount?.[otherUserId] || 0) + 1,
      });

      // Get sender's name for the notification
      let senderName = "Someone";
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().fullName) {
          senderName = userDoc.data().fullName;
        }
      } catch (error) {
        console.error("Error getting sender name:", error);
      }

      // Create a notification for the other user
      await addDoc(collection(db, "notifications"), {
        userId: otherUserId,
        title: "New Message",
        message: `${senderName}: ${
          newMessage.length > 30
            ? newMessage.substring(0, 30) + "..."
            : newMessage
        }`,
        type: "chat",
        chatId: chatId,
        read: false,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="text-gray-600 mt-2">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/chats")}
            className="inline-flex items-center text-[#8163e9] hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          {otherUser?.profilePicURL ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={otherUser.profilePicURL || "/placeholder.svg"}
                alt={otherUser.fullName || "User"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-gray-400" />
            </div>
          )}
          {/* User Details */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {otherUser?.fullName || "Unknown User"}
            </h1>
            <p className="text-sm text-gray-500">
              {otherUser?.email || `ID: ${otherUser?.id.slice(0, 8)}...`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user.uid ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] md:max-w-[60%] ${
                msg.senderId === user.uid
                  ? "bg-[#8163e9] text-white"
                  : "bg-white text-gray-900"
              } rounded-2xl px-4 py-2 shadow-sm`}
            >
              <p className="break-words">{msg.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs ${
                    msg.senderId === user.uid
                      ? "text-white/70"
                      : "text-gray-500"
                  } block`}
                >
                  {formatTime(msg.createdAt)}
                </span>

                {/* Read receipts - only show for sender's messages */}
                {msg.senderId === user.uid && (
                  <span className="ml-2">
                    {msg.seen ? (
                      <CheckCheck className="h-3.5 w-3.5 text-white/70" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-white/70" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-[1px]" />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8163e9] focus:border-transparent text-gray-900 bg-gray-50"
            required
          />
          <button
            type="submit"
            className="bg-[#8163e9] hover:bg-[#8163e9]/90 text-white p-3 rounded-full transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
