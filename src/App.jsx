import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./Admin/Dashboard";

import Dashboard from "./pages/Dashboard";
import CreateMeeting from "./pages/CreateMeeting";
import MeetingRoom from "./pages/MeetingRoom";
import AdminLayout from "./Admin/inc/AdminLayout";
import LoadingOverlay from "./LoadingOverlay";
import { createContext, useState } from "react";
import Faculties from "./Admin/Faculties";
import Students from "./Admin/Student";
import Subjects from "./Admin/Subjects";
import AdminSettings from "./Admin/AdminSettings";
import FacultyAllocation from "./Admin/FacultyAllocation";
import AdminSignIn from "./Admin/AdminSignIn";
import NotFound from "./NotFound";
import Home from "./Home";
import FacultyDashboard from "./Faculty/Dashboard";
import FacultyLayout from "./Faculty/inc/FacultyLayout";
import FacultySignIn from "./Faculty/FacultySignIn";
import StudentSignIn from "./Student/StudentSignIn";
import StudentLayout from "./Student/inc/StudentLayout";
import StudentDashboard from "./Student/Dashboard";


//http://localhost:5173/meeting/be6a8781-0024-4bc8-8d62-f7c580ee7827?role=teacher
//http://localhost:5173/meeting/be6a8781-0024-4bc8-8d62-f7c580ee7827?role=student

export const rootContext = createContext();
function App() {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <rootContext.Provider value={{ loading, setLoading }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meeting/create" element={<CreateMeeting />} />
          <Route path="/meeting/:roomId" element={<MeetingRoom />} />
          
          <Route path="/" element={<Home />} />
          <Route path="Admin/Sign-In" element={<AdminSignIn />} />
          <Route path="/Admin" element={<AdminLayout />} >
            <Route path="Dashboard" element={<AdminDashboard />} />
            <Route path="Faculties" element={<Faculties />} />
            <Route path="Students" element={<Students />} />
            <Route path="Subjects" element={<Subjects />} />
            <Route path="Settings" element={<AdminSettings />} />
            <Route path="Subjects/Allocation" element={<FacultyAllocation />} />
          </Route>
          <Route path="Faculty/Sign-In" element={<FacultySignIn />} />
          <Route path="/Faculty" element={<FacultyLayout />} >
            <Route path="Dashboard" element={<FacultyDashboard />} />
            <Route path="Login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateMeeting />} />
            <Route path="meeting/:roomId" element={<MeetingRoom />} />
          </Route>
          <Route path="Student/Sign-In" element={<StudentSignIn />} />
          <Route path="/Student" element={<StudentLayout />} >
            <Route path="Dashboard" element={<StudentDashboard />} />
            <Route path="Login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateMeeting />} />
            <Route path="meeting/:roomId" element={<MeetingRoom />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <LoadingOverlay status={loading} />
      </rootContext.Provider>
    </>
  );
}

export default App;