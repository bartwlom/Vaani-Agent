"use client";

import { useState, useRef, useEffect } from "react";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { GlowingText } from "@/components/ui/GlowingText";
import { Activity, Phone, Terminal as TerminalIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface LogEntry {
  timestamp: string;
  source: "SYSTEM" | "AGENT" | "CALL";
  message: string;
}

export default function Dashboard() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState<"OFFLINE" | "DIALING" | "RINGING" | "CONNECTED" | "DISCONNECTED">("OFFLINE");
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setLogs([
      { timestamp: new Date().toLocaleTimeString(), source: "SYSTEM", message: "Auth token verified. Telephony node active." },
    ]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (source: LogEntry["source"], message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), source, message }]);
  };

  const handleInitiateCall = async () => {
    if (!phoneNumber) {
      addLog("SYSTEM", "ERROR: Target phone number is required.");
      return;
    }

    setIsCalling(true);
    setStatus("DIALING");
    addLog("AGENT", `Compiling instructions for target ${phoneNumber}...`);

    try {
      addLog("SYSTEM", "Connecting to Twilio gateway...");
      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, agentPrompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("RINGING");
        addLog("CALL", `Call initiated! SID: ${data.data.callSid}`);
        addLog("CALL", `Ringing ${phoneNumber}...`);
        
        // Update status after a delay
        setTimeout(() => {
          setStatus("CONNECTED");
          addLog("CALL", "Connection established. AI listening.");
          setIsCalling(false);
        }, 4000);
      } else {
        throw new Error(data.error || data.details || "API Failure");
      }
    } catch (e: any) {
      addLog("SYSTEM", `CRITICAL ERROR: ${e.message || "Failed to initiate uplink."}`);
      setStatus("DISCONNECTED");
      setIsCalling(false);
    }
  };

  const handleDisconnect = () => {
    setStatus("DISCONNECTED");
    addLog("CALL", "Connection terminated by operator.");
  };

  const handleLogout = () => {
    addLog("SYSTEM", "Logging out operator. Clearing secure tokens...");
    document.cookie = "operator_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setTimeout(() => {
        router.push("/");
    }, 1000);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full mt-4 max-w-7xl mx-auto w-full relative z-20">
      <header className="flex justify-between items-center mb-6 border-b-4 border-terminal-green pb-4">
        <div className="flex items-center">
          <Activity className="text-terminal-amber w-8 h-8 mr-4 animate-pulse" />
          <div>
            <GlowingText as="h1" className="text-2xl font-bold tracking-widest leading-none">
              CENTRAL_COMMAND
            </GlowingText>
            <GlowingText className="text-sm tracking-widest text-terminal-greenDim">
              [ NODE: ALPHA-7 ] [ LATENCY: 24ms ]
            </GlowingText>
          </div>
        </div>
        <TerminalButton variant="ghost" onClick={handleLogout} className="border border-terminal-green">
          <LogOut className="w-4 h-4 inline mr-2" />
          TERMINATE_SESSION
        </TerminalButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* PANEL 1: Telephony Command Link */}
        <section className="col-span-1 border-2 border-terminal-green p-4 flex flex-col bg-black bg-opacity-70">
          <div className="flex items-center mb-6 border-b border-terminal-greenDim pb-2">
            <Phone className="w-5 h-5 mr-3 text-terminal-green" />
            <GlowingText className="text-lg tracking-widest">COMMAND_LINK</GlowingText>
          </div>
          
          <div className="flex-1 space-y-6">
            <TerminalInput 
              label="TARGET_NUMBER" 
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            
            <TerminalInput 
              label="AGENT_SYSTEM_PROMPT" 
              multiline
              placeholder="Inject behavioral instructions here. E.g., 'You are a helpful assistant...'"
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
            />
          </div>

          <div className="mt-auto pt-4 space-y-4">
            {status === "CONNECTED" || status === "RINGING" ? (
              <TerminalButton variant="danger" className="w-full text-lg" onClick={handleDisconnect}>
                ABORT_CONNECTION
              </TerminalButton>
            ) : (
              <TerminalButton 
                variant="primary" 
                className="w-full text-lg" 
                isLoading={isCalling}
                onClick={handleInitiateCall}
              >
                INITIATE_UPLINK
              </TerminalButton>
            )}
          </div>
        </section>

        {/* PANEL 2 & 3 CONTAINER */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          
          {/* PANEL 2: Active Connection Status */}
          <section className="h-32 border-2 border-terminal-amber p-4 flex flex-col justify-center items-center relative overflow-hidden bg-black bg-opacity-70">
            <GlowingText className="absolute top-2 left-2 text-xs text-terminal-amber opacity-70">
              STATUS_MONITOR
            </GlowingText>
            <div className="flex items-center space-x-4">
                {status === "OFFLINE" || status === "DISCONNECTED" ? (
                    <div className="text-terminal-amber opacity-50 tracking-[0.5em] text-2xl font-bold">
                        [ {status} ]
                    </div>
                ) : (
                    <div className="text-terminal-amber animate-pulse tracking-[0.5em] text-3xl font-bold flex items-center shadow-lg shadow-terminal-amber/20">
                         {Array.from({length: 3}).map((_, i) => (
                             <span key={i} className={`inline-block mr-2 text-terminal-green animate-bounce`} style={{ animationDelay: `${i * 0.15}s`}}>█</span>
                         ))}
                         [ {status} ]
                    </div>
                )}
            </div>
          </section>

          {/* PANEL 3: Communication Log (Terminal Output) */}
          <section className="flex-1 border-2 border-terminal-green p-4 flex flex-col bg-black bg-opacity-70 min-h-0">
             <div className="flex items-center mb-4 border-b border-terminal-greenDim pb-2">
                <TerminalIcon className="w-5 h-5 mr-3 text-terminal-green" />
                <GlowingText className="text-lg tracking-widest">COMMUNICATION_LOG</GlowingText>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm leading-relaxed pr-2">
                {logs.map((log, idx) => (
                    <div key={idx} className="flex">
                        <span className="text-terminal-greenDim mr-3 shrink-0">[{log.timestamp}]</span>
                        <span className={`mr-3 shrink-0 ${log.source === 'SYSTEM' ? 'text-terminal-amber' : log.source === 'AGENT' ? 'text-blue-400' : 'text-terminal-green'}`}>
                            {log.source}:
                        </span>
                        <span className="text-terminal-green break-words">{log.message}</span>
                    </div>
                ))}
                <div ref={logEndRef} className="h-4" />
                <div className="text-terminal-green animate-pulse">█</div>
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}
