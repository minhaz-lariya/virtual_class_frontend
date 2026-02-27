export default function VideoPlayer({ stream }) {
  return (
    <video
      autoPlay
      playsInline
      ref={(video) => {
        if (video && stream) {
          video.srcObject = stream;
        }
      }}
      style={{ width: "300px", margin: "10px" }}
    />
  );
}