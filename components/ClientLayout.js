"use client";

export default function ClientLayout({ children }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen">
      {children}
    </div>
  );
}
