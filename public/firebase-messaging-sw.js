/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAE_RgeeXP1j2xUvF7HxgwLTS7rcNl0rQk",
  authDomain: "enviable-transport-6389b.firebaseapp.com",
  projectId: "enviable-transport-6389b",
  storageBucket: "enviable-transport-6389b.firebasestorage.app",
  messagingSenderId: "555019812841",
  appId: "1:555019812841:web:e95a374531e485c60d1578",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Enviable Transport";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icon.png",
  };
  self.registration.showNotification(title, options);
});
