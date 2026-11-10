import { Suspense } from "react";
import { LandingScreen } from "@/components/shared/landing-screen";

export default function Home() {
  return (
    <Suspense>
      <LandingScreen />
    </Suspense>
  );
}
