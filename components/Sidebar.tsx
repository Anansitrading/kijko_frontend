import React from "react";
import { TerminalSquare, Settings, ServerCog, Bot, X, Sun, Moon } from "lucide-react";
import { WorkspaceMode } from "../types";
import { cn } from "../utils/cn";
import { useTheme } from "../hooks/useTheme";
import { useAutoSave } from "../hooks/useAutoSave";

interface SidebarProps {
  currentMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  currentMode,
  onModeChange,
  onOpenSettings,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { save } = useAutoSave();

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    toggleTheme();
    save('theme', newTheme, true);
  };

  const menuItems = [
    {
      id: "agents" as WorkspaceMode,
      icon: Bot,
      label: "Agents",
      description: "Let's Build an Agent",
    },
    {
      id: "hyperglyph" as WorkspaceMode,
      icon: TerminalSquare,
      label: "Hypervisa",
      description: "Context & Ingestion",
    },
    {
      id: "panopticon" as WorkspaceMode,
      icon: ServerCog,
      label: "Panopticon",
      description: "MCPs & Skills",
    },
  ];

  const sidebarClasses = `
    bg-sidebar border-r border-sidebar-border flex flex-col h-full flex-shrink-0
    fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside className={sidebarClasses}>
        {/* Header / Brand */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">K</span>
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground tracking-tight">KIJKO</h1>
              <p className="text-xs text-muted-foreground font-mono">
                CMD_CENTER_v2.1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-sidebar-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-sidebar-primary"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  }
                />
                <div className="text-left">
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[10px] opacity-70 font-mono tracking-tight">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs text-accent font-mono">
              SYSTEM OPTIMAL
            </span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sidebar-foreground px-2 py-1 transition-colors group"
            >
              <Settings
                size={14}
                className="transition-transform duration-500 group-hover:rotate-90"
              />
              System Settings
            </button>
            {/* Quick Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
