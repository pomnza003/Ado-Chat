import React from 'react';

const Sidebar = ({ conversations, currentConversationId, setCurrentConversationId, onNewConversation, onDeleteConversation, onDeleteAll, onThemeToggle, theme, onSettingsClick }) => {
    const sortedConversations = Object.values(conversations).sort((a, b) => b.timestamp - a.timestamp);

    const handleDelete = (e, id) => {
        e.stopPropagation(); 
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDeleteConversation(id);
        }
    };
    
    return (
        <aside className="sidebar bg-bg-sidebar p-6 flex flex-col gap-6 border-r border-border-color">
            <div className="sidebar-header flex items-center justify-between">
                <div className="brand flex items-center gap-4">
                    <div className="logo w-12 h-12 rounded-md bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-extrabold text-white text-2xl shadow-primary">A</div>
                    <h1 className="text-xl font-bold text-text-dark">Ado Chat</h1>
                </div>
                <button onClick={onNewConversation} title="New Chat" className="btn-icon bg-bg-card border border-border-color p-3 rounded-md hover:bg-bg-hover">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            <div className="sidebar-menu flex-1 overflow-y-auto flex flex-col gap-2 pr-2">
                <div className="menu-title text-xs font-bold text-text-muted uppercase tracking-wider px-2 py-2">All Chat</div>
                {sortedConversations.map(convo => (
                    <div
                        key={convo.id}
                        className={`group conversation-item p-4 flex justify-between items-center rounded-md cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:bg-bg-hover hover:translate-x-1 ${currentConversationId === convo.id ? 'bg-bg-selected border-accent-primary font-semibold text-text-dark' : ''}`}
                        onClick={() => setCurrentConversationId(convo.id)}
                    >
                        <span className="truncate block flex-1">{convo.title}</span>
                        <button onClick={(e) => handleDelete(e, convo.id)} title="Delete" className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent-danger p-1">
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
            <div className="sidebar-footer flex flex-col gap-4 border-t border-border-color pt-6">
                 <div className="footer-actions flex gap-3">
                    <button onClick={onSettingsClick} className="btn flex-1 bg-bg-card border border-border-color p-3 rounded-md hover:bg-bg-hover flex items-center justify-center gap-2 font-semibold">
                        <span>Settings</span>
                    </button>
                    <button onClick={onThemeToggle} className="btn-icon bg-bg-card border border-border-color p-3 rounded-md hover:bg-bg-hover">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                 </div>
                 <div className="footer-actions flex gap-3">
                    <button onClick={onDeleteAll} className="btn flex-1 bg-accent-danger/20 text-accent-danger border border-accent-danger/30 p-3 rounded-md hover:bg-accent-danger/40 flex items-center justify-center gap-2 font-semibold">
                        <span>Delete All</span>
                    </button>
                 </div>
            </div>
        </aside>
    );
};

export default Sidebar;