// src/mock/mockSessions.ts

import type { Session, Tag, TranscriptToken } from '@/types/sessions';

type TokenTagMap = Partial<Record<number, Tag[]>>;

function createTimedTokens({
  segmentId,
  text,
  startMs,
  endMs,
  tokenPrefix,
  taggedIndices = {},
}: {
  segmentId: string;
  text: string;
  startMs: number;
  endMs: number;
  tokenPrefix?: string;
  taggedIndices?: TokenTagMap;
}): TranscriptToken[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const duration = endMs - startMs;
  const step = duration / Math.max(words.length, 1);

  return words.map((word, index) => {
    const tokenStart = Math.round(startMs + index * step);
    const tokenEnd =
      index === words.length - 1 ? endMs : Math.round(startMs + (index + 1) * step);

    return {
      id: `${tokenPrefix ?? `${segmentId}-tok-`}${index + 1}`,
      startMs: tokenStart,
      endMs: tokenEnd,
      text: word,
      tags: taggedIndices[index] ?? [],
    };
  });
}

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1-pitch',
    userId: 'user-1',
    title: 'Investor pitch – AI speech coach vision',
    mode: 'practice',
    context: 'pitch',
    createdAt: '2025-01-15T10:30:00.000Z',
    startedAt: '2025-01-15T10:30:00.000Z',
    endedAt: '2025-01-15T10:34:20.000Z',
    durationSec: 260,
    audioUrl: 'https://example.com/audio/session-1-pitch.mp3',
    analysisStatus: 'ready',
    analysis: {
      segments: [
        {
          id: 's1-seg-1',
          startMs: 0,
          endMs: 14000,
          kind: 'speech',
          text:
            'Hi everyone, I am Tobias, co-founder of PulseSpeak. Today I will show you how we blend audio, physiology, and motion to make public speaking coaching feel effortless. You will see where I speed, where I hedge, and where the watch can catch it live.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-1',
            text:
              'Hi everyone, I am Tobias, co-founder of PulseSpeak. Today I will show you how we blend audio, physiology, and motion to make public speaking coaching feel effortless. You will see where I speed, where I hedge, and where the watch can catch it live.',
            startMs: 0,
            endMs: 14000,
            tokenPrefix: 's1-tok-1-',
          }),
          tags: [
            {
              id: 's1-seg-1-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Clear opening with roadmap of what to expect.',
            },
          ],
        },
        {
          id: 's1-seg-2',
          startMs: 14000,
          endMs: 17000,
          kind: 'pause',
          text: '',
          tags: [
            {
              id: 's1-seg-2-long-pause',
              kind: 'long_pause',
              severity: 'low',
              label: 'Pause after intro; slightly long at ~3s.',
              data: { durationMs: 3000 },
            },
          ],
        },
        {
          id: 's1-seg-3',
          startMs: 17000,
          endMs: 42000,
          kind: 'speech',
          text:
            'The problem is simple: speakers rehearse alone, get feedback that is vague, and never connect stress signals to how they sound. We collect the full picture — words, pace, heart rate, and movement — then translate it into one or two concrete focus points per session.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-3',
            text:
              'The problem is simple: speakers rehearse alone, get feedback that is vague, and never connect stress signals to how they sound. We collect the full picture — words, pace, heart rate, and movement — then translate it into one or two concrete focus points per session.',
            startMs: 17000,
            endMs: 42000,
            tokenPrefix: 's1-tok-3-',
          }),
          tags: [
            {
              id: 's1-seg-3-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Problem framing with full-scope signals.',
            },
          ],
        },
        {
          id: 's1-seg-4',
          startMs: 42000,
          endMs: 66000,
          kind: 'speech',
          text:
            'In early pilots, people rush the explanation. I catch myself going, um, we capture everything, like, really everything, which makes it hard to digest. This is exactly where the watch nudges me. I need to slow the middle third.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-4',
            text:
              'In early pilots, people rush the explanation. I catch myself going, um, we capture everything, like, really everything, which makes it hard to digest. This is exactly where the watch nudges me. I need to slow the middle third.',
            startMs: 42000,
            endMs: 66000,
            tokenPrefix: 's1-tok-4-',
            taggedIndices: {
              11: [
                {
                  id: 's1-tag-4-filler-um',
                  kind: 'filler',
                  severity: 'medium',
                  label: "Filler word: 'um'",
                  data: { normalized: 'um' },
                },
              ],
              15: [
                {
                  id: 's1-tag-4-filler-like',
                  kind: 'filler',
                  severity: 'medium',
                  label: "Filler word: 'like'",
                  data: { normalized: 'like' },
                },
              ],
            },
          }),
          tags: [
            {
              id: 's1-seg-4-fast',
              kind: 'fast',
              severity: 'high',
              label: 'Segment spoken ~190 WPM vs target 150.',
            },
            {
              id: 's1-seg-4-filler',
              kind: 'filler',
              severity: 'medium',
              label: 'Cluster of fillers while describing data capture.',
            },
          ],
        },
        {
          id: 's1-seg-5',
          startMs: 66000,
          endMs: 71000,
          kind: 'pause',
          text: '',
          tags: [
            {
              id: 's1-seg-5-long-pause',
              kind: 'long_pause',
              severity: 'low',
              label: 'Short reset before demo section.',
              data: { durationMs: 5000 },
            },
          ],
        },
        {
          id: 's1-seg-6',
          startMs: 71000,
          endMs: 105000,
          kind: 'speech',
          text:
            'Our iPhone app records studio-grade audio, while the Apple Watch streams heart rate, HRV, and micro-movement. The dashboard lines these up on a timeline, so you can see that the spike at minute two matched the moment you sped through your value prop.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-6',
            text:
              'Our iPhone app records studio-grade audio, while the Apple Watch streams heart rate, HRV, and micro-movement. The dashboard lines these up on a timeline, so you can see that the spike at minute two matched the moment you sped through your value prop.',
            startMs: 71000,
            endMs: 105000,
            tokenPrefix: 's1-tok-6-',
          }),
          tags: [
            {
              id: 's1-seg-6-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Good alignment of signals to a single timeline.',
            },
            {
              id: 's1-seg-6-hedging',
              kind: 'hedging',
              severity: 'low',
              label: 'Light hedge “so you can see” instead of directive.',
            },
          ],
        },
        {
          id: 's1-seg-7',
          startMs: 105000,
          endMs: 136000,
          kind: 'speech',
          text:
            'Early teams use this to rehearse investor pitches, standups, and interviews. One founder cut filler words by thirty percent in a week by catching the exact phrases that triggered them. Another stabilized pace by setting a personalized WPM guardrail and feeling the watch nudge when rushing.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-7',
            text:
              'Early teams use this to rehearse investor pitches, standups, and interviews. One founder cut filler words by thirty percent in a week by catching the exact phrases that triggered them. Another stabilized pace by setting a personalized WPM guardrail and feeling the watch nudge when rushing.',
            startMs: 105000,
            endMs: 136000,
            tokenPrefix: 's1-tok-7-',
          }),
          tags: [
            {
              id: 's1-seg-7-good-emphasis',
              kind: 'good_emphasis',
              severity: 'low',
              label: 'Specific outcomes with percentages and use cases.',
            },
          ],
        },
        {
          id: 's1-seg-8',
          startMs: 136000,
          endMs: 168000,
          kind: 'speech',
          text:
            'We monetize via a team plan, because managers see every presentation and meeting as a chance to coach. The watch brings the same cues into live talks, tapping you when you speed or when your HR jumps.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-8',
            text:
              'We monetize via a team plan, because managers see every presentation and meeting as a chance to coach. The watch brings the same cues into live talks, tapping you when you speed or when your HR jumps.',
            startMs: 136000,
            endMs: 168000,
            tokenPrefix: 's1-tok-8-',
          }),
          tags: [
            {
              id: 's1-seg-8-structure',
              kind: 'structure',
              severity: 'medium',
              label: 'Business model transition is abrupt; could frame value first.',
            },
            {
              id: 's1-seg-8-complex',
              kind: 'complex_sentence',
              severity: 'low',
              label: 'Long sentence; could split for clarity.',
            },
          ],
        },
        {
          id: 's1-seg-9',
          startMs: 168000,
          endMs: 172000,
          kind: 'pause',
          text: '',
          tags: [],
        },
        {
          id: 's1-seg-10',
          startMs: 172000,
          endMs: 204000,
          kind: 'speech',
          text:
            'Let me walk you through an example timeline: at 02:10 you see a long pause, the watch shows a heart-rate spike, and the transcript flags the phrase “sort of maybe”. The system suggests slowing the pace and swapping the hedge for a directive sentence.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-10',
            text:
              'Let me walk you through an example timeline: at 02:10 you see a long pause, the watch shows a heart-rate spike, and the transcript flags the phrase “sort of maybe”. The system suggests slowing the pace and swapping the hedge for a directive sentence.',
            startMs: 172000,
            endMs: 204000,
            tokenPrefix: 's1-tok-10-',
          }),
          tags: [
            {
              id: 's1-seg-10-hedging',
              kind: 'hedging',
              severity: 'medium',
              label: 'Hedging phrase “sort of maybe”.',
            },
          ],
        },
        {
          id: 's1-seg-11',
          startMs: 204000,
          endMs: 226000,
          kind: 'speech',
          text:
            'Our analysis pipeline is modular — we can plug in new ASR models, emotion classifiers, or motion features. What matters for the user is the coaching output stays simple: one to three cues, clear targets, and a way to practice them live.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-11',
            text:
              'Our analysis pipeline is modular — we can plug in new ASR models, emotion classifiers, or motion features. What matters for the user is the coaching output stays simple: one to three cues, clear targets, and a way to practice them live.',
            startMs: 204000,
            endMs: 226000,
            tokenPrefix: 's1-tok-11-',
          }),
          tags: [
            {
              id: 's1-seg-11-complex',
              kind: 'complex_sentence',
              severity: 'medium',
              label: 'Long sentence; could be split for clarity.',
            },
          ],
        },
        {
          id: 's1-seg-12',
          startMs: 226000,
          endMs: 258000,
          kind: 'speech',
          text:
            'By the end of each week, speakers see filler trends, pace stability, and a calmness score. The goal is confident delivery, not perfection. Today, we are asking for early design partners to shape the next phase.',
          tokens: createTimedTokens({
            segmentId: 's1-seg-12',
            text:
              'By the end of each week, speakers see filler trends, pace stability, and a calmness score. The goal is confident delivery, not perfection. Today, we are asking for early design partners to shape the next phase.',
            startMs: 226000,
            endMs: 258000,
            tokenPrefix: 's1-tok-12-',
          }),
          tags: [
            {
              id: 's1-seg-12-structure',
              kind: 'structure',
              severity: 'medium',
              label: 'Closing call-to-action could be more explicit.',
            },
          ],
        },
      ],
      metrics: {
        durationSec: 260,
        totalWords: 680,
        avgWpm: 157,
        fillerCount: 22,
        fillerPerMinute: 5.1,
        avgHeartRate: 108,
        peakHeartRate: 128,
        movementScore: 0.68,
        stressSpeedIndex: 0.66,
      },
      issues: [
        {
          id: 's1-issue-1-filler-cluster',
          kind: 'filler_cluster',
          severity: 'medium',
          message:
            'Fillers “um” and “like” stack during the data-capture explanation. Insert a two-beat pause before listing signals.',
          segmentIds: ['s1-seg-4'],
          tokenIds: ['s1-tok-4-12', 's1-tok-4-16'],
        },
        {
          id: 's1-issue-2-fast-segment',
          kind: 'fast_segment',
          severity: 'high',
          message:
            'Middle-third averages ~190 WPM. Aim for 150–165 by breathing before the benefits example.',
          segmentIds: ['s1-seg-4'],
        },
        {
          id: 's1-issue-3-long-pause',
          kind: 'long_pause',
          severity: 'low',
          message: 'Opening pause runs ~3s; either shorten or signal you are letting the audience settle.',
          segmentIds: ['s1-seg-2'],
        },
        {
          id: 's1-issue-4-structure-ending',
          kind: 'structure',
          severity: 'medium',
          message: 'Closing ask is vague. Add a crisp CTA for design partners and timeline.',
          segmentIds: ['s1-seg-12'],
        },
        {
          id: 's1-issue-5-hedging',
          kind: 'hedging',
          severity: 'medium',
          message: 'Remove “sort of maybe” in the demo story; replace with a firm recommendation.',
          segmentIds: ['s1-seg-10'],
        },
      ],
    },
  },

  {
    id: 'session-2-interview',
    userId: 'user-1',
    title: 'Interview drill – leadership and conflict',
    mode: 'practice',
    context: 'interview',
    createdAt: '2025-01-16T16:45:00.000Z',
    startedAt: '2025-01-16T16:45:10.000Z',
    endedAt: '2025-01-16T16:48:40.000Z',
    durationSec: 210,
    audioUrl: 'https://example.com/audio/session-2-interview.mp3',
    analysisStatus: 'ready',
    analysis: {
      segments: [
        {
          id: 's2-seg-1',
          startMs: 0,
          endMs: 14000,
          kind: 'speech',
          text:
            "When I lead teams, my strength is creating calm structure in fast-changing projects. I make the goal visible, set short checkpoints, and make sure every voice is heard early so we avoid late surprises.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-1',
            text:
              "When I lead teams, my strength is creating calm structure in fast-changing projects. I make the goal visible, set short checkpoints, and make sure every voice is heard early so we avoid late surprises.",
            startMs: 0,
            endMs: 14000,
            tokenPrefix: 's2-tok-1-',
          }),
          tags: [
            {
              id: 's2-seg-1-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Strong opening with strength and tactic.',
            },
          ],
        },
        {
          id: 's2-seg-2',
          startMs: 14000,
          endMs: 17000,
          kind: 'pause',
          text: '',
          tags: [],
        },
        {
          id: 's2-seg-3',
          startMs: 17000,
          endMs: 52000,
          kind: 'speech',
          text:
            "A recent example: we rebuilt our onboarding in six weeks. Each week I ran a retro, looked at heart-rate spikes in my own updates, and noticed I sped up when explaining trade-offs. That told me to pause and let the team push back before I moved on.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-3',
            text:
              "A recent example: we rebuilt our onboarding in six weeks. Each week I ran a retro, looked at heart-rate spikes in my own updates, and noticed I sped up when explaining trade-offs. That told me to pause and let the team push back before I moved on.",
            startMs: 17000,
            endMs: 52000,
            tokenPrefix: 's2-tok-3-',
          }),
          tags: [
            {
              id: 's2-seg-3-fast',
              kind: 'fast',
              severity: 'medium',
              label: 'Pace jumps during trade-off explanation.',
            },
          ],
        },
        {
          id: 's2-seg-4',
          startMs: 52000,
          endMs: 84000,
          kind: 'speech',
          text:
            "On conflict: when two engineers disagreed about architecture, I invited them to map the constraints, then I mirrored their words back. It slowed me down and cut the fillers, because I had to listen. We shipped a hybrid approach with no resentment.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-4',
            text:
              "On conflict: when two engineers disagreed about architecture, I invited them to map the constraints, then I mirrored their words back. It slowed me down and cut the fillers, because I had to listen. We shipped a hybrid approach with no resentment.",
            startMs: 52000,
            endMs: 84000,
            tokenPrefix: 's2-tok-4-',
            taggedIndices: {
              25: [
                {
                  id: 's2-tag-4-filler-and',
                  kind: 'filler',
                  severity: 'low',
                  label: 'Soft filler linking clause',
                },
              ],
            },
          }),
          tags: [
            {
              id: 's2-seg-4-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Concrete conflict example with resolution.',
            },
          ],
        },
        {
          id: 's2-seg-5',
          startMs: 84000,
          endMs: 116000,
          kind: 'speech',
          text:
            "My weakness: I sometimes over-explain to prove I've thought it through. When I notice that rising pace and the fillers creeping in, I switch to a headline-first answer and pause for a beat.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-5',
            text:
              "My weakness: I sometimes over-explain to prove I've thought it through. When I notice that rising pace and the fillers creeping in, I switch to a headline-first answer and pause for a beat.",
            startMs: 84000,
            endMs: 116000,
            tokenPrefix: 's2-tok-5-',
          }),
          tags: [
            {
              id: 's2-seg-5-hedging',
              kind: 'hedging',
              severity: 'medium',
              label: 'Self-qualification softens the point.',
            },
            {
              id: 's2-seg-5-filler',
              kind: 'filler',
              severity: 'medium',
              label: 'Filler creep when pace rises.',
            },
          ],
        },
        {
          id: 's2-seg-6',
          startMs: 116000,
          endMs: 148000,
          kind: 'speech',
          text:
            "Growth plan: in the next quarter I want to coach two teammates on concise updates, because teaching the skill forces me to model it. I will also keep heart-rate alerts on during live meetings to catch stress before it shows up in my tone.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-6',
            text:
              "Growth plan: in the next quarter I want to coach two teammates on concise updates, because teaching the skill forces me to model it. I will also keep heart-rate alerts on during live meetings to catch stress before it shows up in my tone.",
            startMs: 116000,
            endMs: 148000,
            tokenPrefix: 's2-tok-6-',
          }),
          tags: [
            {
              id: 's2-seg-6-good-emphasis',
              kind: 'good_emphasis',
              severity: 'low',
              label: 'Forward-looking and measurable.',
            },
          ],
        },
        {
          id: 's2-seg-7',
          startMs: 148000,
          endMs: 182000,
          kind: 'speech',
          text:
            "If we worked together, you would see me run tight agendas, ask for dissent early, and give clear summaries. The dashboard shows exactly where my pace drops or fillers spike so I can correct in the next standup.",
          tokens: createTimedTokens({
            segmentId: 's2-seg-7',
            text:
              "If we worked together, you would see me run tight agendas, ask for dissent early, and give clear summaries. The dashboard shows exactly where my pace drops or fillers spike so I can correct in the next standup.",
            startMs: 148000,
            endMs: 182000,
            tokenPrefix: 's2-tok-7-',
          }),
          tags: [
            {
              id: 's2-seg-7-structure',
              kind: 'structure',
              severity: 'low',
              label: 'Closes with how the interviewer would experience you.',
            },
          ],
        },
        {
          id: 's2-seg-8',
          startMs: 182000,
          endMs: 210000,
          kind: 'speech',
          text:
            'Thank you for the questions — happy to dive into how I coach teams through presentations or conflict in more depth.',
          tokens: createTimedTokens({
            segmentId: 's2-seg-8',
            text:
              'Thank you for the questions — happy to dive into how I coach teams through presentations or conflict in more depth.',
            startMs: 182000,
            endMs: 210000,
            tokenPrefix: 's2-tok-8-',
          }),
          tags: [],
        },
      ],
      metrics: {
        durationSec: 210,
        totalWords: 510,
        avgWpm: 145,  
        fillerCount: 9,
        fillerPerMinute: 2.6,
        avgHeartRate: 98,
        peakHeartRate: 116,
        movementScore: 0.28,
        stressSpeedIndex: 0.5,
      },
      issues: [
        {
          id: 's2-issue-1-fast',
          kind: 'fast_segment',
          severity: 'medium',
          message: 'You speed up during the trade-off story. Insert a breath before listing impacts.',
          segmentIds: ['s2-seg-3'],
        },
        {
          id: 's2-issue-2-hedging',
          kind: 'hedging',
          severity: 'medium',
          message: "Weakness answer uses softeners. State it once, then pivot to mitigation steps.",
          segmentIds: ['s2-seg-5'],
        },
        {
          id: 's2-issue-3-fillers',
          kind: 'filler_cluster',
          severity: 'low',
          message: 'Light fillers appear in the conflict story; keep the reflective pause but tighten language.',
          segmentIds: ['s2-seg-4'],
          tokenIds: ['s2-tok-4-26'],
        },
      ],
    },
  },
];

// Helper for detail pages
export function getMockSessionById(id: string): Session | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}
