import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import GamesView from './components/GamesView';
import Standings from './components/Standings';
import PlayerSearch from './components/PlayerSearch';
import RedditFeed from './components/RedditFeed';
import News from './components/News';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('games');

  const renderContent = () => {
    switch (activeTab) {
      case 'games':
        return <GamesView />;
      case 'standings':
        return <Standings />;
      case 'players':
        return <PlayerSearch />;
      case 'news':
        return <News />;
      case 'reddit':
        return <RedditFeed />;
      default:
        return <GamesView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;

