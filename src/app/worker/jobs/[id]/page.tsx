import { Suspense } from "react";
import { JobThreadScreen } from "@/components/job/thread-screen";

export default function WorkerJobPage() {
  return (
    <Suspense>
      <JobThreadScreen />
    </Suspense>
  );
}
