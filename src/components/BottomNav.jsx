import React from 'react';
import { Home, Trophy, Users, TrendingUp, MessageSquare } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'games', label: 'Games', icon: Home },
        { id: 'standings', label: 'Standings', icon: Trophy },
        { id: 'players', label: 'Players', icon: Users },
        { id: 'news', label: 'News', icon: TrendingUp },
        { id: 'reddit', label: 'Reddit', icon: MessageSquare },
    ];

    return (
        <nav className="mobile-bottom-nav glass-panel">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-item-mobile ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
