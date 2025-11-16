# Chess Game - Complete Documentation

## Overview

This is a fully functional chess game built with ReactJS, featuring all standard chess rules including special moves (castling, en passant, pawn promotion), check/checkmate detection, and a modern, mobile-responsive UI. The game runs entirely on the client side with no backend required.

## Tech Stack

- **ReactJS** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Project Structure

```
chess-game/
├── src/
│   ├── App.tsx          # Main chess game component (all game logic)
│   ├── App.css          # Custom styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles with Tailwind
├── public/              # Static assets
├── dist/                # Production build output
└── package.json         # Dependencies and scripts
```

## Installation & Running

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173`

## Code Architecture

### Main Components

The entire chess game is implemented in a single `App.tsx` file for simplicity and ease of understanding. Here's how it's organized:

#### 1. Type Definitions (Lines 6-28)

```typescript
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;  // Tracks if piece moved (for castling/pawn rules)
}

interface Position {
  row: number;  // 0-7 (top to bottom)
  col: number;  // 0-7 (left to right)
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  notation: string;  // Simple move notation like "e2-e4"
}

type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';
```

#### 2. Board Representation

The chess board is represented as an 8x8 2D array:
- `board[row][col]` contains either a `Piece` object or `null` (empty square)
- Row 0 = top of board (black's back rank)
- Row 7 = bottom of board (white's back rank)
- Columns 0-7 = files a-h

#### 3. Game State Management

The game uses React hooks to manage state:

```typescript
const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard());
const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
const [validMoves, setValidMoves] = useState<Position[]>([]);
const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
const [moveHistory, setMoveHistory] = useState<Move[]>([]);
const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
const [promotionSquare, setPromotionSquare] = useState<Position | null>(null);
```

## Chess Rules Implementation

### 1. Piece Movement Functions

Each piece type has its own movement function:

- **`getPawnMoves()`**: Forward movement (1 or 2 squares on first move), diagonal captures, en passant
- **`getRookMoves()`**: Horizontal and vertical lines until blocked
- **`getBishopMoves()`**: Diagonal lines until blocked
- **`getKnightMoves()`**: L-shaped moves (2+1 squares)
- **`getQueenMoves()`**: Combination of rook and bishop moves
- **`getKingMoves()`**: One square in any direction, plus castling logic

### 2. Move Validation

The move validation system has multiple layers:

1. **`getValidMoves()`**: Gets all theoretically possible moves for a piece
2. **`getLegalMoves()`**: Filters valid moves to exclude those that would leave the king in check
3. **`wouldMoveLeaveKingInCheck()`**: Simulates a move to check if it's legal

### 3. Special Moves

#### Castling
- Implemented in `getKingMoves()` and `makeMove()`
- Checks: King and rook haven't moved, squares between are empty
- Kingside: King moves to column 6, rook moves from column 7 to 5
- Queenside: King moves to column 2, rook moves from column 0 to 3

#### En Passant
- Implemented in `getPawnMoves()` and `makeMove()`
- Checks if opponent's pawn just moved two squares and is adjacent
- Captures the pawn by moving diagonally behind it

#### Pawn Promotion
- Detected in `makeMove()` when pawn reaches opposite end
- Shows modal dialog to choose promotion piece (queen, rook, bishop, knight)
- Handled by `handlePromotion()`

### 4. Check, Checkmate, and Stalemate Detection

#### Check Detection
```typescript
function isKingInCheck(board, color): boolean
```
- Finds the king's position
- Checks if any opponent piece can attack that square

#### Checkmate Detection
```typescript
function getGameStatus(board, currentPlayer, lastMove): GameStatus
```
- King is in check AND player has no legal moves = Checkmate
- King not in check AND player has no legal moves = Stalemate
- King is in check = Check
- Otherwise = Playing

#### Legal Move Validation
```typescript
function hasLegalMoves(board, color, lastMove): boolean
```
- Iterates through all pieces of the given color
- Checks if any piece has at least one legal move
- Used to detect checkmate/stalemate

## User Interface

### Board Display

The board is rendered using nested divs:
- Each square is a clickable div with appropriate background color
- Pieces are displayed using Unicode chess symbols (♔♕♖♗♘♙)
- Visual feedback:
  - **Blue highlight**: Selected piece
  - **Yellow highlight**: Last move (from and to squares)
  - **Dots/red overlay**: Valid move destinations
  - **Hover effect**: Opacity change on hover

### Game Controls

1. **Turn Indicator**: Shows whose turn it is and game status
2. **New Game Button**: Resets the board to initial position
3. **Move History Panel**: Lists all moves in notation format

### Mobile Responsiveness

The UI is fully responsive using Tailwind CSS:
- Board squares scale: `w-10 h-10` (mobile) → `w-16 h-16` (desktop)
- Layout changes: Vertical stack (mobile) → Horizontal (desktop)
- Text sizes adjust for different screen sizes

## Game Flow

### 1. Starting a Game
- Board initializes with standard chess starting position
- White always moves first

### 2. Making a Move
1. Click/tap a piece (must be current player's piece)
2. Valid moves are highlighted
3. Click/tap a highlighted square to move
4. Turn switches to other player

### 3. Special Move Handling
- **Pawn Promotion**: Modal appears automatically when pawn reaches end
- **Castling**: Click king, then click two squares left/right
- **En Passant**: Appears as a valid move when conditions are met

### 4. Game End
- **Checkmate**: Winner announced, no more moves allowed
- **Stalemate**: Draw announced, no more moves allowed
- Click "New Game" to start over

## Key Functions Reference

### Board Setup
- `createInitialBoard()`: Creates 8x8 board with pieces in starting positions

### Move Validation
- `isValidPosition(row, col)`: Checks if position is within board bounds
- `getValidMoves(board, pos, lastMove)`: Gets all possible moves for a piece
- `getLegalMoves(board, pos, lastMove)`: Gets legal moves (excluding those leaving king in check)

### Game State
- `isKingInCheck(board, color)`: Checks if king is under attack
- `getGameStatus(board, currentPlayer, lastMove)`: Determines current game status
- `hasLegalMoves(board, color, lastMove)`: Checks if player has any legal moves

### User Interaction
- `handleSquareClick(row, col)`: Handles clicking a square (select piece or move)
- `makeMove(from, to)`: Executes a move on the board
- `handlePromotion(pieceType)`: Handles pawn promotion choice
- `resetGame()`: Resets game to initial state

## Packaging for Mobile

This chess game is ready to be packaged as a mobile app using:

### Option 1: Progressive Web App (PWA)
1. Add a manifest.json file
2. Add service worker for offline support
3. Users can "Add to Home Screen"

### Option 2: WebView Wrapper
Use tools like:
- **Capacitor** (recommended)
- **Cordova**
- **React Native WebView**

Steps:
```bash
# Example with Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npm run build
npx cap copy
npx cap open android  # or ios
```

### Option 3: Expo (React Native)
Convert to React Native using Expo for native performance

## Customization Guide

### Changing Colors
Edit the Tailwind classes in `App.tsx`:
- Board squares: `bg-amber-100` and `bg-amber-700`
- Selected square: `bg-blue-400`
- Last move: `bg-yellow-200` and `bg-yellow-600`
- Background: `from-slate-900 via-slate-800 to-slate-900`

### Adding Features
Some ideas for extensions:
- **Move Timer**: Add countdown timer for each player
- **Undo Move**: Store board history and allow taking back moves
- **AI Opponent**: Implement minimax algorithm for computer player
- **Online Multiplayer**: Add WebSocket connection for remote play
- **Save/Load Games**: Store game state in localStorage
- **PGN Export**: Export games in standard chess notation

### Modifying Rules
All chess rules are in the move validation functions:
- Modify `getPawnMoves()` for different pawn rules
- Modify `getKingMoves()` for different castling rules
- Add new piece types by creating new move functions

## Performance Notes

- The game is optimized for smooth performance on mobile devices
- Move validation is efficient (O(n) where n = number of squares)
- Check detection is optimized to only scan when necessary
- React's virtual DOM ensures minimal re-renders

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari (iOS and macOS)
- Opera

Requires JavaScript enabled and supports ES6+ features.

## Troubleshooting

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors
All TypeScript types are properly defined. If you see errors:
1. Check that all dependencies are installed
2. Ensure TypeScript version is compatible (v5.0+)

### Styling Issues
If Tailwind classes don't work:
1. Check that `tailwind.config.js` is properly configured
2. Ensure `index.css` imports Tailwind directives
3. Rebuild the project

## Credits

Built with:
- React 18
- TypeScript 5
- Vite 6
- Tailwind CSS 3
- Lucide React (icons)

## License

This is a demonstration project. Feel free to use and modify as needed.
