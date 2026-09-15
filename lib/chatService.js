import { db } from "./firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, deleteDoc, doc } from "firebase/firestore";

function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}

export async function sendMessage(senderId, receiverId, text) {
  const conversationId = getConversationId(senderId, receiverId);
  await addDoc(collection(db, "chatMessages"), {
    senderId,
    receiverId,
    text,
    timestamp: new Date(),
    participants: [senderId, receiverId],
    conversationId,
  });

  // Cek dan hapus pesan lama jika melebihi batas
  await trimOldMessages(senderId, conversationId);
}

async function trimOldMessages(userId, conversationId, maxMessages = 100) {
  const q = query(
    collection(db, "chatMessages"),
    where("participants", "array-contains", userId),
    orderBy("timestamp", "asc")
  );
  const snapshot = await getDocs(q);
  const messagesInConversation = snapshot.docs.filter(
    (d) => d.data().conversationId === conversationId
  );

  if (messagesInConversation.length > maxMessages) {
    const excessCount = messagesInConversation.length - maxMessages;
    const messagesToDelete = messagesInConversation.slice(0, excessCount);
    for (const msg of messagesToDelete) {
      await deleteDoc(doc(db, "chatMessages", msg.id));
    }
  }
}

export function listenToConversation(userId1, userId2, callback) {
  const q = query(
    collection(db, "chatMessages"),
    where("participants", "array-contains", userId1),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const allMessages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = allMessages.filter(
      (msg) => msg.senderId === userId2 || msg.receiverId === userId2
    );
    callback(filtered);
  });
}

export async function getConversationMessages(userId1, userId2) {
  const q = query(
    collection(db, "chatMessages"),
    where("participants", "array-contains", userId1),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  const allMessages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return allMessages.filter(
    (msg) => msg.senderId === userId2 || msg.receiverId === userId2
  );
}