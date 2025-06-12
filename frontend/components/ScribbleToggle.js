import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

// This is the drawing logic from the original JS, adapted for React.
// It draws the hand-drawn style borders for the component.
const drawScribbles = (outlineRef, knobRef, isDarkMode) => {
  if (!outlineRef.current || !knobRef.current) return;

  // Clear any previous SVGs to prevent duplicates on re-render
  outlineRef.current.innerHTML = '';
  knobRef.current.innerHTML = '';

  // Get dimensions directly from the CSS variables for consistency
  const styles = getComputedStyle(document.documentElement);
  const w = parseFloat(styles.getPropertyValue('--track-w'));
  const h = parseFloat(styles.getPropertyValue('--track-h'));
  const k = parseFloat(styles.getPropertyValue('--knob'));

  // Configure the "rough" look. Pink in dark mode, black in light mode.
  const rcOuter = { 
    stroke: isDarkMode ? 'var(--accent)' : '#000', 
    strokeWidth: 2.5, 
    roughness: 1.2, 
    bowing: 1.0, 
    fill: 'none' 
  };
  const rcKnob = { 
    stroke: isDarkMode ? 'var(--accent)' : '#000', 
    strokeWidth: 1.8, 
    roughness: 0.8, 
    bowing: 0.8, 
    fill: 'none' 
  };

  // Draw pill-shaped outline
  const pillSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pillSvg.setAttribute('width', w);
  pillSvg.setAttribute('height', h);
  const pillRc = rough.svg(pillSvg);
  const pillPath = `M ${h/2} 2 H ${w - h/2} A ${h/2 - 2} ${h/2 - 2} 0 0 1 ${w - h/2} ${h - 2} H ${h/2} A ${h/2 - 2} ${h/2 - 2} 0 0 1 ${h/2} 2 Z`;
  pillSvg.appendChild(pillRc.path(pillPath, rcOuter));
  outlineRef.current.appendChild(pillSvg);

  // Draw the circular knob outline
  const knobSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  knobSvg.setAttribute('width', k);
  knobSvg.setAttribute('height', k);
  const knobRc = rough.svg(knobSvg);
  knobSvg.appendChild(knobRc.circle(k / 2, k / 2, k - 2, rcKnob));
  knobRef.current.appendChild(knobSvg);
};

// Helper function to create SVG elements
const mkSvg = (parent, width, height) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  parent.appendChild(svg);
  return [svg, rough.svg(svg)];
};

// Original sun drawing function
const drawSun = (parent, size, isDarkMode) => {
  if (!parent) return;
  parent.innerHTML = ''; // Clear previous icon
  
  const rcInner = { 
    stroke: isDarkMode ? 'var(--accent)' : '#000', 
    strokeWidth: 1.8, 
    roughness: 0.8, 
    bowing: 0.8 
  };
  const [cx, cy, r] = [size / 2, size / 2, size * 0.28];
  const [svg, rc] = mkSvg(parent, size, size);

  svg.appendChild(rc.circle(cx, cy, r * 2, rcInner));

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const x1 = cx + Math.cos(a) * r * 1.2;
    const y1 = cy + Math.sin(a) * r * 1.2;
    const x2 = cx + Math.cos(a) * r * 1.7;
    const y2 = cy + Math.sin(a) * r * 1.7;
    svg.appendChild(rc.line(x1, y1, x2, y2, rcInner));
  }
};

// Original moon drawing function - draws a standard left-facing (waning) crescent
const drawMoon = (parent, size, isDarkMode) => {
  if (!parent) return;
  parent.innerHTML = ''; // Clear previous icon
  
  const [svg, rc] = mkSvg(parent, size, size);
  const c = size / 2;    // center
  const r = size * 0.38; // radius

  const pathData = `
    M ${c}, ${c - r}
    A ${r},${r} 0 1 1 ${c},${c + r}
    A ${r * 0.6},${r} 0 1 0 ${c},${c - r}
    Z
  `;

  // Moon uses black in light mode, pink in dark mode
  const rcInner = { 
    stroke: isDarkMode ? 'var(--accent)' : '#000', 
    strokeWidth: 1.8, 
    roughness: 0.8, 
    bowing: 0.8 
  };
  svg.appendChild(rc.path(pathData, {
      ...rcInner,
      strokeWidth: 1.8,
    })
  );
};


// The actual React Component
const ScribbleToggle = ({ isDarkMode, toggleDarkMode }) => {
  const [mounted, setMounted] = useState(false);

  // We use refs to get direct access to the DOM elements for drawing, which is the "React way".
  const outlineRef = useRef(null);
  const knobRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);

  // This `useEffect` runs only once after the component mounts on the client.
  useEffect(() => {
    setMounted(true);
    
    // We draw everything here, once we know the DOM is ready.
    // We also redraw if the theme changes to update the stroke color.
    drawScribbles(outlineRef, knobRef, isDarkMode);
    drawSun(sunRef.current, 32, isDarkMode);
    drawMoon(moonRef.current, 32, isDarkMode);
  }, [isDarkMode]); // Redraw when `isDarkMode` changes.

  // The `mounted` state is crucial. Our FOUC script sets the theme class on the
  // server, but React doesn't know about it during hydration.
  // We set `checked` to its real `isDarkMode` value only after mounting
  // to prevent a "hydration mismatch" error.
  return (
    <div className="switch">
      <input
        type="checkbox"
        id="themeToggle"
        checked={mounted ? isDarkMode : false}
        onChange={toggleDarkMode}
        aria-label="Theme toggle"
      />
      <label htmlFor="themeToggle">
        <div className="track-bg"></div>
        <div className="scribble-outline" ref={outlineRef}></div>

        <span className="word word-dark">dark</span>
        <span className="word word-light">light</span>

        <div className="scribble-knob">
            <div className="knob-icon sun" ref={sunRef}></div>
            <div className="knob-icon moon" ref={moonRef}></div>
            <div className="scribble-knob-outline" ref={knobRef} style={{position: 'absolute', inset: 0}}></div>
        </div>
      </label>
    </div>
  );
};

export default ScribbleToggle;