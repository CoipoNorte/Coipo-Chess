/**
 * ChessPieces.jsx — Multi-set SVG Chess Pieces v2
 *
 * Built-in sets: cburnett, alpha, kingdoms, pixel
 * Custom sets: loaded from public/piezas/<set-name>/
 */

import { useState, useEffect, useMemo, createContext, useContext } from 'react'

/* ═══════════════════════════════════════════
   CBURNETT SET (Lichess classic)
   ═══════════════════════════════════════════ */

const CburnettKing = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter"/>
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill={color === 'w' ? '#fff' : '#000'} strokeLinecap="butt" strokeLinejoin="miter"/>
      <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill={color === 'w' ? '#fff' : '#000'}/>
      {color === 'b' && <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" stroke="#fff"/>}
    </g>
  </svg>
)

const CburnettQueen = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    {color === 'w' ? (
      <g fill="#fff" fillRule="evenodd" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0"/>
        <path strokeLinecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14z"/>
        <path strokeLinecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
        <path fill="none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/>
      </g>
    ) : (
      <g fillRule="evenodd" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <g stroke="none">
          <circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/>
        </g>
        <path strokeLinecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5z"/>
        <path strokeLinecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
        <path fill="none" strokeLinecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/>
        <path fill="none" stroke="#ececec" d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"/>
      </g>
    )}
  </svg>
)

const CburnettRook = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#000'} fillRule="evenodd" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path strokeLinecap="butt" d="M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5"/>
      <path d="m34 14-3 3H14l-3-3"/>
      <path strokeLinecap="butt" strokeLinejoin="miter" d="M31 17v12.5H14V17"/>
      <path d="m31 29.5 1.5 2.5h-20l1.5-2.5"/>
      <path fill="none" strokeLinejoin="miter" d="M11 14h23"/>
    </g>
    {color === 'b' && <path fill="none" stroke="#ececec" strokeLinejoin="miter" strokeWidth="1" d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23"/>}
  </svg>
)

const CburnettBishop = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g fill={color === 'w' ? '#fff' : '#000'} strokeLinecap="butt">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
        <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
      </g>
      <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter"/>
    </g>
    {color === 'b' && <circle cx="22.5" cy="8" r="2.5" fill="#fff" stroke="none"/>}
  </svg>
)

const CburnettKnight = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill={color === 'w' ? '#fff' : '#000'}/>
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill={color === 'w' ? '#fff' : '#000'}/>
      <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill={color === 'w' ? '#000' : '#fff'}/>
      <path d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill={color === 'w' ? '#000' : '#fff'}/>
    </g>
  </svg>
)

const CburnettPawn = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

/* ═══════════════════════════════════════════
   ALPHA SET (typographic style)
   ═══════════════════════════════════════════ */

const AlphaKing = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♚</text>
  </svg>
)

const AlphaQueen = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♛</text>
  </svg>
)

const AlphaRook = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♜</text>
  </svg>
)

const AlphaBishop = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♝</text>
  </svg>
)

const AlphaKnight = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♞</text>
  </svg>
)

const AlphaPawn = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <text x="22.5" y="35" textAnchor="middle" fontSize="30" fontFamily="serif" fill={color === 'w' ? '#fff' : '#000'} stroke="#000" strokeWidth="1">♟</text>
  </svg>
)

/* ═══════════════════════════════════════════
   KINGDOMS SET (medieval detailed)
   ═══════════════════════════════════════════ */

const KingdomsKing = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 6l-3 5h6l-3-5z" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
      <path d="M18 11h9v2h-9z"/>
      <path d="M15 13h15v3c0 0 2 0 2 2v4H13v-4c0-2 2-2 2-2z"/>
      <path d="M13 22h19v4l-2 14H15l-2-14z"/>
      <path d="M18 26h9v2h-9z" fill="none" stroke={color === 'w' ? '#000' : '#fff'}/>
      <path d="M20 30h5v3h-5z" fill="none" stroke={color === 'w' ? '#000' : '#fff'}/>
    </g>
  </svg>
)

