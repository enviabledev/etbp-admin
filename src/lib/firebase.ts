import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import api from "@/lib/api";

const firebaseConfig = {
  apiKey: "AIzaSyAE_RgeeXP1j2xUvF7HxgwLTS7rcNl0rQk",
  authDomain: "enviable-transport-6389b.firebaseapp.com",
  projectId: "enviable-transport-6389b",
  storageBucket: "enviable-transport-6389b.firebasestorage.app",
  messagingSenderId: "555019812841",
  appId: "1:555019812841:web:e95a374531e485c60d1578",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function initPushNotifications(appType: string = "customer") {
  try {
    if (typeof window === "undefined") return null;
    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey: vapidKey || undefined });

    if (token) {
      // Register with backend
      try {
        await api.post("/api/v1/notifications/register-device", {
          token,
          device_type: "web",
          app_type: appType,
        });
      } catch (e) {
        console.warn("FCM register failed:", e);
      }
    }

    // Foreground messages
    onMessage(messaging, (payload) => {
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "Notification", {
          body: payload.notification?.body || "",
          icon: "/icon.png",
        });
      }
    });

    return token;
  } catch (error) {
    console.warn("Push notification setup failed:", error);
    return null;
  }
}
