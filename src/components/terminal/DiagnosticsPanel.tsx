import { useEffect, useState } from "react";
import FoxMascot from "./FoxMascot";

const DiagnosticsPanel = () => {
  const [entropy, setEntropy] = useState(0.999);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [threads, setThreads] = useState<{ id: number; memory: string }[]>([]);

  useEffect(() => {
    // Generate random thread data
    const generateThreads = () => {
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        memory: `${Math.floor(Math.random() * 150)}MB`,
      }));
    };
    setThreads(generateThreads());

    const entropyTimer = setInterval(() => {
      setEntropy(0.990 + Math.random() * 0.009);
    }, 2000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearInterval(entropyTimer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      {/* Vulpine Diagnostics */}
      <div className="terminal-panel flex-shrink-0">
        <div className="terminal-header">elizaOS Deploy</div>
        <div className="p-4">
          <FoxMascot />
          <div className="space-y-2 text-xs mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SENSE_LVL</span>
              <span className="text-foreground">97%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FORM_STATE</span>
              <span className="text-foreground">SHIFTING</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FREQ</span>
              <span className="text-foreground">145.8MHZ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ENTROPY</span>
              <span className="text-foreground">{entropy.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MOUSE_X</span>
              <span className="text-foreground">{mousePos.x}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MOUSE_Y</span>
              <span className="text-foreground">{mousePos.y}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Manager */}
      <div className="terminal-panel flex-1 overflow-hidden">
        <div className="terminal-header">THREAD_MANAGER</div>
        <div className="p-3 overflow-y-auto h-full max-h-[400px] scrollbar-thin">
          <div className="space-y-1 text-xs">
            {threads.map((thread) => (
              <div key={thread.id} className="flex justify-between">
                <span className="text-muted-foreground">THREAD_{thread.id}</span>
                <span className="text-foreground tabular-nums">{thread.memory}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DiagnosticsPanel;
