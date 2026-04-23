export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-linear-to-br from-green-50 via-white to-blue-50">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            {children}
        </div>
    )
}
