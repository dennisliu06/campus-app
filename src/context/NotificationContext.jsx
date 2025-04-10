"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotifications(0);
      setUnreadMessages(0);
      setLoading(false);
      return;
    }

    // Listen for app notifications
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList = [];
        let unreadCount = 0;

        snapshot.forEach((doc) => {
          const notification = { id: doc.id, ...doc.data() };
          notificationsList.push(notification);
          if (!notification.read) {
            unreadCount++;
          }
        });

        setNotifications(notificationsList);
        setUnreadNotifications(unreadCount);
      }
    );

    // Count unread messages across all chats
    const fetchUnreadMessages = async () => {
      try {
        // First get all chats where the user is a participant
        const chatsRef = collection(db, "chats");
        const chatsQuery = query(
          chatsRef,
          where("participants", "array-contains", user.uid)
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        let totalUnread = 0;

        // For each chat, get the unread count for this user
        chatsSnapshot.forEach((chatDoc) => {
          const chatData = chatDoc.data();
          totalUnread += chatData.unreadCount?.[user.uid] || 0;
        });

        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error("Error counting unread messages:", error);
      }
    };

    // Initial fetch
    fetchUnreadMessages();

    // Set up interval to periodically check for unread messages
    const interval = setInterval(fetchUnreadMessages, 30000); // Check every 30 seconds

    setLoading(false);

    return () => {
      unsubscribeNotifications();
      clearInterval(interval);
    };
  }, [user]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      const updatePromises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const value = {
    notifications,
    unreadNotifications,
    unreadMessages,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
