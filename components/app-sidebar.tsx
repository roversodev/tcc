"use client"

import * as React from "react"
import {
  IconDashboard,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconPackage,
  IconTool,
  IconClock,
  IconArrowsLeftRight,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import Image from "next/image"

const data = {
  user: {
    name: "Vitor Roverso",
    email: "vitorroverso40@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Agenda Dinâmica",
      url: "/agenda",
      icon: IconCalendarEvent,
    },
    {
      title: "Serviços em Andamento",
      url: "/agenda/hoje",
      icon: IconClock,
    },
    {
      title: "Controle de Estoque",
      url: "/estoque",
      icon: IconPackage,
    },
    {
      title: "Movimentações",
      url: "/estoque/movimentacoes",
      icon: IconArrowsLeftRight,
    },
    {
      title: "Gestão de Clientes",
      url: "/clientes",
      icon: IconUsers,
    },
    {
      title: "Serviços",
      url: "/servicos",
      icon: IconTool,
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: IconSettings,
    },
    {
      title: "Ajuda",
      url: "/ajuda",
      icon: IconHelp,
    },
    {
      title: "Pesquisar",
      url: "/pesquisar",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
