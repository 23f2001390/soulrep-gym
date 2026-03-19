"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const HEADING_FONT = "'Bebas Neue', sans-serif";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function TopBar({ title }: { title: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { readAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b-4 border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="lg:hidden w-10" />
        <h2 className="text-xl font-black uppercase tracking-widest flex-shrink-0" style={{ fontFamily: HEADING_FONT }}>
          {title}
        </h2>
        <div className="flex-1" />
        
        <div className="hidden md:flex items-center max-w-sm flex-1">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search logs or members..." className="pl-9 h-9 border-2 border-muted focus-visible:ring-0 focus-visible:border-primary transition-colors font-bold text-xs uppercase" />
          </div>
        </div>

        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-colors">
              <Bell size={20} className={unreadCount > 0 ? "text-primary animate-pulse" : ""} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-black border-2 border-background">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 overflow-hidden border-4 border-muted" align="end">
            <div className="p-4 bg-muted flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tighter" style={{ fontFamily: HEADING_FONT }}>Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAsRead()} className="h-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                  <Check size={12} /> Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72">
              {notifications.length > 0 ? (
                <div className="grid divide-y divide-muted">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 transition-colors ${!n.read ? 'bg-primary/5 border-l-4 border-primary' : 'bg-transparent border-l-4 border-transparent'}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <p className="font-black text-xs uppercase tracking-tight leading-none mb-1">{n.title}</p>
                      <p className="text-[11px] font-medium text-muted-foreground leading-snug">{n.message}</p>
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20">
                  <Bell size={32} className="text-muted-foreground/20 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inbox Zero</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Avatar className="h-9 w-9 border-2 border-muted hover:border-primary transition-colors cursor-pointer">
          <AvatarFallback className="text-[10px] font-black bg-muted text-foreground uppercase tracking-widest">SR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
