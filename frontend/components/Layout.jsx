import { useCallback, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar/Sidebar";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans text-[#181818]">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="min-h-screen pt-[4.5rem]">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main
          className={`min-h-[calc(100vh-4.5rem)] min-w-0 transition-[margin] duration-300 ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
