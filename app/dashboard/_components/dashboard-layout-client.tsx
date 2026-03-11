import { useState } from 'react'
import { Sidebar, DashboardHeader } from '@/components/dashboard'
import { BrowserNotifications } from '@/components/browser-notifications'
import { NotificationBanner } from '@/components/dashboard/notification-banner'

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

    // Heartbeat is handled by usePresence hook (via useRealtime) — no duplicate here

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
