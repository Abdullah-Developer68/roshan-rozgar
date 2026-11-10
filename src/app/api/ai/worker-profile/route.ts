import { json, parseBody, requireUser, route } from "@/server/http";
import { extractProfileInput } from "@/lib/validation";
import { extractWorkerProfile } from "@/server/ai/tasks";

/** Spoken self-introduction (transcript) -> structured worker profile draft. */
export const POST = route(async (req) => {
  await requireUser(req);
  const { transcript } = await parseBody(req, extractProfileInput);
  const result = await extractWorkerProfile(transcript);
  return json(result);
});
