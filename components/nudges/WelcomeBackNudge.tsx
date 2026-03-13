"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import NudgeModal from "./NudgeModal";
import {
  shouldShowWelcomeBack,
  recordLastActive,
  NUDGE_WELCOME_BACK,
} from "@/lib/nudges";

export default function WelcomeBackNudge() {
  const { status } = useSession();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Wait for session to resolve — don't touch localStorage during "loading"
    // because recordLastActive() would overwrite the old timestamp before we check it
    if (status === "loading") return;

    if (status === "authenticated" && shouldShowWelcomeBack()) {
      setShow(true);
    }

    // Record activity AFTER the check, for both authed and unauthed users
    recordLastActive();
  }, [status]);

  return (
    <NudgeModal
      isOpen={show}
      onClose={() => setShow(false)}
      icon={Sparkles}
      title="Welcome back!"
      description="Ready to discover something new? Your city is waiting."
      ctaText="Start Exploring"
      onCta={() => {
        setShow(false);
        router.push("/");
      }}
      secondaryText="Maybe later"
      nudgeType={NUDGE_WELCOME_BACK}
    />
  );
}
