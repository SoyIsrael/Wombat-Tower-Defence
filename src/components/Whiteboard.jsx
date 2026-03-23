import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';

const Whiteboard = forwardRef(function Whiteboard(_, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const [color, setColor] = useState('#e8d5b7');

  useImperativeHandle(ref, () => ({
    clear() {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }));

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [getPos, color]);

  const stopDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
    canvas.addEventListener('touchcancel', stopDraw);

    return () => {
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
      canvas.removeEventListener('touchcancel', stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  function handleClear() {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  const colors = [
    { value: '#e8d5b7', label: 'White' },
    { value: '#ffd700', label: 'Gold' },
    { value: '#ff6b6b', label: 'Red' },
    { value: '#8ecae6', label: 'Blue' },
    { value: '#4aff4a', label: 'Green' },
  ];

  return (
    <div className="mt-2 flex flex-col items-center gap-1.5">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-[250px] bg-brown-dark border-2 border-brown-border rounded-md cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {colors.map(c => (
            <button
              key={c.value}
              type="button"
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c.value ? 'border-gold scale-125' : 'border-brown-border'
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>
        <button
          type="button"
          className="text-xs text-text-muted hover:text-red transition-colors ml-2"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
});

export default Whiteboard;
