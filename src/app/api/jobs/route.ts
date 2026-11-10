import { json, parseBody, requireUser, route } from "@/server/http";
import { createJobsInput } from "@/lib/validation";
import { createJobRequests, listCustomerJobs } from "@/server/services/jobs";

export const GET = route(async (req) => {
  const u = await requireUser(req);
  return json({ jobs: await listCustomerJobs(u.id) });
});

/** Send the same job request to 1–3 nearby available workers. */
export const POST = route(async (req) => {
  const u = await requireUser(req);
  const input = await parseBody(req, createJobsInput);
  const result = await createJobRequests({ id: u.id, name: u.name }, input);
  return json(result, 201);
});
