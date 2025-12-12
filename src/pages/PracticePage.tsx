import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Bug } from 'lucide-react';
import { useRecordingService } from '@/hooks/useRecordingService';
import { API_CONFIG, API_HEADERS } from '@/api/config';
import clsx from 'clsx';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function PracticePage() {
  const navigate = useNavigate();
  const { state, startRecording, stopRecording, checkPermission } = useRecordingService();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing your recording...');
  
  // Debug mode state (hidden feature - triple-click on title to toggle)
  const [debugMode, setDebugMode] = useState(false);
  const [debugText, setDebugText] = useState('');
  const [debugClickCount, setDebugClickCount] = useState(0);

  // Check microphone permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Triple-click detection for debug mode
  const handleTitleClick = () => {
    setDebugClickCount(prev => prev + 1);
    setTimeout(() => setDebugClickCount(0), 500); // Reset after 500ms
    if (debugClickCount >= 2) {
      setDebugMode(prev => !prev);
      setDebugClickCount(0);
    }
  };

  // Submit debug text - creates tokens directly and triggers analysis
  const handleDebugSubmit = async () => {
    if (!debugText.trim()) return;
    
    setIsProcessing(true);
    setProcessingMessage('Creating debug session...');
    
    try {
      const conversationId = crypto.randomUUID();
      console.log('[DEBUG] Created conversation ID:', conversationId);
      
      // 1. Update status to 'recording'
      setProcessingMessage('Setting up conversation...');
      const statusUrl = `${API_CONFIG.baseUrl}/dynamic-handler`;
      await fetch(statusUrl, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ conversation_id: conversationId, status: 'recording' }),
      });
      console.log('[DEBUG] Status set to recording');
      
      // 2. Create tokens from the pasted text
      setProcessingMessage('Creating tokens from text...');
      const words = debugText.trim().split(/\s+/);
      const tokens = words.map((word, idx) => ({
        id: `${conversationId}-${idx}-${Math.random().toString(36).slice(2, 10)}`,
        conversation_id: conversationId,
        start_ms: idx * 300, // Simulate ~200ms per word (300 WPM pace)
        end_ms: (idx + 1) * 300 - 50,
        text: word,
        tags: [],
      }));
      
      // 3. Insert tokens directly via the Supabase REST API
      // Extract the base Supabase URL from the functions URL
      const supabaseUrl = API_CONFIG.baseUrl.replace('/functions/v1', '');
      
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey}`,
          'apikey': API_CONFIG.apiKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(tokens),
      });
      
      if (!insertResponse.ok) {
        const error = await insertResponse.text();
        throw new Error(`Failed to insert tokens: ${error}`);
      }
      console.log('[DEBUG] Inserted', tokens.length, 'tokens');
      
      // 4. Update status to 'processing'
      setProcessingMessage('Triggering analysis...');
      await fetch(statusUrl, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ conversation_id: conversationId, status: 'processing' }),
      });
      console.log('[DEBUG] Status set to processing');
      
      // 5. Trigger clever-service (fire and forget)
      const cleverUrl = `${API_CONFIG.baseUrl}/clever-service`;
      fetch(cleverUrl, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ name: 'Functions' }),
      }).then(() => console.log('[DEBUG] Clever-service triggered'));
      
      // 6. Poll for analysis completion (same as normal flow)
      setProcessingMessage('Analyzing your speech...');
      const ready = await waitForAnalysis(conversationId, 60000);
      
      if (ready) {
        setProcessingMessage('Analysis complete! Loading results...');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setProcessingMessage('Analysis is taking longer than expected. Redirecting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      navigate(`/sessions/${conversationId}`);
      
    } catch (error) {
      console.error('[DEBUG] Error:', error);
      setProcessingMessage(`Error: ${error}`);
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error: unknown) {
      console.error('Failed to start recording:', error);
    }
  };

  // Poll for analysis completion
  const waitForAnalysis = async (conversationId: string, maxWaitMs = 60000): Promise<boolean> => {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Try to fetch the analysis directly
        const response = await fetch(
          `${API_CONFIG.baseUrl}/quick-handler`,
          {
            method: 'POST',
            headers: API_HEADERS,
            body: JSON.stringify({ conversation_id: conversationId }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PracticePage] Poll response:', { hasSegments: !!data?.segments, segmentCount: data?.segments?.length });
          // Check if analysis has segments (indicating it's complete)
          if (data?.segments && data.segments.length > 0) {
            console.log('[PracticePage] Analysis ready!');
            return true;
          }
        } else {
          console.log('[PracticePage] Poll response not OK:', response.status);
        }
      } catch (error) {
        console.log('[PracticePage] Polling error, retrying...', error);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      setProcessingMessage(`Analyzing your speech... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
    }
    
    console.log('[PracticePage] Polling timed out');
    return false;
  };

  const handleStopRecording = async () => {
    if (state.duration < 3) {
      // Minimum recording duration check
      return;
    }
    
    setIsProcessing(true);
    setProcessingMessage('Uploading your recording...');
    
    try {
      const conversationId = await stopRecording();
      
      if (conversationId) {
        setProcessingMessage('Analyzing your speech...');
        
        // Poll for analysis completion (up to 60 seconds)
        const ready = await waitForAnalysis(conversationId, 60000);
        
        if (ready) {
          setProcessingMessage('Analysis complete! Loading results...');
          // Small delay to show the success message
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          setProcessingMessage('Analysis is taking longer than expected. Redirecting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        navigate(`/sessions/${conversationId}`);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (state.isRecording) {
      await stopRecording();
    }
    navigate('/dashboard');
  };

  const canStopRecording = state.duration >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <button 
          onClick={handleCancel}
          className="mb-6 flex items-center gap-2 text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 
            className="font-display text-4xl font-bold text-white cursor-default select-none"
            onClick={handleTitleClick}
          >
            Practice Session
          </h1>
          <p className="mt-2 text-slate-400">
            {!state.isRecording && !isProcessing && 'Press the record button to start your practice'}
            {state.isRecording && 'Recording in progress — speak naturally'}
            {isProcessing && processingMessage}
          </p>
          {debugMode && (
            <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              <Bug className="h-3 w-3" /> Debug Mode
            </span>
          )}
        </div>

        {/* Debug Panel - Hidden until activated */}
        {debugMode && !state.isRecording && !isProcessing && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-400">
              <Bug className="h-4 w-4" />
              <span className="text-sm font-semibold">Debug: Paste Speech Text</span>
            </div>
            <textarea
              value={debugText}
              onChange={(e) => setDebugText(e.target.value)}
              placeholder="Paste your speech text here. It will be converted to tokens and processed through the same backend flow as real recordings..."
              className="mb-3 h-32 w-full resize-none rounded-lg border border-amber-500/20 bg-slate-950/50 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {debugText.trim().split(/\s+/).filter(w => w).length} words
              </span>
              <button
                onClick={handleDebugSubmit}
                disabled={!debugText.trim()}
                className={clsx(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition',
                  debugText.trim()
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'cursor-not-allowed bg-slate-700 text-slate-500'
                )}
              >
                Submit Debug Text
              </button>
            </div>
          </div>
        )}

        {/* Main Recording Area */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
          
          <div className="relative">
            {/* Timer */}
            <div className="mb-8 text-center">
              <div className={clsx(
                'inline-flex items-center gap-3 rounded-2xl border px-6 py-3 transition-colors',
                state.isRecording 
                  ? 'border-red-500/30 bg-red-500/10' 
                  : 'border-white/10 bg-white/5'
              )}>
                <div className={clsx(
                  'h-3 w-3 rounded-full transition-colors',
                  state.isRecording ? 'animate-pulse bg-red-500' : 'bg-slate-600'
                )} />
                <span className="font-mono text-3xl font-semibold text-white">
                  {formatDuration(state.duration)}
                </span>
              </div>
              {state.isRecording && state.duration < 3 && (
                <p className="mt-2 text-xs text-amber-400">
                  Record at least 3 seconds
                </p>
              )}
            </div>

            {/* Transcript Display */}
            <div className="mb-8 min-h-[280px] rounded-2xl border border-white/10 bg-slate-950/50 p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.15em] text-slate-400">
                  Live Transcript
                </span>
                {state.transcript && (
                  <span className="text-xs text-emerald-400">
                    {state.transcript.split(' ').filter((w: string) => w.length > 0).length} words
                  </span>
                )}
              </div>
              
              <div className="max-h-[200px] overflow-y-auto">
                {state.transcript ? (
                  <p className="text-lg leading-relaxed text-slate-200">
                    {state.transcript}
                  </p>
                ) : (
                  <p className="text-lg italic text-slate-500">
                    {state.isRecording 
                      ? 'Listening... start speaking' 
                      : 'Your speech will appear here in real-time...'}
                  </p>
                )}
              </div>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-300">{state.error}</p>
                  {state.permissionStatus === 'denied' && (
                    <p className="mt-1 text-xs text-red-400/80">
                      Please enable microphone access in your browser settings and refresh the page.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!state.isRecording && !isProcessing && (
                <>
                  <button
                    onClick={handleStartRecording}
                    disabled={state.permissionStatus === 'denied'}
                    className={clsx(
                      'flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition',
                      state.permissionStatus === 'denied'
                        ? 'cursor-not-allowed bg-slate-600 text-slate-400'
                        : 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/50'
                    )}
                  >
                    <Mic className="h-6 w-6" />
                    Start Recording
                  </button>
                </>
              )}

              {state.isRecording && (
                <button
                  onClick={handleStopRecording}
                  disabled={!canStopRecording}
                  className={clsx(
                    'flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition',
                    canStopRecording
                      ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-400 hover:shadow-red-500/50'
                      : 'cursor-not-allowed bg-slate-600 text-slate-400'
                  )}
                >
                  <MicOff className="h-6 w-6" />
                  Stop Recording
                </button>
              )}

              {isProcessing && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-8 py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    <span className="text-lg font-semibold text-emerald-300">{processingMessage}</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    This may take a few moments...
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            {!state.isRecording && !isProcessing && (
              <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Tips for best results
                </h3>
                <ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span>Speak clearly and at a natural pace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span>Find a quiet environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span>Position mic at comfortable distance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span>Session analyzed after recording</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Recording indicator */}
            {state.isRecording && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Recording will be automatically uploaded and analyzed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
