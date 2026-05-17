import { useState, useRef } from "react";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import { theme } from "../theme";
import { useNavigate } from "react-router-dom";

const s3 = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export default function RecordPage() {
  const [storyReady, setStoryReady] = useState(false);
  const [jobName, setJobName] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

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
    const id = uuidv4();
    const fileName = `recordings/${id}.webm`;
    setJobName(id);
    
    console.log("1. Starting upload, file size:", audioBlob.size, "bytes");
    
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

      console.log("2. Upload object created, calling upload.done()");
      await upload.done();
      console.log("3. Upload complete!");

      setUploadDone(true);
      setStatus("⏳ Processing your story...");
      pollForStory(id);
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Check your AWS credentials.");
    } finally {
      setUploading(false);
    }
  };

  const pollForStory = (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/stories`);
        const stories = await res.json();
        const found = stories.find(s => s.storyId === id);
        if (found) {
          clearInterval(interval);
          setStoryReady(true);
          setStatus("✅ Story now in Archives!");
        }
      } catch (err) {
        console.error(err);
      }
    }, 10000); // check every 10 seconds

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: theme.colors.bgPrimary,
      fontFamily: theme.fonts.body,
      //padding: "3rem 2rem",
      display: 'flex',
      flexDirection: 'column',
    }}>

      <header
        style={{
          padding: '1.25rem 2rem',
          borderBottom: `1px solid ${theme.colors.bgSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3rem 2rem',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: '0.95rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          ← Roots
        </button>
        <div>
          <h1
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.textPrimary,
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            marginTop: 0,
          }}
        >
          Record a Story
        </h1>
        <p style={{ color: theme.colors.textMuted, margin: 0}}>
          Preserve a memory for the community archive
        </p>
        </div>
        <button
          onClick={() => navigate('/archive')}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.9rem',
            backgroundColor: 'transparent',
            color: theme.colors.warmSand,
            border: `1px solid ${theme.colors.warmSand}`,
            borderRadius: '999px',
            cursor: 'pointer',
            fontFamily: theme.fonts.body,
            whiteSpace: 'nowrap',
          }}>
          View Archive
        </button>
      </header>

        {/* Recording card */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center", 
        }}>
        <div style={{
          width: "100%",
          backgroundColor: theme.colors.bgSecondary,
          borderRadius: "12px",
          padding: "2.5rem",
          border: `4px solid ${theme.colors.forestGreen}`,
          textAlign: "center",
          minHeight: "500px",
          display: "flex",              // ← add
          flexDirection: "column",      // ← add
          justifyContent: "center",     // ← add (vertically centers contents)
          alignItems: "center",
        }}>

          {/* Mic button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{
              fontSize: 64,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 8,
              display: "block",
              margin: "0 auto 8px auto",
            }}
          >
            {recording ? "🔴" : "🎙️"}
          </button>
          <p style={{ color: theme.colors.textMuted, marginBottom: "2rem" }}>
            {recording ? "Recording... click to stop" : audioBlob && !recording ? "Audio recorded" : "Click to start recording"}
          </p>

          {/* Divider */}
          <p style={{ color: theme.colors.textMuted, marginBottom: "1rem" }}>
            — or upload an audio file —
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ color: theme.colors.textPrimary}}
            />
          </div>

          {/* Playback */}
          {audioURL && (
            <div style={{ marginTop: "1.5rem" }}>
              <audio controls src={audioURL} style={{ width: "100%" }} />
            </div>
          )}

          {/* Save button */}
          {audioBlob && !uploadDone && (
            <button
              onClick={uploadToS3}
              disabled={uploading}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                backgroundColor: theme.colors.forestGreen,
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontFamily: theme.fonts.body,
              }}
            >
              {uploading ? "Uploading..." : "Save Story"}
            </button>
          )}

          {status && (
            <p style={{ marginTop: "1rem", color: storyReady ? theme.colors.forestGreen : theme.colors.textPrimary }}>
              {status}
            </p>
          )}
          {storyReady && (
            <button
              onClick={() => navigate('/archive')}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                backgroundColor: "transparent",
                color: theme.colors.warmSand,
                border: `1px solid ${theme.colors.warmSand}`,
                borderRadius: "999px",
                cursor: "pointer",
                fontFamily: theme.fonts.body,
              }}
            >
              View in Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}