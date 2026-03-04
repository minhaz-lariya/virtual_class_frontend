import { useParams, useSearchParams } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";

function MeetingRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);

  const localStream = useRef(null);
  const screenStream = useRef(null);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const [connection, setConnection] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isAccepted, setIsAccepted] = useState(role === "teacher");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [recording, setRecording] = useState(false);

  const userId = useRef(Math.random().toString(36).substring(2, 8)).current;

  /* ---------------- SIGNALR ---------------- */

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://13.60.249.222:5000/meetingHub")
      .withAutomaticReconnect()
      .build();

    conn.start().then(async () => {
      console.log("Connected to SignalR");
      await conn.invoke("JoinRoom", roomId, userId, role);
      initializePeer(conn);
      if (role === "teacher") startTeacherMedia();
    });

    conn.on("ReceiveMessage", (u, m) =>
      setMessages(p => [...p, `${u}: ${m}`])
    );

    conn.on("JoinRequestReceived", id => {
      if (role === "teacher") {
        setPendingUsers(p => [...new Set([...p, id])]);
      }
    });

    conn.on("UserAccepted", async id => {
      setPendingUsers(p => p.filter(x => x !== id));
      setParticipants(p => [...new Set([...p, id])]);

      if (id === userId) {
        setIsAccepted(true);

        // ✅ FIX: start student camera AFTER accept
        if (role === "student") {
          await startStudentMedia();
        }
      }

      if (role === "teacher") {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        conn.invoke("SendSignal", roomId, userId, offer);
      }
    });

    conn.on("UserRejected", id => {
      setPendingUsers(p => p.filter(x => x !== id));
      if (id === userId) alert("Request rejected by teacher");
    });

    conn.on("ReceiveSignal", async (_, signal) => {
      const pc = peerConnection.current;

      if (signal.type === "offer" && role === "student") {
        await pc.setRemoteDescription(signal);
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        conn.invoke("SendSignal", roomId, userId, ans);
      }

      if (signal.type === "answer" && role === "teacher") {
        await pc.setRemoteDescription(signal);
      }

      if (signal.candidate) {
        await pc.addIceCandidate(signal.candidate);
      }
    });

    setConnection(conn);
    return () => conn.stop();
  }, []);

  /* ---------------- STUDENT SEND JOIN REQUEST ---------------- */

  const sendJoinRequest = async () => {
    if (!connection || role !== "student" || isAccepted) return;
    await connection.invoke("RequestToJoin", roomId, userId);
  };

  useEffect(() => {
    if (role === "student" && connection && !isAccepted) {
      sendJoinRequest();
      const interval = setInterval(sendJoinRequest, 3000);
      return () => clearInterval(interval);
    }
  }, [connection, isAccepted]);

  /* ---------------- WEBRTC ---------------- */

  const initializePeer = conn => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:global.relay.metered.ca:80", username: "openai", credential: "openai" },
        { urls: "turn:global.relay.metered.ca:443", username: "openai", credential: "openai" }
      ]
    });

    pc.ontrack = e => {
      remoteVideo.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        conn.invoke("SendSignal", roomId, userId, { candidate: e.candidate });
      }
    };

    peerConnection.current = pc;
  };

  /* ---------------- MEDIA ---------------- */

  const startTeacherMedia = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.current.srcObject = localStream.current;

    localStream.current.getTracks().forEach(track =>
      peerConnection.current.addTrack(track, localStream.current)
    );
  };

  const startStudentMedia = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.current.srcObject = localStream.current;

    localStream.current.getTracks().forEach(track =>
      peerConnection.current.addTrack(track, localStream.current)
    );
  };

  const toggleMic = () => {
    localStream.current.getAudioTracks()[0].enabled = !micOn;
    setMicOn(!micOn);
  };

  const toggleCamera = () => {
    localStream.current.getVideoTracks()[0].enabled = !camOn;
    setCamOn(!camOn);
  };

  const startScreenShare = async () => {
    screenStream.current = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    const sender = peerConnection.current
      .getSenders()
      .find(s => s.track.kind === "video");

    sender.replaceTrack(screenStream.current.getVideoTracks()[0]);

    screenStream.current.getVideoTracks()[0].onended = () => {
      sender.replaceTrack(localStream.current.getVideoTracks()[0]);
    };
  };

  const toggleRecording = () => {
    if (!recording) {
      mediaRecorder.current = new MediaRecorder(localStream.current);
      recordedChunks.current = [];
      mediaRecorder.current.ondataavailable = e =>
        recordedChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "recording.webm";
        a.click();
      };
      mediaRecorder.current.start();
    } else {
      mediaRecorder.current.stop();
    }
    setRecording(!recording);
  };

  /* ---------------- SHARE LINK ---------------- */

  const shareLink = () => {
    const link = `${window.location.origin}/Student/meeting/${roomId}?role=student`;
    navigator.clipboard.writeText(link);
    alert("Meeting link copied!");
  };

  /* ---------------- UI ---------------- */

  return (
    <div>
      <h2>Room: {roomId} ({role})</h2>

      {role === "teacher" && (
        <>
          <button onClick={shareLink}>Copy Meeting Link</button>

          <h3>Join Requests</h3>
          {pendingUsers.map(id => (
            <div key={id}>
              <span>{id}</span>
              <button onClick={() => connection.invoke("AcceptUser", roomId, id)}>Accept</button>
              <button onClick={() => connection.invoke("RejectUser", roomId, id)}>Reject</button>
            </div>
          ))}

          <h3>Participants</h3>
          {participants.map(id => <p key={id}>{id}</p>)}

          <div>
            <button onClick={toggleMic}>{micOn ? "Mute" : "Unmute"}</button>
            <button onClick={toggleCamera}>{camOn ? "Cam Off" : "Cam On"}</button>
            <button onClick={startScreenShare}>Share Screen</button>
            <button onClick={toggleRecording}>
              {recording ? "Stop Rec" : "Start Rec"}
            </button>
          </div>
        </>
      )}

      {role === "student" && !isAccepted && (
        <h3>Waiting for teacher approval...</h3>
      )}

      <video ref={localVideo} autoPlay muted width="300" />
      <video ref={remoteVideo} autoPlay playsInline width="300" />

      <hr />

      {messages.map((m, i) => <p key={i}>{m}</p>)}
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={() =>
        connection.invoke("SendMessage", roomId, userId, message)
      }>
        Send
      </button>
    </div>
  );
}

export default MeetingRoom;