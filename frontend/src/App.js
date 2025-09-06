import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import WelcomeView from './components/WelcomeView';
import SettingsModal from './components/SettingsModal';
import { ALL_TOOLS } from './lib/tools';


const loadStateFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem('adoChatState');
    if (serializedState === null) {
     
      return {
        theme: 'dark',
        conversations: {},
        currentConversationId: null,
        settings: {
          backend: 'ollama',
          apiKey: '',
          model: null,
        }
      };
    }
    const savedState = JSON.parse(serializedState);
    // دڵنیادەبینەوە کە هەموو بەشەکانی state بوونیان هەیە
    return {
        theme: savedState.theme || 'dark',
        conversations: savedState.conversations || {},
        currentConversationId: savedState.currentConversationId || null,
        settings: savedState.settings || { backend: 'ollama', apiKey: '', model: null }
    };
  } catch (error) {
    console.error("Could not load state from localStorage", error);
    // لەکاتی هەڵەدا، داتای سەرەتایی دەگەڕێنینەوە
    return {
        theme: 'dark',
        conversations: {},
        currentConversationId: null,
        settings: {
          backend: 'ollama',
          apiKey: '',
          model: null,
        }
    };
  }
};

function App() {
  // *** گۆڕانکاریی هەرە سەرەکی لێرەدایە ***
  // ئێمە useState بەکار دەهێنین لەگەڵ فەنکشنێک بۆ ئەوەی تەنها یەکجار لەسەرەتادا
  // داتا لە localStorage بخوێنێتەوە.
  const [appState, setAppState] = useState(loadStateFromLocalStorage);
  
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  // ئەم useEffectـە بۆ پاشەکەوتکردنە هەر کاتێک appState بگۆڕێت
  useEffect(() => {
    try {
      const serializedState = JSON.stringify(appState);
      localStorage.setItem('adoChatState', serializedState);
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  }, [appState]);
  
  
  useEffect(() => {
    document.documentElement.className = appState.theme;
  }, [appState.theme]);

  const handleNewConversation = () => {
    const newId = `convo_${Date.now()}`;
    const newConversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      timestamp: Date.now()
    };
    setAppState(prev => ({
      ...prev,
      conversations: { ...prev.conversations, [newId]: newConversation },
      currentConversationId: newId,
    }));
  };
  
  const handleDeleteConversation = (idToDelete) => {
    setAppState(prev => {
      const newConversations = { ...prev.conversations };
      delete newConversations[idToDelete];
      return {
        ...prev,
        conversations: newConversations,
        currentConversationId: prev.currentConversationId === idToDelete ? null : prev.currentConversationId,
      };
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm('دڵنیایت لە سڕینەوەی هەموو گفتوگۆکان؟')) {
      setAppState(prev => ({
        ...prev,
        conversations: {},
        currentConversationId: null,
      }));
    }
  };
  
  const handleThemeToggle = () => {
    setAppState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleSettingsSave = (newSettings) => {
    setAppState(prev => ({
      ...prev,
      settings: newSettings,
    }));
    setSettingsModalOpen(false);
  };

  const currentConversation = appState.conversations[appState.currentConversationId];

  return (
    <div className="app-layout grid grid-cols-[320px_1fr] h-screen bg-bg-main text-text-main">
      <Sidebar
        conversations={appState.conversations}
        currentConversationId={appState.currentConversationId}
        setCurrentConversationId={(id) => setAppState(prev => ({ ...prev, currentConversationId: id }))}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteAll={handleDeleteAll}
        onThemeToggle={handleThemeToggle}
        theme={appState.theme}
        onSettingsClick={() => setSettingsModalOpen(true)}
      />
      <main className="chat-container flex flex-col overflow-hidden">
        {currentConversation ? (
          <ChatView
            key={appState.currentConversationId}
            conversation={currentConversation}
            setConversations={(updater) => setAppState(prev => ({ ...prev, conversations: updater(prev.conversations) }))}
            settings={appState.settings}
            allTools={ALL_TOOLS}
          />
        ) : (
          <WelcomeView />
        )}
      </main>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={appState.settings}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default App;