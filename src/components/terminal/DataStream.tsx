import { useEffect, useState } from "react";

const DATA_TYPES = ["HUNT_ACK", "EXEC_ACK", "WRITE_ACK", "VULP_ACK", "CRYPT_ACK", "READ_ACK", "SYNC_ACK"];

const generateHexCode = () => {
  return `0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0")}`;
};

const generateDataEntry = () => ({
  hex: generateHexCode(),
  type: DATA_TYPES[Math.floor(Math.random() * DATA_TYPES.length)],
});

const DataStream = () => {
  const [entries, setEntries] = useState(() =>
    Array.from({ length: 100 }, () => generateDataEntry())
  );
  const [entryCount, setEntryCount] = useState(101);

  useEffect(() => {
    const timer = setInterval(() => {
      setEntries((prev) => {
        const newEntries = [...prev.slice(1), generateDataEntry()];
        return newEntries;
      });
      setEntryCount((c) => c + 1);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Split entries into columns
  const columns = 5;
  const entriesPerColumn = Math.ceil(entries.length / columns);

  return (
    <div className="terminal-panel border-t border-border">
      <div className="terminal-header justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary" />
          CENTRAL_DATA_STREAM
        </span>
        <span className="text-foreground">{entryCount} ENTRIES</span>
      </div>
      <div className="p-3 overflow-hidden">
        <div className="grid grid-cols-5 gap-4 text-xs">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="space-y-0.5">
              {entries
                .slice(colIdx * entriesPerColumn, (colIdx + 1) * entriesPerColumn)
                .slice(0, 4)
                .map((entry, idx) => (
                  <div
                    key={`${colIdx}-${idx}`}
                    className="flex gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-terminal-green-dim">{entry.hex}</span>
                    <span className="text-muted-foreground">//</span>
                    <span>{entry.type}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataStream;
