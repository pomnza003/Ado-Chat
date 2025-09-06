import React from 'react';

const WelcomeView = () => {
    return (
        <div className="flex-1 flex items-center justify-center flex-col text-center p-10 bg-gradient-radial from-bg-card to-bg-content">
            <div className="logo w-20 h-20 text-4xl mb-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-extrabold text-white shadow-primary">A</div>
            <h1 className="text-3xl font-extrabold mb-4 text-text-dark">Chat Agent</h1>
            <p className="text-text-muted max-w-lg text-base leading-relaxed">
                Select a model of settings and start a conversation. You can enable the operator mode (Agent Mode) to perform complex tasks.
            </p>
        </div>
    );
};

export default WelcomeView;