const KingdomsQueen = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="2" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
      <circle cx="22.5" cy="6" r="2" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
      <circle cx="33" cy="8" r="2" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
      <path d="M12 8l10.5 10L33 8" fill="none"/>
      <path d="M14 18h17v3l-2 16H16l-2-16z"/>
      <path d="M19 24h7v2h-7z" fill="none" stroke={color === 'w' ? '#000' : '#fff'}/>
    </g>
  </svg>
)

const KingdomsRook = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8h3v4h-3zm9 0h3v4h-3zm9 0h3v4h-3z"/>
      <path d="M12 12h21v3H12z"/>
      <path d="M14 15h17v18H14z"/>
      <path d="M12 33h21v4H12z"/>
      <path d="M10 37h25v3H10z" fill={color === 'w' ? '#ddd' : '#333'}/>
    </g>
  </svg>
)

const KingdomsBishop = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22.5" cy="7" r="2.5" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
      <path d="M17 14c0-4 5.5-8 5.5-8s5.5 4 5.5 8c0 2-2 3-2.5 3h-1c-.5 0-2.5-1-2.5-3z"/>
      <path d="M15 17h15l-3 18H18z"/>
      <path d="M13 35h19v3H13z"/>
      <path d="M20 22h5" fill="none" stroke={color === 'w' ? '#000' : '#fff'}/>
    </g>
  </svg>
)

const KingdomsKnight = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 35h15v3H15z"/>
      <path d="M14 20l5-10 8 2-3 8h6l2 15H14z"/>
      <circle cx="19" cy="13" r="1" fill={color === 'w' ? '#000' : '#fff'}/>
      <path d="M22 15l3-3" fill="none"/>
      <path d="M18 24h7" fill="none" stroke={color === 'w' ? '#000' : '#fff'}/>
    </g>
  </svg>
)

const KingdomsPawn = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <g fill={color === 'w' ? '#fff' : '#1a1a1a'} stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22.5" cy="12" r="3.5"/>
      <path d="M17 20c0-3 5.5-6 5.5-6s5.5 3 5.5 6"/>
      <path d="M15 22h15l-2 13H17z"/>
      <path d="M13 35h19v3H13z"/>
    </g>
  </svg>
)

/* ═══════════════════════════════════════════
   PIXEL SET (retro 8-bit style)
   ═══════════════════════════════════════════ */

const PixelKing = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="7" y="1" width="2" height="1"/><rect x="6" y="2" width="4" height="1"/>
      <rect x="5" y="3" width="6" height="1"/><rect x="5" y="4" width="6" height="1"/>
      <rect x="4" y="5" width="8" height="1"/><rect x="4" y="6" width="8" height="1"/>
      <rect x="3" y="7" width="10" height="1"/><rect x="3" y="8" width="10" height="1"/>
      <rect x="3" y="9" width="10" height="1"/><rect x="2" y="10" width="12" height="1"/>
      <rect x="2" y="11" width="12" height="1"/><rect x="1" y="12" width="14" height="1"/>
      <rect x="1" y="13" width="14" height="1"/><rect x="0" y="14" width="16" height="1"/>
    </g>
    <rect x="7" y="6" width="2" height="1" fill={color === 'w' ? '#000' : '#fff'}/>
  </svg>
)

const PixelQueen = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="3" y="1" width="1" height="1"/><rect x="7" y="1" width="2" height="1"/><rect x="12" y="1" width="1" height="1"/>
      <rect x="4" y="2" width="1" height="1"/><rect x="7" y="2" width="2" height="1"/><rect x="11" y="2" width="1" height="1"/>
      <rect x="3" y="3" width="10" height="1"/><rect x="4" y="4" width="8" height="1"/>
      <rect x="4" y="5" width="8" height="1"/><rect x="3" y="6" width="10" height="1"/>
      <rect x="3" y="7" width="10" height="1"/><rect x="3" y="8" width="10" height="1"/>
      <rect x="2" y="9" width="12" height="1"/><rect x="2" y="10" width="12" height="1"/>
      <rect x="1" y="11" width="14" height="1"/><rect x="1" y="12" width="14" height="1"/>
      <rect x="1" y="13" width="14" height="1"/><rect x="0" y="14" width="16" height="1"/>
    </g>
  </svg>
)

