"use client";

import { useState } from "react";
import { LayoutDashboard, BarChart3, LogOut, ChevronRight } from "lucide-react";

interface SidebarProps {
  activeItem?: string;
}

export function DashboardSidebar({ activeItem = "overview" }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  const menuItems = [
    {
      title: "DASHBOARD",
      color: "text-yellow-400",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "executive", label: "Executive Dashboard", icon: BarChart3 },
      ],
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-slate-900 flex flex-col border-r border-slate-800">
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-8 h-8">
              <polygon points="30,30 100,170 70,170" fill="#4CAF50" />
              <polygon points="30,30 120,170 90,170" fill="#8BC34A" />
              <polygon points="30,30 140,170 110,170" fill="#FFC107" />
              <polygon points="30,30 160,170 130,170" fill="#FF9800" />
              <polygon points="30,30 180,170 150,170" fill="#E91E63" />
              <polygon points="30,30 200,170 170,170" fill="#9C27B0" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">
              ASIA POULTRY
            </div>
            <div className="text-[10px] text-blue-400 font-semibold">
              FEEDS
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        {menuItems.map((section) => (
          <div key={section.title} className="mb-2">
            {/* Section Header */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`w-full px-4 py-2 flex items-center justify-between text-xs font-bold tracking-wider ${section.color} hover:bg-slate-800/50 transition-colors`}
            >
              <span>{section.title}</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>

            {/* Sub Items */}
            {expanded && (
              <div className="mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">T</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              Technical Director
            </div>
            <div className="text-xs text-slate-500">Admin • All</div>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
