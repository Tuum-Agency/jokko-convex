'use client'

import { useState } from 'react'
import { Sidebar, DashboardHeader } from '@/components/dashboard'
import { BrowserNotifications } from '@/components/browser-notifications'
import { NotificationBanner } from '@/components/dashboard/notification-banner'
import { CallNotificationProvider } from '@/components/calls/call-notification-provider'
import { usePresence } from '@/hooks/use-presence'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { Id } from '@/convex/_generated/dataModel'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user?: {
        name: string
        email: string
        avatar?: string
        role?: string
    }
    organizationName?: string
    organizationSlug?: string
    organizationId?: string
}

export function DashboardLayoutClient({
    children,
    user,
    organizationName,
    organizationSlug: _organizationSlug,
    organizationId: _organizationId,
}: DashboardLayoutClientProps) {
    const basePath = '/dashboard'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const { currentOrg } = useCurrentOrg()

    // Send heartbeat on ALL dashboard pages (not just conversations)
    usePresence(currentOrg?._id as Id<"organizations"> | undefined)

    return (
        <div className="flex h-screen bg-gray-50/50">
            {/* Desktop Sidebar */}
            <nav className="hidden lg:block" aria-label="Navigation principale">
                <Sidebar
                    basePath={basePath}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </nav>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <NotificationBanner />
                <BrowserNotifications />
                <CallNotificationProvider />
                {/* Header with mobile sidebar */}
                <DashboardHeader
                    basePath={basePath}
                    user={user}
                    organizationName={organizationName}
                    showSearch={true}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onExpandSidebar={() => setIsSidebarCollapsed(false)}
                />

                {/* Page Content */}
                <main id="main-content" className="flex-1 overflow-y-auto" role="main">
                    <div className="p-3 sm:p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