const PixelRook = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="2" y="1" width="2" height="2"/><rect x="7" y="1" width="2" height="2"/><rect x="12" y="1" width="2" height="2"/>
      <rect x="2" y="3" width="12" height="1"/><rect x="3" y="4" width="10" height="1"/>
      <rect x="3" y="5" width="10" height="1"/><rect x="3" y="6" width="10" height="1"/>
      <rect x="3" y="7" width="10" height="1"/><rect x="3" y="8" width="10" height="1"/>
      <rect x="2" y="9" width="12" height="1"/><rect x="2" y="10" width="12" height="1"/>
      <rect x="1" y="11" width="14" height="1"/><rect x="1" y="12" width="14" height="1"/>
      <rect x="1" y="13" width="14" height="1"/><rect x="0" y="14" width="16" height="1"/>
    </g>
  </svg>
)

const PixelBishop = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="7" y="1" width="2" height="1"/><rect x="6" y="2" width="4" height="1"/>
      <rect x="5" y="3" width="6" height="1"/><rect x="4" y="4" width="8" height="1"/>
      <rect x="5" y="5" width="6" height="1"/><rect x="5" y="6" width="6" height="1"/>
      <rect x="4" y="7" width="8" height="1"/><rect x="4" y="8" width="8" height="1"/>
      <rect x="3" y="9" width="10" height="1"/><rect x="3" y="10" width="10" height="1"/>
      <rect x="2" y="11" width="12" height="1"/><rect x="1" y="12" width="14" height="1"/>
      <rect x="1" y="13" width="14" height="1"/><rect x="0" y="14" width="16" height="1"/>
    </g>
    <rect x="7" y="4" width="2" height="1" fill={color === 'w' ? '#ffd700' : '#8b6914'}/>
  </svg>
)

const PixelKnight = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="5" y="1" width="3" height="1"/><rect x="4" y="2" width="4" height="1"/>
      <rect x="3" y="3" width="5" height="1"/><rect x="3" y="4" width="6" height="1"/>
      <rect x="3" y="5" width="7" height="1"/><rect x="3" y="6" width="8" height="1"/>
      <rect x="3" y="7" width="8" height="1"/><rect x="3" y="8" width="9" height="1"/>
      <rect x="2" y="9" width="10" height="1"/><rect x="2" y="10" width="11" height="1"/>
      <rect x="1" y="11" width="12" height="1"/><rect x="1" y="12" width="13" height="1"/>
      <rect x="1" y="13" width="14" height="1"/><rect x="0" y="14" width="16" height="1"/>
    </g>
    <rect x="5" y="4" width="1" height="1" fill={color === 'w' ? '#000' : '#fff'}/>
  </svg>
)

const PixelPawn = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shapeRendering="crispEdges">
    <g fill={color === 'w' ? '#fff' : '#333'} stroke={color === 'w' ? '#000' : '#000'} strokeWidth="0.3">
      <rect x="6" y="2" width="4" height="1"/><rect x="5" y="3" width="6" height="1"/>
      <rect x="5" y="4" width="6" height="1"/><rect x="4" y="5" width="8" height="1"/>
      <rect x="4" y="6" width="8" height="1"/><rect x="4" y="7" width="8" height="1"/>
      <rect x="3" y="8" width="10" height="1"/><rect x="3" y="9" width="10" height="1"/>
      <rect x="3" y="10" width="10" height="1"/><rect x="2" y="11" width="12" height="1"/>
      <rect x="1" y="12" width="14" height="1"/><rect x="1" y="13" width="14" height="1"/>
      <rect x="0" y="14" width="16" height="1"/>
    </g>
  </svg>
)

