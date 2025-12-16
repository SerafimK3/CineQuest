
import React from 'react';
import BottomTabBar from './BottomTabBar';
import Navbar from '../components/NavBar';

const MobileLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-accent selection:text-black">
            {/* Desktop Navigation (Hidden on Mobile) */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Main Content Area */}
            {/* Add padding-bottom for mobile nav safe area */}
            <main className="flex-1 w-full pb-20 md:pb-0 relative">
                {children}
            </main>

            {/* Mobile Bottom Navigation (Hidden on Desktop) */}
            <BottomTabBar />
        </div>
    );
};

export default MobileLayout;
