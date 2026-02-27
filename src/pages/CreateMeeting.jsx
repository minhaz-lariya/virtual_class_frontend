import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

export default function CreateMeeting() {
  const navigate = useNavigate();

  const createMeeting = () => {
    const id = uuid();
    navigate(`/meeting/${id}?role=teacher`);
  };

  return (
    <div>
      <h2>Create Meeting</h2>
      <button onClick={createMeeting}>
        Start Meeting
      </button>
    </div>
  );
}