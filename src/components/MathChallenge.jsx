import { useState, useEffect, useRef, useCallback } from 'react';
import { generateProblem, checkAnswer, getProblemsPerWave, getGoldPerCorrect } from '../game/mathProblems.js';
import './MathChallenge.css';

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
      <div className="math-overlay">
        <div className="math-box">
          <h2>Round Complete!</h2>
          <div className="math-score">
            <span className="math-correct">{correctCount}</span> / {total} correct
          </div>
          <div className="math-earned">+{earned} gold earned</div>
          <div className="math-breakdown">
            {problems.map((p, i) => (
              <div key={i} className={`math-result-row ${results[i] ? 'right' : 'wrong-row'}`}>
                <span className="math-result-icon">{results[i] ? '\u2713' : '\u2717'}</span>
                <span>
                  {renderFrac(p.a)} {p.op} {renderFrac(p.b)} = {renderFrac(p.answer)}
                </span>
              </div>
            ))}
          </div>
          <button className="math-btn" onClick={handleFinish}>Continue</button>
        </div>
      </div>
    );
  }

  const timerUrgent = timerDuration > 0 && timeLeft <= 5;
  const timerWarning = timerDuration > 0 && timeLeft <= 15 && !timerUrgent;

  return (
    <div className="math-overlay">
      <div className="math-box">
        <div className="math-header">
          <h2>Math Challenge</h2>
          <div className="math-header-row">
            <span className="math-progress">Problem {current + 1} / {total}</span>
            {timerDuration > 0 && (
              <span className={`math-timer ${timerUrgent ? 'urgent' : ''} ${timerWarning ? 'warning' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <span className="math-reward">{goldPerCorrect}g per correct answer</span>
        </div>

        <div className="math-problem">
          <div className="fraction-display">
            <Fraction num={problem.a.num} den={problem.a.den} />
            <span className="math-op">{problem.op}</span>
            <Fraction num={problem.b.num} den={problem.b.den} />
            <span className="math-op">=</span>
            <span className="math-op">?</span>
          </div>
        </div>

        <form className="math-form" onSubmit={handleSubmit}>
          <div className="answer-fraction">
            <input
              ref={numRef}
              type="number"
              className="frac-input"
              placeholder="num"
              value={numInput}
              onChange={e => setNumInput(e.target.value)}
              disabled={feedback !== null}
            />
            <div className="frac-bar" />
            <input
              type="number"
              className="frac-input"
              placeholder="den"
              value={denInput}
              onChange={e => setDenInput(e.target.value)}
              disabled={feedback !== null}
            />
          </div>
          <button
            type="submit"
            className="math-btn"
            disabled={feedback !== null || numInput === '' || denInput === ''}
          >
            Submit
          </button>
        </form>

        {feedback && (
          <div className={`math-feedback ${feedback}`}>
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
    <div className="fraction">
      <span className="frac-num">{num}</span>
      <span className="frac-line" />
      <span className="frac-den">{den}</span>
    </div>
  );
}

function renderFrac(f) {
  return `${f.num}/${f.den}`;
}
