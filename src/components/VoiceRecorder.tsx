import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

// Encode Float32 PCM chunks to a 16-bit mono WAV Blob.
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const targetRate = 16000;
  // downsample
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const flat = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    flat.set(c, off);
    off += c.length;
  }
  const ratio = sampleRate / targetRate;
  const newLength = Math.floor(flat.length / ratio);
  const down = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    down[i] = flat[Math.floor(i * ratio)];
  }
  const buffer = new ArrayBuffer(44 + down.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + down.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, down.length * 2, true);
  let p = 44;
  for (let i = 0; i < down.length; i++) {
    const s = Math.max(-1, Math.min(1, down[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function VoiceRecorder({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      node.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      setState("recording");
    } catch {
      setError("Microphone access is needed to record.");
    }
  }

  async function stop() {
    const stream = streamRef.current;
    const ctx = ctxRef.current;
    const node = nodeRef.current;
    const source = sourceRef.current;
    if (!stream || !ctx || !node || !source) return;
    stream.getTracks().forEach((t) => t.stop());
    node.disconnect();
    source.disconnect();
    const sr = ctx.sampleRate;
    await ctx.close();
    const blob = encodeWav(chunksRef.current, sr);
    chunksRef.current = [];
    streamRef.current = null;
    ctxRef.current = null;
    nodeRef.current = null;
    sourceRef.current = null;
    if (blob.size < 2048) {
      setState("idle");
      setError("That recording was too short — please try again.");
      return;
    }
    setState("transcribing");
    try {
      const fd = new FormData();
      fd.append("file", blob, "recording.wav");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Transcription failed.");
      if (data.text) onTranscript(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      setState("idle");
    }
  }

  const isBusy = state !== "idle";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={disabled || state === "transcribing"}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-all text-sm font-medium ${
          state === "recording"
            ? "bg-[color:var(--urgent)] text-[color:var(--urgent-foreground)] border-transparent shadow-lg shadow-[color:var(--urgent)]/25 animate-pulse"
            : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {state === "transcribing" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing…
          </>
        ) : state === "recording" ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop & transcribe
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Dictate
          </>
        )}
      </button>
      {isBusy && state === "recording" && (
        <span className="text-xs text-muted-foreground">Recording — speak freely</span>
      )}
      {error && <span className="text-xs text-[color:var(--urgent)]">{error}</span>}
    </div>
  );
}