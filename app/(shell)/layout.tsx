import { Sidebar } from "@/components/sidebar";
import { ContentDetail } from "@/components/content-detail";
import { ChatLauncher } from "@/components/chat-launcher";
import { FirstRunGate } from "@/components/first-run-gate";

// App shell — sidebar nav + scrollable main + persistent overlays (content
// drawer and chat launcher) that survive route changes.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <FirstRunGate />
      <Sidebar />
      <main className="main">{children}</main>
      <ContentDetail />
      <ChatLauncher />
    </div>
  );
}
