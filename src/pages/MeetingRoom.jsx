import { useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

function MeetingRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const screenStream = useRef(null);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAccepted, setIsAccepted] = useState(role === "teacher");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Waiting for teacher...");

  const userId = useRef(Math.random().toString(36).substring(2, 8)).current;

  const videoConstraints = {
    width: { ideal: 256, max: 256 },
    height: { ideal: 144, max: 144 },
    frameRate: { ideal: 10, max: 15 }
  };

  const iceConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ],
    iceCandidatePoolSize: 10
  };

  // ------------------ SOCKET.IO & SIGNALING ------------------
  useEffect(() => {
    const newSocket = io("http://13.60.249.222:3000/", {
      transports: ["websocket"],
      reconnection: true
    });

    newSocket.on("connect", async () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("JoinRoom", roomId, userId, role);

      if (role === "teacher") {
        await startTeacherMedia();
      }

      if (role === "student" && isAccepted) {
        await initializeStudentPeer(newSocket);
        newSocket.emit("StudentReady", roomId, userId);
      }
    });

    newSocket.on("ReceiveMessage", (u, m) =>
      setMessages((prev) => [...prev, `${u}: ${m}`])
    );

    newSocket.on("JoinRequestReceived", (id) => {
      if (role === "teacher") setPendingUsers((prev) => [...new Set([...prev, id])]);
    });

    newSocket.on("UserAccepted", async (id) => {
      if (id === userId && role === "student") {
        setIsAccepted(true);
        await initializeStudentPeer(newSocket);
        newSocket.emit("StudentReady", roomId, userId);
      }
      if (role === "teacher") {
        setPendingUsers((prev) => prev.filter((uid) => uid !== id));
        // teacher waits for StudentReady event to create peer
      }
    });

    // Student signals they are ready
    newSocket.on("StudentReady", (id) => {
      if (role === "teacher") createPeerForStudent(newSocket, id);
    });

    newSocket.on("ReceiveSignal", async (senderId, signal) => {
      try {
        if (role === "student" && peerConnection.current) {
          const pc = peerConnection.current;
          console.log("Student received signal:", senderId, signal);
          if (signal.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            newSocket.emit("SendSignal", roomId, senderId, userId, answer);
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }

        if (role === "teacher" && peerConnections.current[senderId]) {
          const pc = peerConnections.current[senderId];
          console.log("Teacher received signal:", senderId, signal);
          if (signal.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error("Signaling Error:", err);
      }
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
      if (localStream.current) localStream.current.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, role]);

  // ------------------ STUDENT REQUEST LOOP ------------------
  useEffect(() => {
    if (!socket || role !== "student" || isAccepted) return;
    const interval = setInterval(() => {
      socket.emit("RequestToJoin", roomId, userId);
    }, 3000);
    return () => clearInterval(interval);
  }, [socket, isAccepted, role]);

  // ------------------ TEACHER MEDIA ------------------
  const startTeacherMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      });
      localStream.current = s;
      if (localVideo.current) localVideo.current.srcObject = s;
    } catch (err) {
      console.error("Media Access Error:", err);
    }
  };

  // ------------------ STUDENT PEER ------------------
  const initializeStudentPeer = async (skt) => {
    const pc = new RTCPeerConnection(iceConfig);

    pc.ontrack = (e) => {
      console.log("Student received remote track:", e.streams[0]);
      if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) skt.emit("SendSignal", roomId, "teacher", userId, { candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      console.log("Student connection state:", pc.connectionState);
      setConnectionStatus(pc.connectionState);
    };

    peerConnection.current = pc;
  };

  // ------------------ TEACHER PEER FOR STUDENT ------------------
  const createPeerForStudent = async (skt, studentId) => {
    const pc = new RTCPeerConnection(iceConfig);
    peerConnections.current[studentId] = pc;

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current);
      });
    }

    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track && s.track.kind === "video");
    if (videoSender) {
      const params = videoSender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      params.encodings[0].maxBitrate = 150000;
      videoSender.setParameters(params);
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) skt.emit("SendSignal", roomId, studentId, userId, { candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      console.log("Teacher -> student", studentId, "state:", pc.connectionState);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    skt.emit("SendSignal", roomId, studentId, userId, offer);
  };

  // ------------------ SCREEN SHARE ------------------
  const startScreenShare = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.current.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => {
        const videoTrack = localStream.current.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });
      };
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------ RECORDING ------------------
  const toggleRecording = () => {
    if (!recording) {
      mediaRecorder.current = new MediaRecorder(localStream.current);
      recordedChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => recordedChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `recording-${roomId}.webm`;
        a.click();
      };
      mediaRecorder.current.start();
    } else {
      mediaRecorder.current.stop();
    }
    setRecording(!recording);
  };

  // ------------------ RENDER ------------------
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f4f4f9", minHeight: "100vh" }}>
      <h2>Room: {roomId} <span style={{ color: "#007bff" }}>({role?.toUpperCase()})</span></h2>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px" }}>
        <section>
          {role === "teacher" ? (
            <div style={{ background: "#000", padding: "10px", borderRadius: "10px" }}>
              <video ref={localVideo} autoPlay muted playsInline style={{ width: "100%", borderRadius: "5px" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "center" }}>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}?role=student`); alert("Link copied!"); }}>Share Link</button>
                <button onClick={() => { const t = localStream.current.getAudioTracks()[0]; t.enabled = !t.enabled; setMicOn(t.enabled); }}>{micOn ? "🎤 Mute" : "🎙️ Unmute"}</button>
                <button onClick={() => { const t = localStream.current.getVideoTracks()[0]; t.enabled = !t.enabled; setCamOn(t.enabled); }}>{camOn ? "📷 Cam Off" : "📹 Cam On"}</button>
                <button onClick={startScreenShare}>🖥️ Share Screen</button>
                <button onClick={toggleRecording} style={{ background: recording ? "#ff4d4d" : "#007bff", color: "white" }}>{recording ? "⏹️ Stop Rec" : "⏺️ Record"}</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#000", padding: "10px", borderRadius: "10px", minHeight: "450px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              { !isAccepted ? (
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <h3>Admission Pending</h3>
                  <p>Waiting for the teacher to let you in...</p>
                </div>
              ) : (
                <div style={{ color: "white", textAlign: "center" }}>
                  <video ref={remoteVideo} autoPlay playsInline style={{ width: "100%", borderRadius: "5px", display: (connectionStatus === "connected" ? "block" : "none") }} />
                  <p>📡 Status: <strong>{connectionStatus}</strong></p>
                  {connectionStatus !== "connected" && <p>Connecting to teacher…</p>}
                </div>
              )}
            </div>
          )}
        </section>

        <aside>
          {role === "teacher" && (
            <div style={{ background: "white", border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
              <h4>Admission Requests ({pendingUsers.length})</h4>
              {pendingUsers.map((id) => (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: '12px' }}>{id}</span>
                  <button onClick={() => socket.emit("AcceptUser", roomId, id)} style={{ background: "#28a745", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px" }}>Accept</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: "white", border: "1px solid #ddd", padding: "15px", borderRadius: "8px", height: "400px", display: "flex", flexDirection: "column" }}>
            <h4>Room Chat</h4>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
              {messages.map((m, i) => <p key={i} style={{ fontSize: "12px", borderBottom: '1px solid #f0f0f0' }}>{m}</p>)}
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && socket.emit("SendMessage", roomId, userId, message)} style={{ flex: 1 }} placeholder="Message..." />
              <button onClick={() => { if (message) { socket.emit("SendMessage", roomId, userId, message); setMessage(""); } }}>Send</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MeetingRoom;