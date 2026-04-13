export type TheoryCategory = 'openings' | 'endgames' | 'tactics' | 'strategy'

export interface TheoryTopic {
  readonly id: string
  readonly title: string
  readonly category: TheoryCategory
  readonly description: string
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced'
  readonly fen: string
  readonly keyMoves: readonly string[]
  readonly content: string
}

export const THEORY_TOPICS: readonly TheoryTopic[] = [
  // ── Openings ────────────────────────────────────────────────────────────────
  {
    id: 'italian-game',
    title: 'Italian Game',
    category: 'openings',
    difficulty: 'beginner',
    description: 'A classical opening focusing on rapid development and control of the center.',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    keyMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    content: `The Italian Game (1. e4 e5 2. Nf3 Nc6 3. Bc4) is one of the oldest and most natural chess openings. White develops the bishop to an aggressive diagonal aiming at f7, the weakest square in Black's camp.

**Key Ideas for White:**
- Develop quickly: Bc4, d3, 0-0, then Re1 and Nc3
- Control the center with pawns on e4 and d3 (or d4)
- The Giuoco Piano (3...Bc5) and Two Knights Defense (3...Nf6) are Black's main responses

**Pawn Structure:**
The typical pawn center is e4 vs e5. White often plays d3 for a slower, positional game (Giuoco Pianissimo) or d4 for a more aggressive approach (Giuoco Piano).

**Common Mistakes:**
- Playing d4 too early without preparation can lead to isolated pawns
- Neglecting kingside safety — always castle early
- Moving the same piece twice in the opening without good reason`,
  },
  {
    id: 'sicilian-defense',
    title: 'Sicilian Defense',
    category: 'openings',
    difficulty: 'intermediate',
    description: 'The most popular response to 1. e4, creating asymmetric positions.',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    keyMoves: ['e4', 'c5'],
    content: `The Sicilian Defense (1. e4 c5) is the most popular and statistically successful response to 1. e4. It creates an asymmetric pawn structure that leads to rich, complex middlegames.

**Why Play the Sicilian?**
- Black fights for the center with a flank pawn, creating imbalance
- After d4 cxd4, Black gets a semi-open c-file and a central pawn majority
- It's a fighting defense — you play for a win, not just equality

**Main Variations:**
- **Najdorf (5...a6):** The most popular. Flexible, allows ...e5 or ...e6 setups
- **Dragon (5...g6):** Fianchetto bishop on g7, aggressive counterplay
- **Classical (5...Nc6):** Solid development, prepares ...e5
- **Scheveningen (5...e6):** Flexible pawn structure, prepares ...d5

**Key Principle:**
Black accepts a slight lag in development in exchange for long-term structural advantages. Don't panic about being a tempo behind — the asymmetry is your weapon.`,
  },
  {
    id: 'queens-gambit',
    title: "Queen's Gambit",
    category: 'openings',
    difficulty: 'beginner',
    description: 'A classical d4 opening offering a pawn for central control.',
    fen: 'rnbqkbnr/pppppppp/8/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
    keyMoves: ['d4', 'd5', 'c4'],
    content: `The Queen's Gambit (1. d4 d5 2. c4) is not a true gambit — Black can take the pawn but White can easily recover it. It's one of the most reliable openings at all levels.

**Key Ideas:**
- White challenges Black's d5 pawn to gain central space
- If Black takes (Queen's Gambit Accepted), White plays e4 and gets a strong center
- If Black declines (Queen's Gambit Declined with ...e6), the game becomes strategic

**QGD (2...e6):**
Black's most solid response. The light-squared bishop gets blocked behind the e6 pawn — this is the main theoretical debate. Black aims for ...c5 to challenge the center.

**QGA (2...dxc4):**
Black takes the pawn and tries to hold it. White responds with e3 and Bxc4. Black must develop quickly or risk falling behind.

**Slav Defense (2...c6):**
Black supports d5 without blocking the light-squared bishop. Very solid and popular at all levels.`,
  },
  {
    id: 'caro-kann',
    title: 'Caro-Kann Defense',
    category: 'openings',
    difficulty: 'intermediate',
    description: 'A solid defense to 1. e4 that avoids early complications.',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    keyMoves: ['e4', 'c6', 'd4', 'd5'],
    content: `The Caro-Kann (1. e4 c6) is a solid, reliable defense. Black prepares ...d5 to challenge the center while keeping the light-squared bishop active (unlike the French Defense).

**Key Ideas:**
- ...c6 followed by ...d5 challenges e4 directly
- The light-squared bishop stays active (can go to f5 or g4)
- Leads to solid, strategic positions — good for positional players

**Main Lines:**
- **Classical (3. Nc3 dxe4 4. Nxe4 Bf5):** The main line. Black develops the bishop before playing ...e6
- **Advance (3. e5):** White grabs space. Black plays ...c5 to undermine the center
- **Exchange (3. exd5 cxd5):** Symmetric pawn structure, equal but can be drawish

**Who Should Play It:**
Players who prefer solid positions, clear plans, and strategic battles over tactical chaos.`,
  },
  {
    id: 'kings-indian',
    title: "King's Indian Defense",
    category: 'openings',
    difficulty: 'advanced',
    description:
      'An aggressive hypermodern defense allowing White to build a big center, then counterattacking.',
    fen: 'rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
    keyMoves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'],
    content: `The King's Indian Defense is a hypermodern opening where Black lets White build an imposing center with pawns on c4, d4, and e4, then strikes back with ...e5 or ...c5.

**Key Ideas:**
- Black fianchettoes the dark-squared bishop to g7, a powerful piece
- The ...e5 break is Black's main counterattacking weapon
- After d5, the position often splits into a kingside (Black) vs queenside (White) attack

**Classical Variation:**
After 1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 0-0 6. Be2 e5 — the main battleground. White plays for queenside expansion, Black attacks on the kingside with ...f5-f4.

**Warning:**
This opening requires precise knowledge and tactical ability. You must be comfortable with sharp, double-edged positions where both sides are attacking.`,
  },

  // ── Endgames ────────────────────────────────────────────────────────────────
  {
    id: 'king-pawn-vs-king',
    title: 'King + Pawn vs King',
    category: 'endgames',
    difficulty: 'beginner',
    description: 'The most fundamental endgame — learn opposition and the key square concept.',
    fen: '8/8/8/4k3/8/4K3/4P3/8 w - - 0 1',
    keyMoves: ['Kf3', 'Kd4', 'e4', 'Kf4'],
    content: `This is the single most important endgame to learn. If you can't win King + Pawn vs King, you'll throw away many games.

**The Rule of Opposition:**
When two kings face each other with one square between them, the player who does NOT have to move has the "opposition." Having the opposition is usually an advantage because you force the opponent's king to give way.

**Key Squares:**
For a pawn on e4, the key squares are d6, e6, and f6. If the attacking king reaches any of these squares, the pawn promotes.

**The Method:**
1. Advance the king first, not the pawn
2. Get the king in front of the pawn
3. Try to reach a key square
4. Use the opposition to force the defending king aside

**Critical Rule:**
If the attacking king is on the 6th rank in front of the pawn, it's always a win regardless of who moves.

**When It's a Draw:**
- Rook pawns (a and h files) are usually drawn because the defending king hides in the corner
- If the defending king reaches the square in front of the pawn on the promotion rank`,
  },
  {
    id: 'rook-endgames',
    title: 'Rook Endgame Basics',
    category: 'endgames',
    difficulty: 'intermediate',
    description: 'Rook endgames occur in ~50% of all games. Learn Lucena and Philidor positions.',
    fen: '1K1k4/1P6/8/8/8/8/r7/5R2 w - - 0 1',
    keyMoves: ['Rd1+', 'Ke7', 'Kc7', 'Ra8'],
    content: `Rook endgames are the most common endgame type. Two positions you MUST know:

**The Lucena Position (winning):**
The side with the pawn has their king on the 8th rank, the pawn on the 7th rank, and the rook cutting off the defending king. The winning technique is called "building a bridge" — use your rook to shield your king from checks.

**The Philidor Position (drawing):**
The defending side places their rook on the 6th rank (creating a barrier), then switches to checking from behind once the pawn advances.

**General Principles:**
- Rooks belong behind passed pawns (both your own and your opponent's)
- Activity is everything — an active rook is often worth a pawn
- Cut off the enemy king with your rook along a rank or file
- In rook + pawn vs rook, the defending king must be in front of the pawn

**Common Mistake:**
Passively defending with your rook. Always look for active counterplay — even if you're down material, an active rook can save the game.`,
  },
  {
    id: 'opposition',
    title: 'Opposition and Outflanking',
    category: 'endgames',
    difficulty: 'beginner',
    description: 'Master the fundamental concept of king opposition in pawn endgames.',
    fen: '8/8/3k4/8/3K4/8/3P4/8 w - - 0 1',
    keyMoves: ['Kc4', 'Kc6', 'Kd4', 'Kd6'],
    content: `Opposition is the most important concept in king and pawn endgames. Understanding it is the difference between winning and drawing countless games.

**Direct Opposition:**
Kings stand on the same file or rank with one square between them. The player NOT to move has the opposition.

**Distant Opposition:**
Kings stand on the same file or rank with 3 or 5 squares between them (odd number). Same principle — the player not to move has it.

**How to Use It:**
When you have the opposition, the opposing king must move sideways, allowing your king to advance. This is called "outflanking."

**Practical Application:**
In K+P vs K, first march your king forward. When the defending king blocks, take the opposition. The defender must then step aside, and your king advances toward the key squares.

**Remember:**
Opposition is a means to an end (reaching key squares), not an end in itself. Sometimes you need to lose the opposition temporarily to gain it at the critical moment.`,
  },
  {
    id: 'basic-checkmates',
    title: 'Basic Checkmate Patterns',
    category: 'endgames',
    difficulty: 'beginner',
    description: 'Queen + King, Rook + King, and two bishops checkmate techniques.',
    fen: '8/8/8/8/8/8/8/k3K2R w - - 0 1',
    keyMoves: ['Kd2', 'Ka2', 'Kc3', 'Ka3'],
    content: `You MUST be able to deliver checkmate with basic material advantages. Running out of time or stalemating is unacceptable.

**King + Queen vs King:**
1. Use the queen to restrict the enemy king's squares
2. Drive the king to the edge of the board
3. Bring your king to support the queen
4. Deliver checkmate on the edge
- **Watch out for stalemate!** Never place the queen adjacent to the king unless it's checkmate

**King + Rook vs King:**
1. Use the rook to cut off ranks or files (creating a "box")
2. Shrink the box by moving the rook when the king approaches
3. Use your king to support the rook
4. Checkmate happens on the edge of the board
- This takes more moves than queen checkmate but uses the same "shrink the box" principle

**King + Two Bishops vs King:**
1. Drive the king to a corner
2. Use the bishops to create a diagonal barrier
3. Bring your king to help
4. Coordinate all three pieces for the final checkmate
- The bishops must work together — one controls light squares, one controls dark squares`,
  },
  {
    id: 'passed-pawns',
    title: 'Passed Pawns in Endgames',
    category: 'endgames',
    difficulty: 'intermediate',
    description: 'How to create, advance, and use passed pawns to win endgames.',
    fen: '8/5pk1/8/4P3/8/8/5K2/8 w - - 0 1',
    keyMoves: ['Ke3', 'Kf8', 'Kd4', 'Ke7'],
    content: `A passed pawn is a pawn with no opposing pawns blocking or guarding its path to promotion. In endgames, passed pawns are enormously powerful.

**Creating Passed Pawns:**
- Pawn breaks: advance your pawns to create one that can break through
- Exchanges: trade pawns to leave a passer behind
- Sacrifices: sometimes sacrificing a pawn creates a passed pawn elsewhere

**The Rule of the Square:**
Draw a diagonal square from the pawn to the 8th rank. If the defending king can step into this square, it catches the pawn. If not, the pawn promotes.

**Protected Passed Pawn:**
A passed pawn protected by another pawn is extremely strong. The enemy king must deal with it, freeing your king to attack elsewhere.

**Outside Passed Pawn:**
A passed pawn far from the main action forces the defending king to chase it, leaving your king free to gobble up the opponent's remaining pawns.

**Key Principle:**
Passed pawns must be pushed! Don't sit on a passed pawn — advance it and force your opponent to deal with it.`,
  },

  // ── Tactics ─────────────────────────────────────────────────────────────────
  {
    id: 'pins',
    title: 'Pins',
    category: 'tactics',
    difficulty: 'beginner',
    description: 'A piece is pinned when moving it would expose a more valuable piece behind it.',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    keyMoves: ['Ng5', 'd5', 'exd5'],
    content: `A pin is one of the most common tactical motifs. A piece is pinned when it cannot move because doing so would expose a more valuable piece (or the king) behind it.

**Types of Pins:**
- **Absolute Pin:** The piece behind is the king. The pinned piece literally cannot move (it's illegal).
- **Relative Pin:** The piece behind is a queen, rook, or other valuable piece. The pinned piece CAN move, but shouldn't.

**How to Exploit Pins:**
1. Pile up on the pinned piece — attack it with more pieces than defend it
2. Advance a pawn to attack the pinned piece
3. The pinned piece can't defend other squares — look for threats it normally guards

**How to Escape Pins:**
1. Block the pin by placing another piece in between
2. Move the valuable piece behind the pinned piece
3. Counter-attack to create a bigger threat
4. Capture the pinning piece

**Common Example:**
A bishop on g5 pins a knight on f6 to the queen on d8. White can pile up with Nd5, increasing pressure on the pinned knight.`,
  },
  {
    id: 'forks',
    title: 'Forks',
    category: 'tactics',
    difficulty: 'beginner',
    description: 'One piece attacks two or more enemy pieces simultaneously.',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    keyMoves: ['d4', 'exd4', 'e5'],
    content: `A fork is when one piece attacks two (or more) enemy pieces at the same time. The opponent can only save one, so you win material.

**Knight Forks:**
Knights are the most dangerous forking pieces because they attack in an L-shape that's hard to see coming. A knight fork on the king and queen (a "royal fork") is devastating.

**Pawn Forks:**
Pawns can fork two pieces by advancing to attack diagonally on both sides. Often overlooked because pawns seem harmless.

**Other Forks:**
Queens, bishops, and rooks can all deliver forks. Queen forks are especially common — the queen's mobility lets it attack multiple pieces.

**How to Set Up Forks:**
1. Look for loose (undefended) pieces — they're fork targets
2. Decoy a piece to a square where it can be forked
3. After an exchange, check if the recapture creates a fork opportunity

**Defense Against Forks:**
- Keep pieces defended
- Don't place your king and queen on the same color knight-accessible square
- Be aware of knight-forking squares (especially c2, c7, f2, f7, e6, e3)`,
  },
  {
    id: 'skewers',
    title: 'Skewers',
    category: 'tactics',
    difficulty: 'beginner',
    description:
      'An attack on a valuable piece that forces it to move, exposing a piece behind it.',
    fen: '4k3/8/8/8/8/4b3/8/R3K3 w Q - 0 1',
    keyMoves: ['Ra8+', 'Kd7', 'Ra3'],
    content: `A skewer is the reverse of a pin. You attack a valuable piece, and when it moves, you capture the piece behind it.

**How It Works:**
A long-range piece (bishop, rook, or queen) attacks a valuable piece along a line. The valuable piece is forced to move, revealing a less valuable piece behind it that gets captured.

**Common Skewer Patterns:**
- Rook skewering a king and a rook along a rank
- Bishop skewering a king and a rook along a diagonal
- Queen skewering a king and a queen (rare but game-winning)

**Setting Up Skewers:**
1. Look for enemy pieces aligned on the same rank, file, or diagonal
2. Force pieces onto the same line with checks or threats
3. Simplify into endings where skewers along ranks are common

**Key Difference from Pins:**
In a pin, the less valuable piece is in front. In a skewer, the MORE valuable piece is in front.`,
  },
  {
    id: 'discovered-attacks',
    title: 'Discovered Attacks',
    category: 'tactics',
    difficulty: 'intermediate',
    description: 'Moving one piece reveals an attack from another piece behind it.',
    fen: 'r1bqk2r/ppp2ppp/2n2n2/3pp3/1bP1P3/2N2N2/PP1B1PPP/R2QKB1R w KQkq - 0 6',
    keyMoves: ['cxd5', 'Nxd5', 'Nxe5'],
    content: `A discovered attack happens when you move one piece, revealing an attack from another piece that was blocked behind it. It's like a "two-for-one" attack.

**Discovered Check:**
The most powerful form — the revealed piece gives check to the king. Since the king MUST deal with the check, the moved piece can do almost anything: capture a piece, threaten the queen, or deliver a second threat.

**Double Check:**
When BOTH the moved piece AND the revealed piece give check. The only defense is to move the king — blocking and capturing don't work against double check.

**How to Create Discovered Attacks:**
1. Place a long-range piece (bishop, rook, queen) behind another piece on the same line
2. Move the front piece with a threat of its own
3. The back piece attacks simultaneously

**Famous Example:**
The "Windmill" — a discovered check pattern where you alternate capturing pieces with a rook while the bishop keeps giving discovered check. Can win multiple pieces.

**Defense:**
Watch for enemy pieces lined up behind each other. If you see a battery forming, take prophylactic action before the discovery.`,
  },
  {
    id: 'back-rank-mate',
    title: 'Back Rank Tactics',
    category: 'tactics',
    difficulty: 'beginner',
    description: 'Exploiting a trapped king on the first/eighth rank with no escape squares.',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3rR1K1 w - - 0 1',
    keyMoves: ['Rxd1'],
    content: `The back rank mate is one of the most common tactical patterns, especially in beginner and intermediate games. It occurs when a king is trapped on the back rank by its own pawns.

**The Pattern:**
A rook or queen delivers checkmate on the 1st (or 8th) rank because the king has no escape squares — its own pawns block it.

**How to Exploit It:**
1. Look for an opponent's king with no "luft" (breathing room) — pawns on f7/g7/h7 with no escape
2. Eliminate defenders of the back rank (rooks, queens)
3. Use diversionary tactics: sacrifice a piece to lure away the defender
4. Sometimes a queen sacrifice on the back rank forces mate

**How to Prevent It:**
1. Create luft: play h3 (or h6) to give the king an escape square
2. Keep a rook on the back rank for defense
3. After castling, always ask: "Is my back rank safe?"

**Key Principle:**
Always check if the opponent's back rank is weak before making your move. Back rank threats can turn a losing position into a win.`,
  },

  // ── Strategy ────────────────────────────────────────────────────────────────
  {
    id: 'pawn-structure',
    title: 'Pawn Structure Fundamentals',
    category: 'strategy',
    difficulty: 'intermediate',
    description: 'Understanding how pawn structure dictates your plans.',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    keyMoves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4'],
    content: `Pawns are the soul of chess (Philidor). Your pawn structure determines where your pieces should go, where you should attack, and where you're vulnerable.

**Key Concepts:**

**Isolated Pawn:**
A pawn with no friendly pawns on adjacent files. Weakness: can be blockaded and attacked. Strength: provides open lines and active piece play.

**Doubled Pawns:**
Two pawns on the same file. Usually a weakness because they can't protect each other and block each other's advance.

**Backward Pawn:**
A pawn that can't be supported by adjacent pawns and sits on a semi-open file. A prime target for attack.

**Pawn Chain:**
Pawns linked diagonally. Attack the base of a pawn chain (the rearmost pawn) to undermine the whole structure.

**Pawn Majority:**
Having more pawns on one side. Use it to create a passed pawn. A queenside majority is often more valuable because it's farther from the kings.

**Practical Rule:**
Before making any pawn move, consider: "Am I creating a weakness? Is this pawn move irreversible?" Pawns can never go backward.`,
  },
]

export function getTopicById(id: string): TheoryTopic | undefined {
  return THEORY_TOPICS.find((t) => t.id === id)
}

export function getTopicsByCategory(category: TheoryCategory): readonly TheoryTopic[] {
  return THEORY_TOPICS.filter((t) => t.category === category)
}

export const CATEGORY_LABELS: Record<TheoryCategory, string> = {
  openings: 'Openings',
  endgames: 'Endgames',
  tactics: 'Tactics',
  strategy: 'Strategy',
}
