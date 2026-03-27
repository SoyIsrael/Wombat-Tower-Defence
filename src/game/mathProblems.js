// Generate fraction arithmetic problems with configurable difficulty and operations

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function simplify(num, den) {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(Math.abs(num), den);
  return { num: num / g, den: den / g };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFraction(maxDen) {
  const den = randInt(2, maxDen);
  const num = randInt(1, den * 2 - 1);
  return { num, den };
}

const OP_MAP = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
};

export function generateProblem(wave, difficulty = 'medium', enabledOps = null) {
  // Determine max denominator from difficulty
  let maxDen;
  switch (difficulty) {
    case 'easy':
      maxDen = Math.min(6, 3 + Math.floor(wave / 3));
      break;
    case 'hard':
      maxDen = Math.min(20, 6 + wave);
      break;
    case 'medium':
    default:
      maxDen = Math.min(12, 4 + Math.floor(wave / 2));
      break;
  }
  maxDen = Math.max(2, maxDen);

  // Determine available operations
  let ops;
  if (enabledOps) {
    ops = Object.entries(enabledOps)
      .filter(([, enabled]) => enabled)
      .map(([key]) => OP_MAP[key]);
    if (ops.length === 0) ops = ['+'];
  } else {
    ops = ['+', '-', '×', '÷'];
  }

  const op = ops[randInt(0, ops.length - 1)];

  let a = randFraction(maxDen);
  let b = randFraction(maxDen);

  if (op === '÷' && b.num === 0) {
    b.num = 1;
  }

  let answer;
  switch (op) {
    case '+': {
      const num = a.num * b.den + b.num * a.den;
      const den = a.den * b.den;
      answer = simplify(num, den);
      break;
    }
    case '-': {
      const num = a.num * b.den - b.num * a.den;
      const den = a.den * b.den;
      answer = simplify(num, den);
      break;
    }
    case '×': {
      const num = a.num * b.num;
      const den = a.den * b.den;
      answer = simplify(num, den);
      break;
    }
    case '÷': {
      const num = a.num * b.den;
      const den = a.den * b.num;
      answer = simplify(num, den);
      break;
    }
  }

  return { a, b, op, answer };
}

export function checkAnswer(problem, userNum, userDen) {
  if (userDen === 0) return false;
  const userSimplified = simplify(userNum, userDen);
  return userSimplified.num === problem.answer.num && userSimplified.den === problem.answer.den;
}

export function getProblemsPerWave() {
  return 3;
}

export function getGoldPerCorrect(wave) {
  return 25 + Math.floor(wave * 7);
}
