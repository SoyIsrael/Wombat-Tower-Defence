import { useState, useEffect, useRef, useCallback } from 'react';
import { generateProblem, checkAnswer, getProblemsPerWave, getGoldPerCorrect } from '../game/mathProblems.js';
import Whiteboard from './Whiteboard.jsx';

export default function MathChallenge({ wave, onComplete, settings }) {
  const total = getProblemsPerWave();
  const goldPerCorrect = getGoldPerCorrect(wave);
  const timerDuration = settings.timerDuration; // 0 = no timer

  const [problems] = useState(() =>
    Array.from({ length: total }, () =>
      generateProblem(wave, settings.difficulty, settings.operations)
    )
  );
  const [current, setCurrent] = useState(0);
  const [numInput, setNumInput] = useState('');
  const [denInput, setDenInput] = useState('');
  const [results, setResults] = useState([]); // true/false per problem
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const numRef = useRef(null);
  const pausedRef = useRef(false);
  const resultsRef = useRef([]);

  useEffect(() => {
    if (numRef.current) numRef.current.focus();
  }, [current]);

  // Keep resultsRef in sync
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Countdown timer
  useEffect(() => {
    if (timerDuration === 0 || done) return;

    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerDuration, done]);

  // Handle time running out
  const finishEarly = useCallback(() => {
    // Mark remaining problems as wrong
    const currentResults = resultsRef.current;
    const remaining = total - currentResults.length;
    const finalResults = [...currentResults, ...new Array(remaining).fill(false)];
    setResults(finalResults);
    setDone(true);
  }, [total]);

  useEffect(() => {
    if (timerDuration > 0 && timeLeft === 0 && !done) {
      finishEarly();
    }
  }, [timeLeft, timerDuration, done, finishEarly]);

  const problem = problems[current];

  function handleSubmit(e) {
    e.preventDefault();
    const userNum = parseInt(numInput, 10);
    const userDen = parseInt(denInput, 10);
    if (isNaN(userNum) || isNaN(userDen) || userDen === 0) return;

    const correct = checkAnswer(problem, userNum, userDen);
    const newResults = [...results, correct];
    setResults(newResults);
    setFeedback(correct ? 'correct' : 'wrong');
    pausedRef.current = true;

    setTimeout(() => {
      pausedRef.current = false;
      setFeedback(null);
      setNumInput('');
      setDenInput('');
      if (current + 1 < total) {
        setCurrent(current + 1);
      } else {
        setDone(true);
      }
    }, 1200);
  }

  function handleFinish() {
    const correctCount = results.filter(Boolean).length;
    onComplete(correctCount * goldPerCorrect);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (done) {
    const correctCount = results.filter(Boolean).length;
    const earned = correctCount * goldPerCorrect;
    return (
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[90]">
        <div className="bg-brown-medium border-[3px] border-gold-border rounded-xl py-7 px-9 text-center min-w-[400px] max-w-[500px]">
          <h2 className="text-2xl font-bold text-gold-text mb-1.5">Round Complete!</h2>
          <div className="text-[28px] font-bold text-text my-3">
            <span className="text-green-bright">{correctCount}</span> / {total} correct
          </div>
          <div className="text-[22px] font-bold text-gold mb-4">+{earned} gold earned</div>
          <div className="flex flex-col gap-1.5 mb-5 text-left">
            {problems.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-[15px] text-text py-1 px-2 rounded ${
                  results[i] ? 'bg-[rgba(74,255,74,0.08)]' : 'bg-[rgba(255,107,107,0.08)]'
                }`}
              >
                <span className={`text-lg font-bold ${results[i] ? 'text-green-bright' : 'text-red'}`}>
                  {results[i] ? '\u2713' : '\u2717'}
                </span>
                <span>
                  {renderFrac(p.a)} {p.op} {renderFrac(p.b)} = {renderFrac(p.answer)}
                </span>
              </div>
            ))}
          </div>
          <button
            className="py-2.5 px-8 border-2 border-gold-border rounded-md bg-green-btn text-text text-base font-bold cursor-pointer transition-colors duration-150 hover:bg-green-btn-hover disabled:bg-disabled-bg disabled:text-[#666] disabled:cursor-not-allowed"
            onClick={handleFinish}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const timerUrgent = timerDuration > 0 && timeLeft <= 5;
  const timerWarning = timerDuration > 0 && timeLeft <= 15 && !timerUrgent;

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const whiteboardRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[90]">
      <div className={`bg-brown-medium border-[3px] border-gold-border rounded-xl py-7 px-9 text-center min-w-[400px] max-w-[500px] max-h-[90vh] overflow-y-auto ${showWhiteboard ? 'max-w-[700px]' : ''}`}>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gold-text mb-1.5">Math Challenge</h2>
          <div className="flex items-center justify-center gap-4 mb-0.5">
            <span className="text-sm text-text-muted">Problem {current + 1} / {total}</span>
            {timerDuration > 0 && (
              <span className={`text-lg font-bold tabular-nums py-0.5 px-2.5 rounded ${
                timerUrgent
                  ? 'text-[#ff4444] bg-[rgba(255,68,68,0.15)] animate-timer-pulse'
                  : timerWarning
                    ? 'text-[#ffcc00] bg-[rgba(255,204,0,0.1)]'
                    : 'text-text bg-white/5'
              }`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <span className="block text-[13px] text-gold">{goldPerCorrect}g per correct answer</span>
        </div>

        <div className="my-5">
          <div className="flex items-center justify-center gap-4 text-xl">
            <Fraction num={problem.a.num} den={problem.a.den} />
            <span className="text-[26px] font-bold text-gold-text">{problem.op}</span>
            <Fraction num={problem.b.num} den={problem.b.den} />
            <span className="text-[26px] font-bold text-gold-text">=</span>
            <span className="text-[26px] font-bold text-gold-text">?</span>
          </div>
        </div>

        <div className="mb-3">
          <button
            type="button"
            className="text-xs text-text-muted hover:text-gold-text transition-colors"
            onClick={() => setShowWhiteboard(v => !v)}
          >
            {showWhiteboard ? 'Hide scratchpad' : 'Show scratchpad'}
          </button>
          {showWhiteboard && (
            <Whiteboard ref={whiteboardRef} />
          )}
        </div>

        <form className="flex flex-col items-center gap-3.5 mt-4" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-0.5">
            <input
              ref={numRef}
              type="number"
              className="w-20 text-center text-[22px] font-bold p-1.5 border-2 border-brown-border rounded-md bg-brown-dark text-text outline-none focus:border-gold placeholder:text-text-placeholder placeholder:font-normal placeholder:text-sm"
              placeholder="num"
              value={numInput}
              onChange={e => setNumInput(e.target.value)}
              disabled={feedback !== null}
            />
            <div className="w-20 h-[3px] bg-text" />
            <input
              type="number"
              className="w-20 text-center text-[22px] font-bold p-1.5 border-2 border-brown-border rounded-md bg-brown-dark text-text outline-none focus:border-gold placeholder:text-text-placeholder placeholder:font-normal placeholder:text-sm"
              placeholder="den"
              value={denInput}
              onChange={e => setDenInput(e.target.value)}
              disabled={feedback !== null}
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-8 border-2 border-gold-border rounded-md bg-green-btn text-text text-base font-bold cursor-pointer transition-colors duration-150 hover:bg-green-btn-hover disabled:bg-disabled-bg disabled:text-[#666] disabled:cursor-not-allowed"
            disabled={feedback !== null || numInput === '' || denInput === ''}
          >
            Submit
          </button>
        </form>

        {feedback && (
          <div className={`mt-3.5 text-xl font-bold py-2 px-4 rounded-md ${
            feedback === 'correct'
              ? 'text-green-bright bg-[rgba(74,255,74,0.1)]'
              : 'text-red bg-[rgba(255,107,107,0.1)]'
          }`}>
            {feedback === 'correct'
              ? 'Correct!'
              : `Incorrect \u2014 answer: ${problem.answer.num}/${problem.answer.den}`}
          </div>
        )}
      </div>
    </div>
  );
}

function Fraction({ num, den }) {
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className="text-2xl font-bold text-text py-0.5 px-1.5">{num}</span>
      <span className="w-full h-0.5 bg-text my-0.5" />
      <span className="text-2xl font-bold text-text py-0.5 px-1.5">{den}</span>
    </div>
  );
}

function renderFrac(f) {
  return `${f.num}/${f.den}`;
}
