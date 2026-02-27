import { useState } from "react";

export default function ChatBox({ messages, sendMessage }) {
  const [message, setMessage] = useState("");

  return (
    <div>
      <h3>Chat</h3>

      {messages.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={() => {
          sendMessage(message);
          setMessage("");
        }}
      >
        Send
      </button>
    </div>
  );
}