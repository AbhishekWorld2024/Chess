import { useState, useEffect } from 'react';
import './App.css';
import { RotateCcw, Crown } from 'lucide-react';


type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean; // Track if piece has moved (for castling and pawn double-move)
}

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  notation: string;
}

type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';


const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};


/**
 * Creates the initial chess board with all pieces in starting positions
 * Board is represented as an 8x8 array where:
 * - null represents an empty square
 * - Piece object represents a piece on that square
 */
function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
  }

  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
    board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
  }

  return board;
}


/**
 * Check if a position is within the board boundaries
 */
function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Get all possible moves for a pawn
 * Pawns move forward one square (or two on first move)
 * Pawns capture diagonally
 * Includes en passant logic
 */
function getPawnMoves(
  board: (Piece | null)[][],
  pos: Position,
  piece: Piece,
  lastMove: Move | null
): Position[] {
  const moves: Position[] = [];
  const direction = piece.color === 'white' ? -1 : 1; // White moves up (-1), black moves down (+1)
  const startRow = piece.color === 'white' ? 6 : 1;

  const newRow = pos.row + direction;
  if (isValidPosition(newRow, pos.col) && !board[newRow][pos.col]) {
    moves.push({ row: newRow, col: pos.col });

    if (pos.row === startRow) {
      const doubleRow = pos.row + direction * 2;
      if (!board[doubleRow][pos.col]) {
        moves.push({ row: doubleRow, col: pos.col });
      }
    }
  }

  for (const colOffset of [-1, 1]) {
    const newCol = pos.col + colOffset;
    if (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (target && target.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }

      if (
        lastMove &&
        lastMove.piece.type === 'pawn' &&
        Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
        lastMove.to.row === pos.row &&
        lastMove.to.col === newCol
      ) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return moves;
}

/**
 * Get all possible moves for a rook (horizontal and vertical lines)
 */
function getRookMoves(board: (Piece | null)[][], pos: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const directions = [
    [0, 1],  // Right
    [0, -1], // Left
    [1, 0],  // Down
    [-1, 0], // Up
  ];

  for (const [dRow, dCol] of directions) {
    let newRow = pos.row + dRow;
    let newCol = pos.col + dCol;

    while (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
        break; // Stop at first piece encountered
      }
      newRow += dRow;
      newCol += dCol;
    }
  }

  return moves;
}

/**
 * Get all possible moves for a bishop (diagonal lines)
 */
function getBishopMoves(board: (Piece | null)[][], pos: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const directions = [
    [1, 1],   // Down-right
    [1, -1],  // Down-left
    [-1, 1],  // Up-right
    [-1, -1], // Up-left
  ];

  for (const [dRow, dCol] of directions) {
    let newRow = pos.row + dRow;
    let newCol = pos.col + dCol;

    while (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (target.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      newRow += dRow;
      newCol += dCol;
    }
  }

  return moves;
}

/**
 * Get all possible moves for a knight (L-shaped moves)
 */
function getKnightMoves(board: (Piece | null)[][], pos: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const knightMoves = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2],
  ];

  for (const [dRow, dCol] of knightMoves) {
    const newRow = pos.row + dRow;
    const newCol = pos.col + dCol;

    if (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target || target.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return moves;
}

/**
 * Get all possible moves for a queen (combination of rook and bishop)
 */
function getQueenMoves(board: (Piece | null)[][], pos: Position, piece: Piece): Position[] {
  return [...getRookMoves(board, pos, piece), ...getBishopMoves(board, pos, piece)];
}

/**
 * Get all possible moves for a king (one square in any direction)
 * Includes castling logic
 */
function getKingMoves(
  board: (Piece | null)[][],
  pos: Position,
  piece: Piece,
  checkCastling: boolean = true
): Position[] {
  const moves: Position[] = [];
  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  for (const [dRow, dCol] of directions) {
    const newRow = pos.row + dRow;
    const newCol = pos.col + dCol;

    if (isValidPosition(newRow, newCol)) {
      const target = board[newRow][newCol];
      if (!target || target.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  if (checkCastling && !piece.hasMoved) {
    const row = pos.row;

    const kingsideRook = board[row][7];
    if (
      kingsideRook &&
      kingsideRook.type === 'rook' &&
      kingsideRook.color === piece.color &&
      !kingsideRook.hasMoved &&
      !board[row][5] &&
      !board[row][6]
    ) {
      moves.push({ row, col: 6 });
    }

    const queensideRook = board[row][0];
    if (
      queensideRook &&
      queensideRook.type === 'rook' &&
      queensideRook.color === piece.color &&
      !queensideRook.hasMoved &&
      !board[row][1] &&
      !board[row][2] &&
      !board[row][3]
    ) {
      moves.push({ row, col: 2 });
    }
  }

  return moves;
}

/**
 * Get all valid moves for a piece at a given position
 */
function getValidMoves(
  board: (Piece | null)[][],
  pos: Position,
  lastMove: Move | null
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  let moves: Position[] = [];

  switch (piece.type) {
    case 'pawn':
      moves = getPawnMoves(board, pos, piece, lastMove);
      break;
    case 'rook':
      moves = getRookMoves(board, pos, piece);
      break;
    case 'bishop':
      moves = getBishopMoves(board, pos, piece);
      break;
    case 'knight':
      moves = getKnightMoves(board, pos, piece);
      break;
    case 'queen':
      moves = getQueenMoves(board, pos, piece);
      break;
    case 'king':
      moves = getKingMoves(board, pos, piece);
      break;
  }

  return moves;
}


/**
 * Find the position of a king on the board
 */
function findKing(board: (Piece | null)[][], color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Check if a position is under attack by the opponent
 */
function isSquareUnderAttack(
  board: (Piece | null)[][],
  pos: Position,
  attackerColor: PieceColor
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackerColor) {
        const moves = getValidMoves(board, { row, col }, null);
        if (moves.some(move => move.row === pos.row && move.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if a king is in check
 */
function isKingInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos, opponentColor);
}

/**
 * Simulate a move and check if it leaves the king in check
 * This is used to filter out illegal moves
 */
function wouldMoveLeaveKingInCheck(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  color: PieceColor
): boolean {
  const testBoard = board.map(row => [...row]);
  
  testBoard[to.row][to.col] = testBoard[from.row][from.col];
  testBoard[from.row][from.col] = null;

  return isKingInCheck(testBoard, color);
}

/**
 * Get all legal moves (moves that don't leave king in check)
 */
function getLegalMoves(
  board: (Piece | null)[][],
  pos: Position,
  lastMove: Move | null
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const validMoves = getValidMoves(board, pos, lastMove);
  
  return validMoves.filter(
    move => !wouldMoveLeaveKingInCheck(board, pos, move, piece.color)
  );
}

/**
 * Check if a player has any legal moves
 */
function hasLegalMoves(
  board: (Piece | null)[][],
  color: PieceColor,
  lastMove: Move | null
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const legalMoves = getLegalMoves(board, { row, col }, lastMove);
        if (legalMoves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Determine the current game status
 */
function getGameStatus(
  board: (Piece | null)[][],
  currentPlayer: PieceColor,
  lastMove: Move | null
): GameStatus {
  const inCheck = isKingInCheck(board, currentPlayer);
  const hasLegalMovesAvailable = hasLegalMoves(board, currentPlayer, lastMove);

  if (inCheck && !hasLegalMovesAvailable) {
    return 'checkmate';
  } else if (!inCheck && !hasLegalMovesAvailable) {
    return 'stalemate';
  } else if (inCheck) {
    return 'check';
  }
  return 'playing';
}


function App() {
  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [promotionSquare, setPromotionSquare] = useState<Position | null>(null);

  useEffect(() => {
    const lastMove = moveHistory[moveHistory.length - 1] || null;
    const status = getGameStatus(board, currentPlayer, lastMove);
    setGameStatus(status);
  }, [board, currentPlayer, moveHistory]);

  /**
   * Handle square click - either select a piece or move to a square
   */
  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') {
      return;
    }

    const clickedPiece = board[row][col];

    if (selectedSquare) {
      const isValidMove = validMoves.some(
        move => move.row === row && move.col === col
      );

      if (isValidMove) {
        makeMove(selectedSquare, { row, col });
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedSquare({ row, col });
      const lastMove = moveHistory[moveHistory.length - 1] || null;
      const moves = getLegalMoves(board, { row, col }, lastMove);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  /**
   * Make a move on the board
   */
  const makeMove = (from: Position, to: Position) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    const capturedPiece = newBoard[to.row][to.col];

    if (!piece) return;

    const lastMove = moveHistory[moveHistory.length - 1] || null;
    let enPassantCapture: Piece | undefined;
    if (
      piece.type === 'pawn' &&
      to.col !== from.col &&
      !capturedPiece &&
      lastMove
    ) {
      enPassantCapture = newBoard[from.row][to.col] || undefined;
      newBoard[from.row][to.col] = null;
    }

    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      if (to.col === 6) {
        const kingsideRook = newBoard[to.row][7];
        newBoard[to.row][5] = kingsideRook;
        newBoard[to.row][7] = null;
        if (kingsideRook) {
          newBoard[to.row][5] = { ...kingsideRook, hasMoved: true };
        }
      } else if (to.col === 2) {
        const queensideRook = newBoard[to.row][0];
        newBoard[to.row][3] = queensideRook;
        newBoard[to.row][0] = null;
        if (queensideRook) {
          newBoard[to.row][3] = { ...queensideRook, hasMoved: true };
        }
      }
    }

    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    newBoard[from.row][from.col] = null;

    if (
      piece.type === 'pawn' &&
      (to.row === 0 || to.row === 7)
    ) {
      setPromotionSquare(to);
      setBoard(newBoard);
      return;
    }

    const notation = createMoveNotation(piece, from, to, capturedPiece || enPassantCapture);

    const move: Move = {
      from,
      to,
      piece,
      captured: capturedPiece || enPassantCapture,
      notation,
    };

    setMoveHistory([...moveHistory, move]);
    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
  };

  /**
   * Handle pawn promotion
   */
  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionSquare) return;

    const newBoard = board.map(row => [...row]);
    const piece = newBoard[promotionSquare.row][promotionSquare.col];
    
    if (piece) {
      newBoard[promotionSquare.row][promotionSquare.col] = {
        ...piece,
        type: pieceType,
      };
    }

    setBoard(newBoard);
    setPromotionSquare(null);
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
  };

  /**
   * Create a simple move notation (e.g., "e2-e4", "Nf3", "Qxd5")
   */
  const createMoveNotation = (
    piece: Piece,
    from: Position,
    to: Position,
    captured?: Piece
  ): string => {
    const files = 'abcdefgh';
    const fromSquare = `${files[from.col]}${8 - from.row}`;
    const toSquare = `${files[to.col]}${8 - to.row}`;
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
    const captureSymbol = captured ? 'x' : '-';
    
    return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`;
  };

  /**
   * Reset the game to initial state
   */
  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer('white');
    setMoveHistory([]);
    setGameStatus('playing');
    setPromotionSquare(null);
  };

  /**
   * Check if a square should be highlighted
   */
  const isSquareHighlighted = (row: number, col: number): boolean => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  /**
   * Check if a square is the selected square
   */
  const isSquareSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  /**
   * Check if a square was part of the last move
   */
  const isLastMoveSquare = (row: number, col: number): boolean => {
    if (moveHistory.length === 0) return false;
    const lastMove = moveHistory[moveHistory.length - 1];
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Crown className="text-yellow-400" size={40} />
            Chess Game
            <Crown className="text-yellow-400" size={40} />
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Tap a piece, then tap a valid square to move
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Chess Board */}
          <div className="flex-shrink-0">
            <div className="bg-slate-700 p-3 md:p-4 rounded-xl shadow-2xl">
              {/* Game Status */}
              <div className="mb-3 text-center">
                <div className="bg-slate-800 rounded-lg p-3 mb-2">
                  <p className="text-lg md:text-xl font-semibold text-white">
                    {gameStatus === 'checkmate' && (
                      <span className="text-red-400">
                        Checkmate! {currentPlayer === 'white' ? 'Black' : 'White'} wins!
                      </span>
                    )}
                    {gameStatus === 'stalemate' && (
                      <span className="text-yellow-400">Stalemate! Draw!</span>
                    )}
                    {gameStatus === 'check' && (
                      <span className="text-orange-400">
                        Check! {currentPlayer === 'white' ? "White's" : "Black's"} turn
                      </span>
                    )}
                    {gameStatus === 'playing' && (
                      <span className={currentPlayer === 'white' ? 'text-white' : 'text-slate-300'}>
                        {currentPlayer === 'white' ? "White's" : "Black's"} turn
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Board */}
              <div className="inline-block border-4 border-slate-900 rounded-lg overflow-hidden">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((piece, colIndex) => {
                      const isLight = (rowIndex + colIndex) % 2 === 0;
                      const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                      const isSelected = isSquareSelected(rowIndex, colIndex);
                      const isLastMove = isLastMoveSquare(rowIndex, colIndex);

                      let bgColor = isLight ? 'bg-amber-100' : 'bg-amber-700';
                      if (isSelected) {
                        bgColor = 'bg-blue-400';
                      } else if (isLastMove) {
                        bgColor = isLight ? 'bg-yellow-200' : 'bg-yellow-600';
                      }

                      return (
                        <div
                          key={colIndex}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                          className={`
                            w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 
                            flex items-center justify-center 
                            cursor-pointer relative
                            ${bgColor}
                            hover:opacity-80 transition-opacity
                          `}
                        >
                          {/* Piece */}
                          {piece && (
                            <span className="text-3xl sm:text-4xl md:text-5xl select-none">
                              {PIECE_SYMBOLS[piece.color][piece.type]}
                            </span>
                          )}
                          
                          {/* Valid move indicator */}
                          {isHighlighted && (
                            <div
                              className={`
                                absolute inset-0 flex items-center justify-center
                                ${piece ? 'bg-red-500 bg-opacity-30' : ''}
                              `}
                            >
                              {!piece && (
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-slate-900 bg-opacity-40 rounded-full" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Reset Button */}
              <div className="mt-3 text-center">
                <button
                  onClick={resetGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={20} />
                  New Game
                </button>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="w-full lg:w-80 bg-slate-700 rounded-xl shadow-2xl p-4">
            <h2 className="text-xl font-bold text-white mb-3 text-center">Move History</h2>
            <div className="bg-slate-800 rounded-lg p-3 max-h-96 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <p className="text-slate-400 text-center text-sm">No moves yet</p>
              ) : (
                <div className="space-y-1">
                  {moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-slate-200 bg-slate-700 rounded px-2 py-1"
                    >
                      <span className="font-semibold text-slate-400 w-8">
                        {Math.floor(index / 2) + 1}.
                      </span>
                      <span className={move.piece.color === 'white' ? 'text-white' : 'text-slate-300'}>
                        {move.notation}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pawn Promotion Modal */}
        {promotionSquare && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Choose Promotion
              </h3>
              <div className="flex gap-4">
                {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handlePromotion(type)}
                    className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg transition-colors"
                  >
                    <span className="text-5xl">
                      {PIECE_SYMBOLS[currentPlayer][type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
