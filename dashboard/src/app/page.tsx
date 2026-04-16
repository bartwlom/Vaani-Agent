"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { GlowingText } from "@/components/ui/GlowingText";
import { Terminal } from "lucide-react";

export default function LoginSequence() {
  const [operatorId, setOperatorId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId || !passcode) {
      setStatus("ERROR: REQUIRED DATAPOINTS MISSING.");
      return;
    }

    setIsBooting(true);
    setStatus("VERIFYING CREDENTIALS...");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId, passcode }),
      });

      if (res.ok) {
        setStatus("ACCESS GRANTED.");
        runBootSequence();
      } else {
        setIsBooting(false);
        setStatus("ACCESS DENIED. UNAUTHORIZED.");
      }
    } catch (error) {
      setIsBooting(false);
      setStatus("CRITICAL FAILURE: UPLINK NOT RESPONDING.");
    }
  };

  const runBootSequence = () => {
    const sequence = [
      "DECRYPTING HANDSHAKE...",
      "ESTABLISHING SECURE TUNNEL...",
      "LOADING TELEPHONY MODULES...",
      "INITIALIZING VIDEOSDK CORE...",
      "BYPASSING LOCAL FIREWALL...",
      "UPLINK ESTABLISHED. ROUTING...",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setBootLog((prev) => [...prev, sequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      <div className="border-4 border-terminal-green p-8 max-w-md w-full bg-black bg-opacity-80 relative z-20">
        <div className="flex items-center mb-6">
          <Terminal className="text-terminal-green mr-4 w-8 h-8 animate-pulse" />
          <GlowingText as="h1" className="text-3xl tracking-widest font-bold">
            SYSTEM_LOGIN
          </GlowingText>
        </div>

        {!isBooting ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <TerminalInput
              label="OPERATOR_ID"
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="Enter ID..."
              autoFocus
            />
            <TerminalInput
              label="PASSCODE"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Passcode..."
            />

            <div className="pt-4">
              <TerminalButton type="submit" className="w-full text-xl" isLoading={isBooting}>
                INITIATE_HANDSHAKE
              </TerminalButton>
            </div>

            {status && (
              <GlowingText className="text-red-500 block text-center uppercase mt-4">
                {status}
              </GlowingText>
            )}
          </form>
        ) : (
          <div className="space-y-2 h-48 flex flex-col justify-start overflow-hidden">
            <GlowingText className="mb-4 text-terminal-amber block uppercase">
              {status}
            </GlowingText>
            {bootLog.map((log, index) => (
              <GlowingText key={index} className="block text-terminal-green tracking-wide">
                {`> ${log}`}
              </GlowingText>
            ))}
            <GlowingText className="block text-terminal-green animate-pulse">
              _
            </GlowingText>
          </div>
        )}
      </div>
    </div>
  );
}
