import { useState, useEffect, useCallback } from "react";
import useOfflineSales from "../hooks/useOfflineSales";
import toast from "react-hot-toast";
import { WifiOff, Wifi, RefreshCw, CloudOff, UploadCloud } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);
  const { sync, getPendingCount }       = useOfflineSales();

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await getPendingCount()); } catch {}
  }, [getPendingCount]);

  useEffect(() => {
    refreshCount();

    const goOnline = async () => {
      setIsOnline(true);
      await refreshCount();
      /* Auto-sync on reconnect */
      const count = await getPendingCount();
      if (count > 0) {
        const toastId = toast.loading(`Syncing ${count} offline record(s)...`);
        const { synced, failed } = await sync();
        toast.dismiss(toastId);
        if (synced > 0) toast.success(`✅ ${synced} record(s) synced!`);
        if (failed > 0) toast.error(`⚠️ ${failed} failed to sync`);
        await refreshCount();
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      toast("📴 You're offline — sales will be saved locally", {
        icon: "⚠️", duration: 4000,
      });
    };

    /* listen for manual sync events from SW */
    const onSynced = () => refreshCount();

    window.addEventListener("online",        goOnline);
    window.addEventListener("offline",       goOffline);
    window.addEventListener("offlineSynced", onSynced);

    return () => {
      window.removeEventListener("online",        goOnline);
      window.removeEventListener("offline",       goOffline);
      window.removeEventListener("offlineSynced", onSynced);
    };
  }, [sync, getPendingCount, refreshCount]);

  const handleManualSync = async () => {
    if (!isOnline) { toast.error("You're offline — connect to internet first"); return; }
    if (syncing)   return;
    setSyncing(true);
    try {
      const { synced, failed } = await sync();
      if (synced > 0) toast.success(`✅ ${synced} record(s) synced!`);
      else if (failed === 0) toast("Nothing to sync", { icon: "✓" });
      if (failed > 0) toast.error(`⚠️ ${failed} failed`);
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  };

  /* ── offline banner (full width, top of page) ─── */
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-red-500 text-white">
        <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff size={15}/>
            Offline Mode
            {pendingCount > 0 && (
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                {pendingCount} pending
              </span>
            )}
          </div>
          <span className="text-xs text-red-200">Sales are saved locally and will sync when you reconnect</span>
        </div>
      </div>
    );
  }

  /* ── online: only show if there are pending records ── */
  if (pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CloudOff size={15}/>
          {pendingCount} offline record{pendingCount !== 1 ? "s" : ""} waiting to sync
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-1 rounded-lg text-xs font-bold"
        >
          {syncing
            ? <><RefreshCw size={12} className="animate-spin"/> Syncing...</>
            : <><UploadCloud size={12}/> Sync Now</>}
        </button>
      </div>
    </div>
  );
}