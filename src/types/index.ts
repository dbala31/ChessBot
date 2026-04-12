// ── Enums ──────────────────────────────────────────────────────────────────────

export enum ScoreType {
  Tactics = 'tactics',
  Endgame = 'endgame',
  AdvantageCapitalization = 'advantage_capitalization',
  Resourcefulness = 'resourcefulness',
  TimeManagement = 'time_management',
  OpeningPerformance = 'opening_performance',
}

export enum MoveClassification {
  Best = 'best',
  Good = 'good',
  Inaccuracy = 'inaccuracy',
  Mistake = 'mistake',
  Blunder = 'blunder',
}

export enum GamePhase {
  Opening = 'opening',
  Middlegame = 'middlegame',
  Endgame = 'endgame',
}

export enum LessonType {
  RetryMistakes = 'retry_mistakes',
  BlunderPreventer = 'blunder_preventer',
  AdvantageCapitalization = 'advantage_capitalization',
  OpeningImprover = 'opening_improver',
  IntuitionTrainer = 'intuition_trainer',
  Trainer360 = '360_trainer',
  Tactics = 'tactics',
  CheckmatePatterns = 'checkmate_patterns',
  BlindfoldTactics = 'blindfold_tactics',
  EndgameDrill = 'endgame_drill',
  Defender = 'defender',
}

export type GameSource = 'chesscom' | 'lichess'

export type PuzzleSource = 'own_game' | 'lichess_db'

// ── Domain models ──────────────────────────────────────────────────────────────

export interface Game {
  readonly id: string
  readonly userId: string
  readonly pgn: string
  readonly source: GameSource
  readonly sourceGameId: string
  readonly result: string
  readonly userColor: 'white' | 'black'
  readonly timeControl: string
  readonly openingEco: string | null
  readonly playedAt: string
  readonly analysisComplete: boolean
  readonly createdAt: string
}

export interface AnalyzedMove {
  readonly id: string
  readonly gameId: string
  readonly ply: number
  readonly fenBefore: string
  readonly playedMove: string
  readonly bestMove: string
  readonly evalBefore: number
  readonly evalAfter: number
  readonly cpLoss: number
  readonly classification: MoveClassification
  readonly phase: GamePhase
  readonly timeSpent: number | null
  readonly createdAt: string
}

export interface SkillScore {
  readonly id: string
  readonly userId: string
  readonly scoreType: ScoreType
  readonly value: number
  readonly computedAt: string
}

export interface Puzzle {
  readonly id: string
  readonly fen: string
  readonly solutionPv: string
  readonly source: PuzzleSource
  readonly themeTags: readonly string[]
  readonly sourceGameId: string | null
  readonly difficulty: number
  readonly lessonType: LessonType
  readonly createdAt: string
}

export interface DrillAttempt {
  readonly id: string
  readonly userId: string
  readonly puzzleId: string
  readonly correct: boolean
  readonly timeTakenMs: number
  readonly attemptedAt: string
}

export interface StudyPlan {
  readonly id: string
  readonly userId: string
  readonly weekStart: string
  readonly focusAreas: readonly ScoreType[]
  readonly drillQueueIds: readonly string[]
  readonly createdAt: string
}

export interface UserSettings {
  readonly id: string
  readonly userId: string
  readonly chesscomUsername: string | null
  readonly lichessUsername: string | null
  readonly onboardingComplete: boolean
  readonly createdAt: string
}

// ── API payloads ───────────────────────────────────────────────────────────────

export interface ImportGamesRequest {
  readonly username: string
  readonly source: GameSource
  readonly limit: number
}

export interface ImportGamesResponse {
  readonly imported: number
  readonly total: number
}

export interface ExplainMoveRequest {
  readonly fen: string
  readonly playedMove: string
  readonly bestMove: string
  readonly cpLoss: number
  readonly phase: GamePhase
}

export interface ExplainMoveResponse {
  readonly explanation: string
}

// ── Analysis callback types ────────────────────────────────────────────────────

export interface AnalysisProgress {
  readonly currentGame: number
  readonly totalGames: number
  readonly currentGameId: string
  readonly currentPly: number
  readonly totalPlies: number
}

export interface StockfishResult {
  readonly fen: string
  readonly bestMove: string
  readonly eval: number
  readonly isMate: boolean
  readonly mateIn: number | null
  readonly pv: readonly string[]
}
