import { useState, useRef } from "react";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export default function RecordPage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioURL(URL.createObjectURL(blob));
    };
    mediaRecorder.start();
    setRecording(true);
    setUploadDone(false);
    setStatus("");
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioURL(URL.createObjectURL(file));
    setUploadDone(false);
    setStatus("");
  };

  const uploadToS3 = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setStatus("Uploading to S3...");
    const fileName = `recordings/${uuidv4()}.webm`;
    try {
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: import.meta.env.VITE_S3_BUCKET,
          Key: fileName,
          Body: audioBlob,
          ContentType: "audio/webm",
        },
      });
      await upload.done();
      setUploadDone(true);
      setStatus("✅ Uploaded! Pipeline is now processing your story.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Check your AWS credentials.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>🌱 ROOTS</h1>
      <p>Record or upload a story to preserve it forever.</p>

      <button
        onClick={recording ? stopRecording : startRecording}
        style={{ fontSize: 48, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}
      >
        {recording ? "⏹️" : "🎙️"}
      </button>
      <p>{recording ? "Recording... click to stop" : "Click to record"}</p>

      <p style={{ color: "#888" }}>— or upload an audio file —</p>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />

      {audioURL && (
        <div style={{ marginTop: 24 }}>
          <audio controls src={audioURL} style={{ width: "100%" }} />
        </div>
      )}

      {audioBlob && !uploadDone && (
        <button
          onClick={uploadToS3}
          disabled={uploading}
          style={{
            marginTop: 16, padding: "12px 32px", fontSize: 16,
            background: "#2d6a4f", color: "white", border: "none",
            borderRadius: 8, cursor: "pointer"
          }}
        >
          {uploading ? "Uploading..." : "Save Story"}
        </button>
      )}

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </div>
  );
}