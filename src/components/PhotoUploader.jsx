import { useRef, useState } from "react";
import { Camera, Trash2, Loader } from "lucide-react";
import Avatar from "./Avatar.jsx";

// Square-resize an image File to a JPEG data URL.
// We crop to a centered square first so the avatar stays well-framed, then
// scale to maxSize on the long edge.
function fileToResizedDataURL(file, { maxSize = 256, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please pick an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const target = Math.min(maxSize, side);
        const canvas = document.createElement("canvas");
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Inline avatar editor — current photo (or initials fallback) with hover
 * controls to upload a new image or clear it. Calls onChange with a base64
 * data URL string, or null when cleared.
 */
export default function PhotoUploader({
  photoUrl,
  initials,
  onChange,
  size = 88,
  fallbackClass,
  hint = "JPG / PNG · auto-resized to 256×256",
}) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const data = await fileToResizedDataURL(f);
      onChange(data);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="relative">
        <Avatar
          photoUrl={photoUrl}
          initials={initials}
          size={size}
          ringClass="ring-2 ring-white/15"
          fallbackClass={fallbackClass}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Upload photo"
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow shadow-brand-500/40 ring-2 ring-[#0d0f24] hover:scale-105"
        >
          {busy ? <Loader size={12} className="animate-spin" /> : <Camera size={12} />}
        </button>
      </div>
      <div className="flex-1 text-xs">
        <div className="text-white/70">{hint}</div>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            <Camera size={11} /> {photoUrl ? "Replace" : "Upload"}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 font-medium text-rose-200 hover:bg-rose-500/20"
            >
              <Trash2 size={11} /> Remove
            </button>
          )}
        </div>
        {err && <div className="mt-1 text-rose-300">{err}</div>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
