import React from 'react';
import { AniqSidebar } from '../components/AniqSidebar';
import { cn } from '../lib/utils';

export const AniqLayout = ({ children, className }) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex antialiased">
            {/* Background Gradient - Light version */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl" />
            </div>

            <AniqSidebar />

            <main className="flex-1 md:ml-64 relative z-10 p-6 md:p-8 overflow-x-hidden w-full">
                <div className={cn("max-w-7xl mx-auto animate-fade-in", className)}>
                    {children}
                </div>
            </main>
        </div>
    );
};
