import React, { useState } from 'react';
import { Bot, ChevronDown, Plus, Search } from 'lucide-react';
import { ChatInterface } from '../ChatInterface';
import { cn } from '../../utils/cn';

const AVAILABLE_AGENTS = [
    { id: 'orchestrator', name: 'Orchestrator', role: 'System Coordinator' },
    { id: 'coder', name: 'Coder-Alpha', role: 'Software Engineer' },
    { id: 'reviewer', name: 'Reviewer-01', role: 'QA Specialist' },
    { id: 'researcher', name: 'Researcher-X', role: 'Information Retrieval' },
];

const MOCK_THREADS = [
    { id: 1, title: 'Refactor Auth System', date: '2m ago', summary: 'Analyzing JWT implementation...' },
    { id: 2, title: 'MCP Integration', date: '1h ago', summary: 'Connecting filesystem server...' },
    { id: 3, title: 'UI Component Library', date: 'Yesterday', summary: 'Generating color palette...' },
    { id: 4, title: 'Performance Audit', date: '2d ago', summary: 'Identifying memory leaks...' },
];

export function AgentsView() {
    const [selectedAgent, setSelectedAgent] = useState(AVAILABLE_AGENTS[0].id);
    const [selectedThread, setSelectedThread] = useState<number | null>(null);

    const activeAgent = AVAILABLE_AGENTS.find(a => a.id === selectedAgent) || AVAILABLE_AGENTS[0];

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Main Chat Panel */}
            <div className="flex-1 min-w-0 bg-background/20 relative flex flex-col min-h-0">

                {/* Watermark: Responsive Typography & Positioning */}
                <div className="absolute top-4 left-4 lg:top-8 lg:left-8 pointer-events-none opacity-10 select-none z-0">
                     <h2 className="text-3xl lg:text-6xl font-black tracking-tighter uppercase text-muted-foreground/20 leading-none transition-all duration-300">
                        {activeAgent.name}
                     </h2>
                     <p className="font-mono text-[10px] lg:text-xs text-muted-foreground/40 mt-1 lg:mt-2 uppercase tracking-widest pl-1">
                        {activeAgent.role}
                     </p>
                </div>

                <ChatInterface mode="full" className="h-full z-10" />
            </div>

            {/* Agent Selector & Threads Sidebar */}
            <div className="flex flex-col border-l border-border/50 bg-secondary/5 backdrop-blur-sm min-h-0 w-[240px] min-w-[240px] shrink-0">

                {/* Header */}
                <div className="h-14 flex items-center px-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                        <Bot size={14} />
                        <span>Agents</span>
                    </div>
                </div>

                {/* Agent Selector */}
                <div className="p-4 border-b border-border/50 shrink-0">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5 block">Active Agent</label>
                    <div className="relative group">
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-card/80 shadow-sm"
                        >
                            {AVAILABLE_AGENTS.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-muted-foreground pointer-events-none" size={14} />
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground/60 font-mono text-right">
                        {activeAgent.role}
                    </div>
                </div>

                {/* Threads List */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 pb-2 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversations</span>
                        <button className="p-1 hover:bg-secondary rounded text-muted-foreground transition-colors" title="New Thread">
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="px-4 pb-2 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-muted-foreground/40" size={12} />
                            <input
                                type="text"
                                placeholder="Filter threads..."
                                className="w-full bg-secondary/20 border border-border/30 rounded-md py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:border-border transition-colors placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pt-2">
                        {MOCK_THREADS.map(thread => (
                            <div
                                key={thread.id}
                                onClick={() => setSelectedThread(thread.id)}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent",
                                    selectedThread === thread.id
                                        ? "bg-card border-border/50 shadow-sm"
                                        : "hover:bg-secondary/30 hover:border-border/20"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={cn(
                                        "text-xs font-medium truncate max-w-[70%]",
                                        selectedThread === thread.id ? "text-foreground" : "text-muted-foreground"
                                    )}>{thread.title}</h4>
                                    <span className="text-[10px] text-muted-foreground/50">{thread.date}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/70 truncate line-clamp-1">
                                    {thread.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
