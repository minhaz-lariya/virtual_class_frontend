import { useParams, useSearchParams } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";

function MeetingRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role"); // teacher | student

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);

  const [connection, setConnection] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // 🔥 NEW STATES
  const [isAccepted, setIsAccepted] = useState(role === "teacher");
  const [pendingUsers, setPendingUsers] = useState([]);

  const userId = useRef(Math.random().toString(36).substring(2, 8)).current;

  /* ---------------- SIGNALR CONNECTION ---------------- */

  const sendJoinRequest = async () => {
    try {
      await connection.invoke("RequestToJoin", roomId, userId);
      console.log("Join request sent");
    } catch { }
  };

  // Send once + retry every 3s until accepted
  useEffect(() => {
    if (role === "student" && connection && !isAccepted) {
      sendJoinRequest();
      const timer = setInterval(sendJoinRequest, 3000);
      return () => clearInterval(timer);
    }
  }, [connection, isAccepted]);


  useEffect(() => {
    if (!roomId) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://13.60.207.233:5000/meetingHub")
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(async () => {
        console.log("Connected to SignalR");
        await newConnection.invoke("JoinRoom", roomId, userId, role);
        initializePeer(newConnection);

        if (role === "teacher") {
          startTeacherMedia(newConnection);
        }
      })
      .catch(err => console.error("SignalR Error:", err));

    /* ---------- CHAT ---------- */
    newConnection.on("ReceiveMessage", (user, msg) => {
      setMessages(prev => [...prev, `${user}: ${msg}`]);
    });

    /* ---------- JOIN REQUEST ---------- */
    newConnection.on("JoinRequestReceived", (requestingUserId) => {
      if (role === "teacher") {
        setPendingUsers(prev =>
          [...new Set([...prev, requestingUserId])]
        );
      }
    });

    /* ---------- ACCEPTED ---------- */
    newConnection.on("UserAccepted", async (acceptedUserId) => {
      if (acceptedUserId === userId) {
        setIsAccepted(true);
      }

      // Teacher sends offer only after acceptance
      if (role === "teacher") {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        await newConnection.invoke("SendSignal", roomId, userId, offer);
      }
    });

    /* ---------- WEBRTC SIGNALING ---------- */
    newConnection.on("ReceiveSignal", async (user, signal) => {
      const pc = peerConnection.current;

      if (signal.type === "offer" && role === "student" && isAccepted) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await newConnection.invoke("SendSignal", roomId, userId, answer);
      }

      if (signal.type === "answer" && role === "teacher") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      }

      if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    setConnection(newConnection);

    return () => newConnection.stop();
  }, [roomId, role, isAccepted]);

  /* ---------------- PEER CONNECTION ---------------- */
  const initializePeer = (conn) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peerConnection.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        conn.invoke("SendSignal", roomId, userId, {
          candidate: event.candidate
        });
      }
    };
  };

  /* ---------------- TEACHER CAMERA ---------------- */
  const startTeacherMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localVideo.current.srcObject = stream;

      stream.getTracks().forEach(track =>
        peerConnection.current.addTrack(track, stream)
      );
    } catch (err) {
      alert("Camera access denied");
    }
  };

  /* ---------------- CHAT ---------------- */
  const sendMessage = async () => {
    if (!connection || !message) return;
    await connection.invoke("SendMessage", roomId, userId, message);
    setMessage("");
  };

  /* ---------------- SHARE LINK ---------------- */
  const shareLink = () => {
    const link = `${window.location.origin}/meeting/${roomId}?role=student`;
    navigator.clipboard.writeText(link);
    alert("Meeting link copied!");
  };

  /* ---------------- ACCEPT STUDENT ---------------- */
  const handleAccept = async (targetUserId) => {
    await connection.invoke("AcceptUser", roomId, targetUserId);
    setPendingUsers(prev => prev.filter(id => id !== targetUserId));
  };

  /* ---------------- UI ---------------- */
  return (
    <div>
      <h2>Meeting Room: {roomId}</h2>
      <h4>Role: {role}</h4>

      {role === "teacher" && (
        <>
          <button onClick={shareLink}>Copy Meeting Link</button>

          <h4>Pending Students</h4>
          {pendingUsers.map(id => (
            <div key={id}>
              {id}
              <button onClick={() => handleAccept(id)}>Accept</button>
            </div>
          ))}
        </>
      )}

      {role === "student" && !isAccepted && (
        <h3>Waiting for teacher approval...</h3>
      )}

      <div style={{ display: "flex", gap: "20px", marginTop: 20 }}>
        {role === "teacher" && (
          <video ref={localVideo} autoPlay muted width="300" />
        )}

        {isAccepted && (
          <video ref={remoteVideo} autoPlay width="300" />
        )}
      </div>

      <hr />

      <div>
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>

      <input
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default MeetingRoom;