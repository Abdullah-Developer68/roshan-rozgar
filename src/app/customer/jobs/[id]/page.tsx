import { Suspense } from "react";
import { JobThreadScreen } from "@/components/job/thread-screen";

export default function CustomerJobPage() {
  return (
    <Suspense>
      <JobThreadScreen />
    </Suspense>
  );
}
