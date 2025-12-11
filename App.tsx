import React, { useState, useRef, useEffect } from 'react';
import { AppMode, AnalysisRequest, HistoryItem } from './types';
import { APP_MODES } from './constants';
import { analyzeContent } from './services/geminiService';
import { Button } from './components/Button';
import { ModeCard } from './components/ModeCard';
import { OutputDisplay } from './components/OutputDisplay';

const App: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<AppMode>(AppMode.DESCRIBE);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('accessibility_app_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const addToHistory = (text: string, response: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mode: selectedMode,
      inputText: text,
      response: response,
      hasImage: !!selectedImage
    };
    
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    
    try {
      localStorage.setItem('accessibility_app_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history - likely quota exceeded", e);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setSelectedMode(item.mode);
    setInputText(item.inputText);
    setResponseContent(item.response);
    setError(null);
    setShowHistory(false);
    // Note: We don't restore the image as we don't save the base64 string to avoid storage limits
    if (item.hasImage) {
      // Could show a notification that image wasn't restored
      setSelectedImage(null);
      setImageMimeType(null);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your history?")) {
      setHistory([]);
      localStorage.removeItem('accessibility_app_history');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let newTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newTranscript += event.results[i][0].transcript;
        }
      }
      
      if (newTranscript) {
        setInputText(prev => {
          const spacer = prev && !/\s$/.test(prev) ? ' ' : '';
          return prev + spacer + newTranscript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError("Microphone access was denied. Please allow microphone access to use voice input.");
      } else if (event.error === 'no-speech') {
         // Ignore
      } else {
        setError(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !selectedImage) {
      setError('Please provide either text or an image to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResponseContent('');

    const request: AnalysisRequest = {
      text: inputText,
      imageBase64: selectedImage || undefined,
      imageMimeType: imageMimeType || undefined,
      mode: selectedMode
    };

    const result = await analyzeContent(request);

    setIsAnalyzing(false);

    if (result.error) {
      setError(result.error);
    } else {
      setResponseContent(result.markdown);
      addToHistory(inputText, result.markdown);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      {/* Skip Link for Screen Readers */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-700 text-white p-4 rounded-lg z-50 font-bold">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label="Logo">🦾</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Universal Accessibility Companion
              </h1>
              <p className="text-sm text-slate-600">Powered by Gemini 3 Pro</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle history"
            aria-expanded={showHistory}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline font-medium">History</span>
          </button>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setShowHistory(false)}
            aria-hidden="true"
          ></div>
          
          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">History</h2>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-slate-200 rounded-full"
                  aria-label="Close history"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p>No history yet.</p>
                  <p className="text-sm mt-1">Analyses will appear here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.mode}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium line-clamp-2 mb-1">
                      {item.inputText || (item.hasImage ? 'Image Analysis' : 'Empty Request')}
                    </p>
                    {item.hasImage && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Includes Image
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Error Message */}
        {error && (
          <div 
            className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-r-lg"
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Upload or Input */}
          <section aria-labelledby="input-heading">
            <h2 id="input-heading" className="text-2xl font-bold text-slate-900 mb-4">
              1. Add Content
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Image Upload */}
              <div>
                <label className="block text-base font-semibold text-slate-900 mb-2">
                  Upload Image or Screenshot (Optional)
                </label>
                
                {!selectedImage ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                       onClick={() => fileInputRef.current?.click()}>
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-slate-400 group-hover:text-blue-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={selectedImage} alt="Preview of uploaded content" className="max-h-64 object-contain mx-auto" />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-red-50 focus:ring-2 focus:ring-red-500"
                      aria-label="Remove image"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              {/* Text Input with Voice */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="text-input" className="block text-base font-semibold text-slate-900">
                    Additional Instructions or Text
                  </label>
                  
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${isListening 
                        ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse ring-2 ring-red-400' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}
                    `}
                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                    aria-pressed={isListening}
                  >
                    {isListening ? (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span>Listening...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span>Voice Input</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="relative">
                  <textarea
                    id="text-input"
                    rows={3}
                    className={`block w-full rounded-lg shadow-sm sm:text-lg p-3 border transition-colors
                      ${isListening ? 'border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}
                    `}
                    placeholder={isListening ? "Listening... speak now." : "e.g., 'Describe the main buttons on this screen' or paste text here..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  {isListening && (
                    <div className="absolute top-2 right-2">
                       <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Mode Selection */}
          <section aria-labelledby="mode-heading">
            <h2 id="mode-heading" className="text-2xl font-bold text-slate-900 mb-4">
              2. Select Assistance Mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-labelledby="mode-heading">
              {APP_MODES.map((mode) => (
                <ModeCard
                  key={mode.id}
                  mode={mode}
                  isSelected={selectedMode === mode.id}
                  onSelect={setSelectedMode}
                />
              ))}
            </div>
          </section>

          {/* Submit Button */}
          <div className="sticky bottom-6 z-20">
            <div className="absolute inset-0 bg-slate-50 opacity-90 blur-md -z-10 rounded-xl transform scale-105"></div>
            <Button 
              type="submit" 
              fullWidth 
              loading={isAnalyzing}
              className="text-lg shadow-lg hover:shadow-xl transform transition-transform active:scale-[0.99]"
            >
              {isAnalyzing ? 'Analyzing Content...' : 'Analyze Content'}
            </Button>
          </div>

        </form>

        {/* Results Area */}
        <OutputDisplay content={responseContent} isLoading={isAnalyzing} />

      </main>
    </div>
  );
};

export default App;