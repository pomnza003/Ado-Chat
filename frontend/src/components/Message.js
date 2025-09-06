import React from 'react';
import { marked } from 'marked';
import 'highlight.js/styles/atom-one-dark.css';
import hljs from 'highlight.js';
import AgentWork from './AgentWork';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  gfm: true,
  breaks: true,
});

// Sources are now handled by SearchSources in AgentWork component
const Sources = ({ sources }) => {
    return null; 
};

const Message = ({ message, modelName }) => {
    const { role, content, steps, sources } = message;
    const isUser = role === 'user';

    const renderMarkdown = (text) => {
        try {
            return { __html: marked.parse(text || "") };
        } catch(e) {
            return { __html: text };
        }
    };

    return (
        <div className={`msg flex gap-5 animate-messageSlideIn`}>
            <div className={`msg-avatar w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg border-2 border-bg-main shadow-custom ${isUser ? 'bg-gradient-to-br from-accent-secondary to-accent-tertiary text-white' : 'bg-gradient-to-br from-accent-primary to-accent-success text-white'}`}>
                {isUser ? 'U' : 'A'}
            </div>
            <div className="msg-content flex-1 min-w-0 bg-bg-card rounded-xl p-6 border border-border-color shadow-custom">
                <div className="msg-meta text-sm font-semibold mb-4 text-text-muted">
                    <span>{isUser ? 'You' : modelName}</span>
                </div>
                
                {content && <div className="msg-body text-base leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(content)} />}
                
                {steps && Object.keys(steps).length > 0 && (
                     <AgentWork steps={steps} sources={sources} />
                )}

                {role === 'assistant' && !content && Object.keys(steps || {}).length === 0 && (
                    <div className="loading-indicator flex items-center gap-2 text-text-muted italic">
                        <div className="typing-indicator flex gap-1">
                            <div className="typing-dot w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="typing-dot w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="typing-dot w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce"></div>
                        </div>
                        <span>Processing...</span>
                    </div>
                )}
                
                <Sources sources={sources} />
            </div>
        </div>
    );
};

export default Message;