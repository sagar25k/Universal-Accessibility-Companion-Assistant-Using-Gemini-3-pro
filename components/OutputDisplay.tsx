import React, { useState, useEffect, useRef } from 'react';

interface OutputDisplayProps {
  content: string;
  isLoading: boolean;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, isLoading }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Auto-focus the result for screen readers when content arrives
  useEffect(() => {
    if (!isLoading && content && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isLoading, content]);

  // Stop speaking if component unmounts or content changes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setFeedback(null);
    }
  }, [isLoading]);

  if (!content && !isLoading) return null;

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    // Strip markdown symbols for better speech if possible, 
    // but browsers often handle basic punctuation okay. 
    // Ideally, we'd clean '##' or '*' but raw text is usually understandable.
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-companion-result-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headings
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-xl font-bold text-slate-900 mt-6 mb-3">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={index} className="text-2xl font-bold text-slate-900 mt-6 mb-4">{line.replace('# ', '')}</h2>;
      }
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={index} className="ml-4 mb-2 text-slate-800 list-disc">
            {line.replace(/^[\*\-]\s+/, '')}
          </li>
        );
      }
      // Bold text (simple implementation)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-3 text-slate-800 leading-relaxed">
            {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
          </p>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2" aria-hidden="true" />;
      }
      // Standard paragraph
      return <p key={index} className="mb-3 text-slate-800 leading-relaxed">{line}</p>;
    });
  };

  return (
    <section 
      className="mt-8 bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden"
      aria-label="Analysis Results"
    >
      <header className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>✨</span> Companion Response
        </h2>

        {!isLoading && content && (
          <div className="flex items-center gap-2">
            {/* Feedback Buttons */}
            <div className="flex bg-white rounded-lg border border-slate-300 mr-2 overflow-hidden">
              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={`p-2 hover:bg-slate-50 focus:outline-none focus:bg-slate-100 ${feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-slate-500'}`}
                aria-label="Thumbs up"
                aria-pressed={feedback === 'up'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <div className="w-px bg-slate-300"></div>
              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={`p-2 hover:bg-slate-50 focus:outline-none focus:bg-slate-100 ${feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500'}`}
                aria-label="Thumbs down"
                aria-pressed={feedback === 'down'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>

            {/* Read Aloud */}
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                ${isSpeaking 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
            >
              {isSpeaking ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Read
                </>
              )}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              title="Download result as text file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="sr-only sm:not-sr-only">Download</span>
            </button>
          </div>
        )}
      </header>
      
      <div 
        ref={contentRef}
        tabIndex={-1} // Allow programmatic focus
        className="p-6 md:p-8 outline-none"
      >
        {isLoading ? (
           <div className="space-y-4 animate-pulse" role="status" aria-label="Loading analysis">
             <div className="h-6 bg-slate-200 rounded w-3/4"></div>
             <div className="h-4 bg-slate-200 rounded w-full"></div>
             <div className="h-4 bg-slate-200 rounded w-5/6"></div>
             <div className="h-4 bg-slate-200 rounded w-4/6"></div>
           </div>
        ) : (
          <div className="prose prose-slate max-w-none">
            <div role="article">
              {renderContent(content)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};