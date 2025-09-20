import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Home, List, BarChart3, LogOut, Shield, Settings, User as UserIcon, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { useNavigate } from "react-router-dom";

const AdminDashboardContent: React.FC = () => {
  const navigate = useNavigate();

  const currentView = {
    title: "Admin Dashboard",
    subtitle: "Real-time civic issue management & transparency"
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">CiviLink</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive>
                  <Home className="w-4 h-4" />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="All Reports" onClick={() => navigate('/admin/issues')}>
                  <List className="w-4 h-4" />
                  All Reports
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Analytics" onClick={() => navigate('/admin/analytics')}>
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@CiviLink.com</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-4 py-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden flex-shrink-0" />
          <div className="flex w-full items-center justify-between min-w-0">
            <div className="bg-gray-100 rounded-md px-2 py-1 flex items-start gap-3 min-w-0 pr-4">
              <Activity className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold leading-none">
                  <span className="sm:hidden truncate">{currentView.title}</span>
                  <span className="hidden sm:inline">{currentView.title}</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {currentView.subtitle}
                </p>
               </div> 
            </div>
 <div className="bg-gray-100 rounded-md px-2 py-1">
 <div className="flex items-center gap-2 flex-shrink-0">
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
 </span>
 <span className="hidden text-sm text-muted-foreground sm:inline">Live Updates</span>
 </div>
 </div>
           </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-0">
          <DashboardOverview />
        </main>
      </SidebarInset>
    </>
  );
}

const AdminDashboard: React.FC = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminDashboardContent />
    </SidebarProvider>
  );
};

export default AdminDashboard;
