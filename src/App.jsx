import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateMeeting from "./pages/CreateMeeting";
import MeetingRoom from "./pages/MeetingRoom";

//http://localhost:5173/meeting/be6a8781-0024-4bc8-8d62-f7c580ee7827?role=teacher
//http://localhost:5173/meeting/be6a8781-0024-4bc8-8d62-f7c580ee7827?role=student

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateMeeting />} />
      <Route path="/meeting/:roomId" element={<MeetingRoom />} />
    </Routes>
  );
}

export default App;