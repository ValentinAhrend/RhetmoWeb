import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { listSessions } from '@/data/sessions';
import type { Session, AnalysisTiming } from '@/types/sessions';

// Performance analysis for debugging
interface PerformanceStats {
  sessions: SessionTimingData[];
  averages: {
    totalMs: number;
    aiCallsMs: number;
    msPerWord: number;
    msPerToken: number;
  };
  trends: {
    wordCountVsTime: { words: number; ms: number }[];
  };
}

interface SessionTimingData {
  id: string;
  title: string;
  timing: AnalysisTiming;
  analyzedAt: Date;
}

function PerformanceDebugPanel() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const sessions = await listSessions();
      console.log('[PerformanceDebug] Loaded sessions:', sessions.length);
      
      // Log which sessions have timing data for debugging
      sessions.forEach(s => {
        const hasTiming = !!s.analysis?.analysisTiming;
        console.log(`[PerformanceDebug] Session "${s.title}" (${s.id}): hasTiming=${hasTiming}`);
      });
      
      // Filter sessions with timing data
      const sessionsWithTiming: SessionTimingData[] = sessions
        .filter((s): s is Session & { analysis: { analysisTiming: AnalysisTiming } } => 
          !!s.analysis?.analysisTiming
        )
        .map(s => ({
          id: s.id,
          title: s.title,
          timing: s.analysis.analysisTiming,
          analyzedAt: new Date(s.analysis.analysisTiming.analyzedAt),
        }))
        .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime());

      console.log('[PerformanceDebug] Sessions with timing:', sessionsWithTiming.length);

      if (sessionsWithTiming.length === 0) {
        setStats(null);
        return;
      }

      // Calculate averages
      const avgTotal = sessionsWithTiming.reduce((sum, s) => sum + s.timing.totalMs, 0) / sessionsWithTiming.length;
      const avgAi = sessionsWithTiming.reduce((sum, s) => sum + s.timing.aiCallsMs, 0) / sessionsWithTiming.length;
      const avgMsPerWord = sessionsWithTiming.reduce((sum, s) => 
        sum + (s.timing.wordCount > 0 ? s.timing.totalMs / s.timing.wordCount : 0), 0
      ) / sessionsWithTiming.length;
      const avgMsPerToken = sessionsWithTiming.reduce((sum, s) => 
        sum + (s.timing.tokenCount > 0 ? s.timing.totalMs / s.timing.tokenCount : 0), 0
      ) / sessionsWithTiming.length;

      // Build word count vs time trend
      const wordCountVsTime = sessionsWithTiming.map(s => ({
        words: s.timing.wordCount,
        ms: s.timing.totalMs,
      }));

      setStats({
        sessions: sessionsWithTiming,
        averages: {
          totalMs: Math.round(avgTotal),
          aiCallsMs: Math.round(avgAi),
          msPerWord: Math.round(avgMsPerWord * 10) / 10,
          msPerToken: Math.round(avgMsPerToken * 10) / 10,
        },
        trends: { wordCountVsTime },
      });
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSpeedRating = (totalMs: number, wordCount: number) => {
    const msPerWord = wordCount > 0 ? totalMs / wordCount : 0;
    if (msPerWord < 20) return { label: 'Excellent', color: 'text-green-400' };
    if (msPerWord < 50) return { label: 'Good', color: 'text-blue-400' };
    if (msPerWord < 100) return { label: 'Slow', color: 'text-yellow-400' };
    return { label: 'Very Slow', color: 'text-red-400' };
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded && !stats) {
            loadPerformanceData();
          }
        }}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-200 font-medium">Performance Debugger</p>
            <p className="text-slate-500 text-sm">Analysis timing & bottlenecks</p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
            </div>
          )}

          {!loading && !stats && (
            <div className="text-center py-8 text-slate-500">
              <p>No timing data available yet.</p>
              <p className="text-sm mt-2">
                Make sure you've deployed the updated <code className="bg-white/10 px-1 rounded">clever-service.ts</code> 
                <br />to Supabase Edge Functions, then record a new session.
              </p>
              <p className="text-xs mt-3 text-slate-600">
                Sessions recorded before the update won't have timing data.
              </p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Avg Total</p>
                  <p className="text-2xl font-semibold text-slate-200 mt-1">{formatMs(stats.averages.totalMs)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Avg AI Time</p>
                  <p className="text-2xl font-semibold text-orange-400 mt-1">{formatMs(stats.averages.aiCallsMs)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">ms/word</p>
                  <p className="text-2xl font-semibold text-slate-200 mt-1">{stats.averages.msPerWord}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Sessions</p>
                  <p className="text-2xl font-semibold text-slate-200 mt-1">{stats.sessions.length}</p>
                </div>
              </div>

              {/* Word Count vs Time Chart (ASCII style) */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-slate-400 text-sm font-medium mb-3">Word Count vs Analysis Time</p>
                <div className="space-y-2">
                  {stats.trends.wordCountVsTime.slice(0, 10).map((point, i) => {
                    const maxMs = Math.max(...stats.trends.wordCountVsTime.map(p => p.ms));
                    const barWidth = (point.ms / maxMs) * 100;
                    const rating = getSpeedRating(point.ms, point.words);
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 w-16 text-right">{point.words}w</span>
                        <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500/50 to-orange-400/30 flex items-center px-2"
                            style={{ width: `${Math.max(barWidth, 10)}%` }}
                          >
                            <span className="text-xs text-slate-300 whitespace-nowrap">{formatMs(point.ms)}</span>
                          </div>
                        </div>
                        <span className={`w-16 text-xs ${rating.color}`}>{rating.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Session List */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-slate-400 text-sm font-medium">Recent Sessions Breakdown</p>
                </div>
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {stats.sessions.slice(0, 15).map((session) => {
                    const rating = getSpeedRating(session.timing.totalMs, session.timing.wordCount);
                    const aiPercent = session.timing.totalMs > 0 
                      ? Math.round((session.timing.aiCallsMs / session.timing.totalMs) * 100) 
                      : 0;
                    
                    return (
                      <div key={session.id} className="px-4 py-3 hover:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-300 text-sm font-medium truncate">{session.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {session.analyzedAt.toLocaleDateString()} {session.analyzedAt.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${rating.color}`}>{formatMs(session.timing.totalMs)}</p>
                            <p className="text-slate-500 text-xs">{session.timing.wordCount} words</p>
                          </div>
                        </div>
                        
                        {/* Timing breakdown bar */}
                        <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-blue-500/60" 
                            style={{ width: `${(session.timing.tokenFetchMs / session.timing.totalMs) * 100}%` }}
                            title={`Token Fetch: ${session.timing.tokenFetchMs}ms`}
                          />
                          <div 
                            className="bg-green-500/60" 
                            style={{ width: `${(session.timing.punctuationMs / session.timing.totalMs) * 100}%` }}
                            title={`Punctuation: ${session.timing.punctuationMs}ms`}
                          />
                          <div 
                            className="bg-purple-500/60" 
                            style={{ width: `${(session.timing.segmentationMs / session.timing.totalMs) * 100}%` }}
                            title={`Segmentation: ${session.timing.segmentationMs}ms`}
                          />
                          <div 
                            className="bg-orange-500/80" 
                            style={{ width: `${aiPercent}%` }}
                            title={`AI Calls: ${session.timing.aiCallsMs}ms (${aiPercent}%)`}
                          />
                          <div 
                            className="bg-cyan-500/60" 
                            style={{ width: `${(session.timing.storageUploadMs / session.timing.totalMs) * 100}%` }}
                            title={`Storage: ${session.timing.storageUploadMs}ms`}
                          />
                        </div>
                        
                        {/* Legend */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500/60"></span>
                            Fetch {session.timing.tokenFetchMs}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500/80"></span>
                            AI {session.timing.aiCallsMs}ms ({aiPercent}%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-cyan-500/60"></span>
                            Upload {session.timing.storageUploadMs}ms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadPerformanceData}
                className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 text-sm transition-colors"
              >
                Refresh Data
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Account, devices, and personalization">
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-slate-200">
          Settings will be wired later.
        </div>
        
        {/* Debug Section - Hidden in prod, visible for dev */}
        <div className="space-y-3">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide px-1">Developer Tools</h3>
          <PerformanceDebugPanel />
        </div>
      </div>
    </AppShell>
  );
}