/* ═══════════════════════════════════════════
   PIECE SET REGISTRY
   ═══════════════════════════════════════════ */

const BUILTIN_SETS = {
  cburnett: { k: CburnettKing, q: CburnettQueen, r: CburnettRook, b: CburnettBishop, n: CburnettKnight, p: CburnettPawn },
  alpha:    { k: AlphaKing, q: AlphaQueen, r: AlphaRook, b: AlphaBishop, n: AlphaKnight, p: AlphaPawn },
  kingdoms: { k: KingdomsKing, q: KingdomsQueen, r: KingdomsRook, b: KingdomsBishop, n: KingdomsKnight, p: KingdomsPawn },
  pixel:    { k: PixelKing, q: PixelQueen, r: PixelRook, b: PixelBishop, n: PixelKnight, p: PixelPawn },
}

/* ═══════════════════════════════════════════
   CUSTOM PIECE SET CONTEXT (lifted hook)
   ═══════════════════════════════════════════ */

const CustomPieceContext = createContext(null)

/**
 * CustomPieceProvider — wraps the app and fetches custom pieces ONCE
 * based on the current pieceSet and customPath.
 */
export function CustomPieceProvider({ pieceSet, customPath, children }) {
  const [pieces, setPieces] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pieceSet !== 'custom' || !customPath) {
      setPieces(null)
      return
    }

    let cancelled = false
    setLoading(true)

    const loadPieces = async () => {
      try {
        const types = ['k', 'q', 'r', 'b', 'n', 'p']
        const colors = ['w', 'b']
        const loaded = {}

        for (const color of colors) {
          for (const type of types) {
            // Try SVG first, then PNG
            for (const ext of ['svg', 'png']) {
              const url = `${customPath}/${color}${type}.${ext}`
              try {
                const res = await fetch(url)
                if (res.ok) {
                  loaded[`${color}${type}`] = url
                  break
                }
              } catch {}
            }
          }
        }

        if (!cancelled && Object.keys(loaded).length >= 12) {
          setPieces(loaded)
        } else if (!cancelled) {
          setPieces(null)
        }
      } catch {
        if (!cancelled) setPieces(null)
      }
      if (!cancelled) setLoading(false)
    }

    loadPieces()
    return () => { cancelled = true }
  }, [pieceSet, customPath])

  const value = useMemo(() => ({ pieces, loading }), [pieces, loading])

  return (
    <CustomPieceContext.Provider value={value}>
      {children}
    </CustomPieceContext.Provider>
  )
}

function useCustomPieces() {
  return useContext(CustomPieceContext)
}

/* ═══════════════════════════════════════════
   MAIN ChessPiece COMPONENT
   ═══════════════════════════════════════════ */

/**
 * ChessPiece — renders a chess piece from the active set.
 * @param {string} color - 'w' or 'b'
 * @param {string} type  - 'k','q','r','b','n','p'
 * @param {string} pieceSet - 'cburnett' | 'alpha' | 'kingdoms' | 'pixel' | 'custom'
 * @param {string} className - extra CSS class
 */
export function ChessPiece({ color, type, pieceSet = 'cburnett', className = '' }) {
  const customCtx = useCustomPieces()

  // Custom file-based pieces (from context, fetched once)
  if (pieceSet === 'custom' && customCtx?.pieces) {
    const key = `${color}${type}`
    const url = customCtx.pieces[key]
    if (url) {
      return (
        <span className={`chess-piece-svg ${className}`}>
          <img
            src={url}
            alt={`${color} ${type}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        </span>
      )
    }
  }

  // Built-in sets
  const set = BUILTIN_SETS[pieceSet] || BUILTIN_SETS.cburnett
  const Component = set[type]
  if (!Component) return null

  return (
    <span className={`chess-piece-svg ${className}`}>
      <Component color={color} />
    </span>
  )
}

export default ChessPiece
