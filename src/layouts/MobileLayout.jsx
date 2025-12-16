
import React from 'react';
import BottomTabBar from './BottomTabBar';
import Navbar from '../components/NavBar';
import useIsMobile from '../hooks/useIsMobile';

const MobileLayout = ({ children }) => {
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-accent selection:text-black">
            {/* Desktop Navigation */}
            {!isMobile && (
                <div>
                    <Navbar />
                </div>
            )}

            {/* Main Content Area */}
            {/* Add padding-bottom for mobile nav safe area if mobile */}
            <main className={`flex-1 w-full relative ${isMobile ? 'pb-24' : ''}`}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            {isMobile && <BottomTabBar />}
        </div>
    );
};

export default MobileLayout;
