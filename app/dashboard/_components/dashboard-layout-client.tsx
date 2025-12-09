import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Sidebar, DashboardHeader } from '@/components/dashboard'
import { BrowserNotifications } from '@/components/browser-notifications'
import { NotificationBanner } from '@/components/dashboard/notification-banner'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user?: {
        name: string
        email: string
        avatar?: string
    }
    organizationName?: string
    organizationSlug?: string
    organizationId?: string
}

export function DashboardLayoutClient({
    children,
    user,
    organizationName,
    organizationSlug,
    organizationId,
}: DashboardLayoutClientProps) {
    const basePath = '/dashboard'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // Presence Heartbeat
    const heartbeat = useMutation(api.presence.heartbeat)

    useEffect(() => {
        if (!organizationId) return

        // Initial heartbeat
        heartbeat({ organizationId: organizationId as Id<"organizations"> })

        // Periodic heartbeat (every 30 seconds)
        const intervalId = setInterval(() => {
            heartbeat({ organizationId: organizationId as Id<"organizations"> })
        }, 30000)

        return () => clearInterval(intervalId)
    }, [organizationId, heartbeat])

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
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
