"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessage, getConversationMessages } from "@/lib/chatService";

export default function ChatPanel({ doctorId, patients = [] }) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Filter patients to only those who have prescriptions from this doctor
  // The patients prop should already be filtered by the parent component

  useEffect(() => {
    if (!doctorId || !selectedPatientId) {
      const resetTimer = setTimeout(() => setMessages([]), 0);
      return () => clearTimeout(resetTimer);
    }

    let isMounted = true;
    let previousMessageCount = 0;

    const fetchMessages = async () => {
      try {
        const msgs = await getConversationMessages(doctorId, selectedPatientId);
        if (isMounted) {
          // Auto-scroll only when new messages arrive (not on every poll)
          if (msgs.length > previousMessageCount) {
            setMessages(msgs);
            previousMessageCount = msgs.length;
          } else {
            setMessages(msgs);
          }
        }
      } catch (error) {
        console.error("[ChatPanel] Polling error:", error);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);

    return () => {
      clearInterval(intervalId);
      isMounted = false;
    };
  }, [doctorId, selectedPatientId]);

  // Auto-scroll effect - only scroll when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatientId) return;

    try {
      await sendMessage(doctorId, selectedPatientId, newMessage);
      setNewMessage("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col h-full h-[500px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
          💬
        </div>
        <div>
          <h2 className="text-lg font-black text-[#152238] tracking-tight">Chat Pasien</h2>
          <p className="text-xs text-[#718096] font-semibold">Pesan langsung & konsultasi</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-xl">
        {/* Contact List */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          {patients.map(pt => (
            <button
              key={pt.id}
              onClick={() => setSelectedPatientId(pt.id)}
              className={`w-full text-left p-3 border-b border-gray-100 transition-colors text-sm ${selectedPatientId === pt.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-white'}`}
            >
              <div className="font-bold text-[#152238] truncate">{pt.name}</div>
            </button>
          ))}
        </div>

{/* Chat Area */}
          <div className="w-2/3 flex flex-col bg-white">
            {!selectedPatientId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-4 text-center">
                Pilih pasien untuk memulai percakapan
              </div>
            ) : (
              <>
                <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {messages.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 mt-4">Belum ada pesan</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderId === doctorId;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-[#152238] text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
