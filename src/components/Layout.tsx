import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastContainer } from './Toast';
import { useStore } from '../store/useStore';

export default function Layout({ children }: { children: ReactNode }) {
  const { globalLoading, globalLoadingMessage, isTranscribing } = useStore();
  const showBar = globalLoading || isTranscribing;
  const barLabel = isTranscribing
    ? 'Transcription audio en cours...'
    : (globalLoadingMessage || 'Chargement...');

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {showBar && (
          <div className="shrink-0 h-8 flex items-center gap-3 px-4 text-xs font-medium text-white/80"
            style={{
              background: 'linear-gradient(90deg, rgba(168,85,247,0.2) 0%, rgba(147,51,234,0.1) 100%)',
              borderBottom: '1px solid rgba(168,85,247,0.3)',
            }}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            {barLabel}
          </div>
        )}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
