import { db } from "@/server/db";
import { media } from "@/db/schema";
import { HttpError, json, requireUser, route } from "@/server/http";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = /^(audio\/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)|image\/(jpeg|png|webp))/;

/** Upload a voice note or photo. Stored in Postgres (bytea) — no external storage. */
export const POST = route(async (req) => {
  const u = await requireUser(req);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) throw new HttpError(400, "file is required");
  const mime = (file.type || "application/octet-stream").split(";")[0];
  if (!ALLOWED.test(mime)) throw new HttpError(415, `Unsupported type ${mime}`);
  if (file.size > MAX_BYTES) throw new HttpError(413, "File too large (max 3 MB)");
  const kind = mime.startsWith("audio/") ? "audio" : "image";
  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({ ownerUserId: u.id, kind, mime, sizeBytes: data.length, data })
    .returning({ id: media.id });
  return json({ id: row.id, url: `/api/media/${row.id}` }, 201);
});
