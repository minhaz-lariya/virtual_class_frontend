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
  const peerConnections = useRef({});
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
  const iceConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://13.60.249.222:5000/meetingHub")
      .withAutomaticReconnect()
      .build();

    conn.start().then(async () => {
      await conn.invoke("JoinRoom", roomId, userId, role);
      if (role === "teacher") await startTeacherMedia();
    });

    conn.on("ReceiveMessage", (u, m) => setMessages(p => [...p, `${u}: ${m}`]));

    conn.on("JoinRequestReceived", id => {
      if (role === "teacher") setPendingUsers(p => [...new Set([...p, id])]);
    });

    conn.on("ParticipantsUpdated", (keys) => {
      setParticipants(Array.from(keys));
    });

    conn.on("UserAccepted", async (id) => {
      if (id === userId && role === "student") {
        setIsAccepted(true);
        initializeStudentPeer(conn);
      }
      if (role === "teacher") {
        setPendingUsers(prev => prev.filter(uid => uid !== id));
        setTimeout(() => createPeerForStudent(conn, id), 1500);
      }
    });

    conn.on("UserRejected", id => {
      if (id === userId) alert("Teacher rejected your request.");
    });

    conn.on("ReceiveSignal", async (senderId, signal) => {
      if (role === "student" && peerConnection.current) {
        const pc = peerConnection.current;
        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await conn.invoke("SendSignal", roomId, senderId, userId, answer);
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
      if (role === "teacher" && peerConnections.current[senderId]) {
        const pc = peerConnections.current[senderId];
        if (signal.type === "answer") await pc.setRemoteDescription(new RTCSessionDescription(signal));
        else if (signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    setConnection(conn);
    return () => { conn.stop(); if (localStream.current) localStream.current.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (role === "student" && connection && !isAccepted) {
      const interval = setInterval(() => connection.invoke("RequestToJoin", roomId, userId), 3000);
      return () => clearInterval(interval);
    }
  }, [connection, isAccepted]);

  const initializeStudentPeer = (conn) => {
    const pc = new RTCPeerConnection(iceConfig);
    pc.ontrack = e => { if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0]; };
    pc.onicecandidate = e => { if (e.candidate) conn.invoke("SendSignal", roomId, "teacher", userId, { candidate: e.candidate }); };
    peerConnection.current = pc;
  };

  const createPeerForStudent = async (conn, studentId) => {
    const pc = new RTCPeerConnection(iceConfig);
    if (localStream.current) localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current));
    pc.onicecandidate = e => { if (e.candidate) conn.invoke("SendSignal", roomId, studentId, userId, { candidate: e.candidate }); };
    peerConnections.current[studentId] = pc;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await conn.invoke("SendSignal", roomId, studentId, userId, offer);
  };

  const startTeacherMedia = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = s;
    if (localVideo.current) localVideo.current.srcObject = s;
  };

  const startScreenShare = async () => {
    screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.current.getVideoTracks()[0];
    Object.values(peerConnections.current).forEach(pc => {
      const s = pc.getSenders().find(send => send.track?.kind === "video");
      if (s) s.replaceTrack(screenTrack);
    });
    screenTrack.onended = () => {
      const vt = localStream.current.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach(pc => {
        const s = pc.getSenders().find(send => send.track?.kind === "video");
        if (s) s.replaceTrack(vt);
      });
    };
  };

  const toggleRecording = () => {
    if (!recording) {
      mediaRecorder.current = new MediaRecorder(localStream.current);
      recordedChunks.current = [];
      mediaRecorder.current.ondataavailable = e => recordedChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "recording.webm";
        a.click();
      };
      mediaRecorder.current.start();
    } else { mediaRecorder.current.stop(); }
    setRecording(!recording);
  };

  return (
    <div style={{ padding: "20px", fontFamily: 'sans-serif' }}>
      <h2>Room: {roomId} ({role.toUpperCase()})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
        <section>
          {role === "teacher" ? (
            <div style={{ background: '#000', padding: '10px', borderRadius: '10px' }}>
              <video ref={localVideo} autoPlay muted style={{ width: '100%', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
                <button onClick={() => { 
                  const t = localStream.current.getAudioTracks()[0]; 
                  t.enabled = !t.enabled; setMicOn(t.enabled); 
                }}>{micOn ? "Mute" : "Unmute"}</button>
                <button onClick={() => { 
                  const t = localStream.current.getVideoTracks()[0]; 
                  t.enabled = !t.enabled; setCamOn(t.enabled); 
                }}>{camOn ? "Cam Off" : "Cam On"}</button>
                <button onClick={startScreenShare}>Share Screen</button>
                <button onClick={toggleRecording} style={{ background: recording ? 'red' : '' }}>{recording ? "Stop Rec" : "Record"}</button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#000', padding: '10px', borderRadius: '10px', minHeight: '400px' }}>
              {isAccepted ? <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%' }} /> : <h3 style={{ color: 'white', textAlign: 'center', paddingTop: '150px' }}>Waiting for teacher...</h3>}
            </div>
          )}
        </section>
        <aside>
          {role === "teacher" && (
            <>
              <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                <h4>Requests ({pendingUsers.length})</h4>
                {pendingUsers.map(id => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{id}</span>
                    <button onClick={() => connection.invoke("AcceptUser", roomId, id)} style={{ background: 'green', color: 'white' }}>Accept</button>
                  </div>
                ))}
              </div>
              <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                <h4>Participants ({participants.length})</h4>
                {participants.map(id => <p key={id}>🟢 {id}</p>)}
              </div>
            </>
          )}
          <div style={{ border: '1px solid #ddd', padding: '10px', height: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>{messages.map((m, i) => <p key={i}>{m}</p>)}</div>
            <div style={{ display: 'flex' }}>
              <input value={message} onChange={e => setMessage(e.target.value)} style={{ flex: 1 }} />
              <button onClick={() => { connection.invoke("SendMessage", roomId, userId, message); setMessage(""); }}>Send</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MeetingRoom;