import React from 'react';
import { Home, Trophy, Users, TrendingUp, MessageSquare } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'games', label: 'Games', icon: Home },
        { id: 'standings', label: 'Standings', icon: Trophy },
        { id: 'players', label: 'Players', icon: Users },
        { id: 'news', label: 'Injuries & News', icon: TrendingUp },
        { id: 'reddit', label: 'Reddit Feed', icon: MessageSquare },
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="logo-container">
                <div className="logo-icon">NBA</div>
                <span className="logo-text">STATS<span>PRO</span></span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <p>© 2026 NBA Stats Pro</p>
            </div>
        </aside>
    );
};

export default Sidebar;
