import {
  Home,
  FileText,
  CheckSquare,
  Gamepad2,
  Lock,
  Image,
  Shield,
  LogOut,
  User,
  Calendar,
  Newspaper,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  user?: { username: string; isAdmin: boolean } | null;
  onLogout?: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const menuItems = [
    { title: "Dashboard", url: "/", icon: Home, testId: "link-dashboard" },
    { title: "Notes", url: "/notes", icon: FileText, testId: "link-notes" },
    { title: "Tasks", url: "/tasks", icon: CheckSquare, testId: "link-tasks" },
    { title: "Games", url: "/games", icon: Gamepad2, testId: "link-games" },
    {
      title: "Messages",
      url: "/messages",
      icon: Lock,
      testId: "link-messages",
    },
    { title: "Images", url: "/images", icon: Image, testId: "link-images" },
    { title: "Calendar", url: "/calendar", icon: Calendar, testId: "link-calendar" },
    { title: "News", url: "/news", icon: Newspaper, testId: "link-news" },
  ];

  const adminItems = user?.isAdmin
    ? [{ title: "Admin", url: "/admin", icon: Shield, testId: "link-admin" }]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold font-serif">iNotebook</span>
            <span className="text-xs text-muted-foreground">
              Secure & Smart
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url} onClick={handleLinkClick}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {user && (
          <div className="space-y-2">
            <Link href="/profile" onClick={handleLinkClick}>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.isAdmin ? "Administrator" : "User"}
                  </p>
                </div>
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              data-testid="button-logout"
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
