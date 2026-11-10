import { Suspense } from "react";
import { WorkerProfileScreen } from "@/components/customer/worker-profile-screen";

export default function WorkerProfilePage() {
  return (
    <Suspense>
      <WorkerProfileScreen />
    </Suspense>
  );
}
