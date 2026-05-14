# Homeward — Game Design Document

> A top-down pixel art RPG about a family road trip from Chicago to Wilmington, NC. Part adventure, part love letter. Light, whimsical, and quietly magical.

---

## 1. Elevator Pitch

John, Annie, Obi the beagle, and Luna the bengal cat are moving to their dream home on the North Carolina coast. But first — they're visiting everyone they love along the way. John's parents in the Blue Ridge Mountains. Annie's parents at the beach. And a few dozen strangers, magical creatures, and incredibly aggressive geese in between.

The drive should take eleven hours. It takes considerably longer — because the world between Chicago and Wilmington is stranger, kinder, and more magical than any of them expected.

Along the way they help oddball strangers, solve puzzles that require all four of them, stumble into turn-based battles with mischievous wildlife, and discover that the best part of getting somewhere new is getting there together.

Hidden throughout the world are **the Little Things** — small, warm, glowing collectibles that only Annie can pick up. Each one reveals a quiet thought — something felt but never said. About her, about the pets, about the life they're building. They're scattered across the entire journey like love notes hidden in the margins.

---

## 2. Core Pillars

1. **It's a love letter first, a game second.** Every system, joke, and side quest should make Annie smile or feel something. If a feature doesn't serve that, cut it.
2. **Light and whimsical.** The stakes are low — no one dies, no world ends. The "danger" is a grumpy goose, a flat tire, a rainstorm at the wrong time. The magic is gentle and unexplained.
3. **The family is the mechanic.** Switching between John, Annie, Obi, and Luna isn't just a gimmick — each one sees and interacts with the world differently. The game rewards you for using all four.
4. **Cozy over grindy.** Combat is fun and funny, not punishing. Leveling is generous. No game-overs — losing a battle just means the family regroups and tries again. The worst thing that happens is Obi gets tired and needs a nap.

---

## 3. Characters & Abilities

### 3a. John — The Practical One

- **Role:** Support / builder / fixer
- **Overworld abilities:**
  - **Fix things** — broken bridges, stuck doors, busted car parts, jammed machines
  - **Carry heavy objects** — push boulders, move furniture, clear paths
  - **Talk to strangers** — the default "human conversation" character (friendly, direct)
- **Combat role:** Tank / protector. High HP, defensive moves. Signature moves center on protecting the party.
- **Signature combat moves:**
  - *"I've got this"* — takes damage for another party member this turn
  - *"Hold on"* — buffs party defense for 2 turns
  - *"Dad energy"* — heals the whole party a small amount (he'd never call it that)

### 3b. Annie — The Heart

- **Role:** The main playable character. Lead explorer, item user, emotional core.
- **Overworld abilities:**
  - **Talk to anyone** — Annie gets unique, warmer dialogue options NPCs respond to differently than John
  - **Find hidden things** — a "warmth sense" that highlights nearby secrets, hidden paths, and collectibles with a soft glow. Lore reason: the world responds to kindness.
  - **Use key items** — quest items, tools, gifts
  - **Collect Little Things** — only Annie can see and pick up the glowing warm-light collectibles
- **Combat role:** Versatile / healer / buffer. The party's heart.
- **Signature combat moves:**
  - *"You've got this!"* — buffs an ally's attack for 2 turns
  - *"Cozy vibes"* — heals one ally significantly
  - *"Group hug"* — small heal to entire party, removes status effects

### 3c. Obi — The Loyal Explorer (Dog)

- **Breed:** 50% beagle, 25% Australian Shepherd, 25% Australian Cattle Dog. Does NOT look like a typical beagle — lean, athletic build with long legs and a white-dominant body with subtle dark ticking/speckles. Brown patch on head, floppy brown ears. Never describe as "beagle" in art prompts; the AI will hallucinate a stocky tricolor hound.
- **Role:** Tracker, digger, tank
- **Overworld abilities:**
  - **Sniff** — reveals hidden items, buried treasures, tracks scent trails to secrets. The screen gets a subtle scent-trail overlay when active.
  - **Dig** — access buried items, dig under fences and walls for shortcuts
  - **Squeeze** — fit through gaps and low passages Annie and John can't
  - **Howl** — startles overworld enemies (brief stun), alerts distant NPCs
- **Combat role:** Loyal tank. Takes hits, protects teammates, occasionally does something heroically dumb.
- **Signature combat moves:**
  - *"Good boy charge"* — strong physical attack
  - *"Protective howl"* — taunts all enemies to target him for 1 turn
  - *"Tail wag"* — boosts party morale (raises everyone's next attack)
  - *"Zoomies"* — multi-hit attack, slightly inaccurate

### 3d. Luna — The Clever Infiltrator (Bengal Cat)

- **Role:** Climber, stealth, glass cannon
- **Overworld abilities:**
  - **Climb** — scale walls, trees, fences, rooftops. Opens up vertical exploration in top-down via ladders, ledges, and elevated paths.
  - **Stealth** — sneak past enemies without triggering encounters. Can eavesdrop on NPC conversations for bonus dialogue.
  - **Dark vision** — navigate dark areas (caves, unlit rooms) that others can't see in
  - **Cat flaps & vents** — access tiny passages and shortcuts
- **Combat role:** Fast glass cannon. Hits hard, dodges often, low HP.
- **Signature combat moves:**
  - *"Pounce"* — high damage single target, bonus crit chance
  - *"Cat nap"* — skip a turn, restore significant HP (Luna being Luna)
  - *"Knock it off the table"* — throws a random item at an enemy, chaotic damage
  - *"Murder mittens"* — multi-strike attack, each hit has crit chance

---

## 4. The Little Things (Collectible System)

This is the emotional core of the game and what makes it a gift rather than just a game.

### Concept

Scattered throughout every area of the game are small glowing warm lights — soft, pulsing, golden. Only Annie can see them (they're invisible when playing as John, Obi, or Luna). When Annie walks over one, it reveals a short message — a quiet thought, an observation, something felt but not said out loud.

The game never labels these with a name or announces "You found a thought!" They're just there — warm, glowing, waiting. In the journal, they're collected under a small heart icon in a section called **"Little Things."**

### Tone Examples

- *(Found near the car after the first rest stop)* "She always makes sure everyone has water before she gets her own."
- *(Found near a sleeping Obi)* "He came right to me the day we got him. Climbed into my lap and that was that. But he's her dog now. He always was."
- *(Found near Luna perched somewhere high)* "Luna only purrs for Annie. I've accepted this. I have not made peace with it."
- *(Found in Galax, at John's parents' house)* "Watching my mom hug Annie goodbye like she's her own daughter. She is."
- *(Found in Myrtle Beach, watching Annie with her parents)* "She laughs louder around her mom. I want her to always laugh like that."
- *(Found on a quiet stretch of road)* "She sings along to every song wrong. Every single one. I will never correct her."
- *(Found in the final area, near the new house)* "Home isn't the house. Home is wherever she is, and wherever these two weird animals are, and I wouldn't trade it for anything."

### Mechanics

- **35–45 total** across the entire game (3–4 per area, more in the family chapters)
- Some are in plain sight on the main path; others require puzzle-solving or character-switching to reach
- A journal/scrapbook tracks collected ones under the "Little Things" section, so Annie can re-read them anytime
- No gameplay reward — they ARE the reward
- The final one is always found at the very end, at the new home

### Design Rule

These should feel true. Not performatively romantic — just honest. Some funny, some tender, some just observations. They should read like things a real person actually thinks but doesn't say. The moment one sounds like a greeting card, cut it.

---

## 4b. Cutscenes

Cutscenes are used sparingly but deliberately — for key story beats, emotional moments, and character development. They're not the primary narrative vehicle (that's dialogue + exploration + the Little Things), but they punctuate the journey at important moments.

### Types

**Story cutscenes** — short, scripted sequences that play at chapter transitions or major story beats. The family piling into the car. Arriving at Galax. Seeing the ocean for the first time. These use the pixel art sprites in a "cinematic" framing — wider view, maybe a letterbox bar, orchestrated character movement rather than player control.

**John's moments** — occasionally, a cutscene is told from John's perspective. These are different from the Little Things (which are short, single-line collectibles). These are brief scenes — maybe 30 seconds — where the camera shifts to John watching Annie do something, or the family together, and his internal monologue plays as text over the image. Used rarely (5–6 across the entire game) to make them land harder. Examples:
- Annie helping a stranger in a small town, and John watching from a distance, thinking about how she always does that.
- The family silhouetted against a sunset at a rest stop, and John thinking about the life they're building.
- The pets asleep in the back seat, and John glancing at Annie driving, and just... a moment.

**Comedy cutscenes** — short, funny beats. Obi spotting a squirrel and the whole party reacting. Luna pushing something off a table. A dramatic zoom on the Legendary Goose. These keep the tone light between the emotional beats.

### Implementation

Cutscenes are scripted sequences that temporarily disable player input and run a choreographed series of events: camera movements, character walks, dialogue boxes, screen effects (fade, letterbox), and optional music changes. They're stored as data (JSON or JS objects) rather than hard-coded, so they're easy to author and modify.

---

## 5. World Structure

### Route: Chicago → Wilmington, NC

The game follows a roughly real geographic path, but the world is stylized and gently magical. Each chapter is a self-contained area with its own town, outdoor zone, characters, and problems to solve.

### Chapter Structure

The route follows a real geographic path — Chicago south through Indiana, into Kentucky, up into the Blue Ridge Mountains to visit John's parents in Galax, VA, then south through North Carolina, down to Myrtle Beach to visit Annie's parents, and finally north along the coast to Wilmington. Three acts: **Leaving Home → Visiting Family → Finding Home.**

**Act I — Leaving Home**

| Ch | Area | Theme | Vibes | Key Feature |
|----|------|-------|-------|-------------|
| 0 | **Wicker Park, Chicago** | Packing up, saying goodbye | Urban, bittersweet, nostalgic | Tutorial. Learn controls, switching, interactions. Visit favorite spots one last time. The apartment is half-packed. Obi doesn't understand why everything is in boxes. |
| 1 | **Indiana Countryside** | The open road begins | Farmland, rest stops, fireflies at dusk | First combat encounters (raccoons raiding the car snacks). Obi's sniff ability unlocked. A rest stop with a suspicious number of geese. |
| 2 | **Small-Town Indiana** | A town that needs help | Cozy Main Street, county fair vibes | First real quest hub. Help townsfolk, enter a pie contest or fishing tournament. Luna's climb ability unlocked. The family starts to enjoy the detours. |
| 3 | **Kentucky Hills** | Into the mountains — and a familiar face | Rolling hills, horse farms, bluegrass, covered bridges | Environmental puzzles using dig + climb. A spooky-but-not-really abandoned barn dungeon. The landscape changes and so does the music. **Key NPC: John's best friend** — a big-hearted, outrageously funny guy who's also friends with Annie. He's loud, he's country, he's gay, and he's the kind of person who turns a roadside stop into an event. He could run a side quest (help him fix up his property? Enter his horses in something? A bourbon-tasting challenge?), and his dialogue should be the funniest in the game. The family stays the night and it feels like a preview of what life could be like when everyone's closer together. |

**Act II — Visiting Family**

| Ch | Area | Theme | Vibes | Key Feature |
|----|------|-------|-------|-------------|
| 4 | **Appalachian Forest** | Deep woods, gentle magic | Ancient trees, glowing mushrooms, talking animals | The magic gets more visible. A wise old fox NPC. Obi and Luna can understand animal speech — the humans can't quite hear it. The forest feels like it's been waiting for them. |
| 5 | **Galax, Virginia** | John's parents' home | Small-town Blue Ridge, old-time music, front porch sitting, mountain air | **No major combat — a "rest" chapter.** Explore the town, visit John's parents (they become temporary NPCs who fuss over Annie and spoil the pets). Side quests around town. Galax is known for its old-time fiddler's convention — maybe the family helps set one up or attends one. John's dad gives Obi an embarrassing amount of treats. Little Things here hit different — John sees Annie with his family and thinks about what home means. |
| 6 | **Myrtle Beach, South Carolina** | Annie's parents' home | Boardwalk, beach tourist town, warm sand, loud seagulls | **Another rest chapter — mirror of Galax.** Annie's parents spoil everyone. Luna is deeply suspicious of the ocean. Obi tries to dig to China on the beach. Beach-themed side quests (help a crab, find lost sunglasses, settle a sandcastle dispute). Annie is visibly happy here. Little Things about watching Annie with her family, about how she lights up, about wanting to give her a life where this is close by. |

**Act III — Finding Home**

| Ch | Area | Theme | Vibes | Key Feature |
|----|------|-------|-------|-------------|
| 7 | **Coastal Highway** | The final stretch north | Live oaks, Spanish moss, salt air, golden hour light | Boss encounter: The Legendary Goose (dramatic, silly, multi-phase). The family realizes they've changed on the trip. The world's magic is strongest here — almost visible. Everything is bathed in warm light. |
| 8 | **Wilmington / The New Home** | Arrival | Beach, river, oak-lined streets, the house, the porch | **No combat.** Explore the new neighborhood. Unpack the first box. Obi finds the yard. Luna finds the highest point. The final Little Things are scattered through the house and around the block. |
| 9 | **Epilogue — The Housewarming** | Everyone comes to visit | The house, full of people and pets | **Short, non-interactive (or lightly interactive) epilogue.** Both sets of parents arrive. John's Kentucky friend shows up uninvited with a casserole. The house is full. The family is together. Final Little Thing. Credits roll over a montage of the journey — scenes from every chapter, painted in the game's pixel art style. |

### Optional / Bonus Areas

- **Roadside attractions** — a giant ball of yarn, a mysterious cave, a haunted rest stop, the world's largest chair. Fun diversions with unique puzzles and Little Things.
- **Flashback vignettes** — short, non-combat scenes triggered by items Annie finds. Memories of Wicker Park, of the day they got Obi, of the first time Luna did something insane, of John and Annie's early days.
- **Return visits** — after reaching Wilmington, can the family "drive back" to revisit any chapter? Optional but sweet. Previously-helped NPCs remember you.

---

## 6. Combat System

### Philosophy

Combat should be **fun and funny, not stressful.** Enemies are mischievous, not evil. Battles reward creativity (using the right character for the situation) over grinding. No permadeath, no game-over screen. Losing just means the family regroups.

### Battle Flow

1. Encounter triggers (random in wilderness, scripted in story moments)
2. Screen transitions to a battle view (party on left, enemies on right, like Pokémon/Undertale)
3. Each party member acts in turn order (based on speed stat)
4. Options per turn: **Attack** / **Special** / **Befriend** / **Item** / **Flee**
5. Enemies act after all party members (or interleaved by speed, TBD)
6. Victory (defeat or befriend) → XP, coins, maybe items. Defeat → party regroups at last save point, no penalty.

### The Befriend System (Undertale-Inspired, Cozy-Flavored)

Every enemy in the game can be befriended instead of defeated. This is core to the cozy philosophy — the raccoons aren't evil, they're just hungry. The geese aren't villains, they're just geese.

**How it works:**
- The **Befriend** option replaces "Mercy" from Undertale. Each character has unique befriend actions:
  - **Annie:** Talk, Compliment, Offer Snack, Sing
  - **John:** Fix Something, Share Food, Wait Patiently, Dad Joke
  - **Obi:** Wag Tail, Play Bow, Share Treat, Puppy Eyes
  - **Luna:** Ignore Pointedly, Slow Blink, Groom Self, Nap Nearby
- Each enemy has a **friendliness meter** (hidden, shown as their expression changing from hostile → curious → friendly). Different befriend actions fill the meter by different amounts depending on the enemy.
- When the meter is full, the enemy becomes friendly. Battle ends with a unique little animation — the raccoon shares its stolen snack back, the goose honks approvingly, the skunk does a little dance.
- **Befriending gives equal or slightly better rewards than fighting.** No penalty for choosing kindness.
- **Some enemies can ONLY be befriended** — they're too cute or too silly to fight. A lost puppy, a confused turtle, a baby possum.
- **Some enemies are easier to befriend with specific characters.** Animals respond better to Obi and Luna. Shy creatures respond better to Luna's "Ignore Pointedly." Hungry creatures respond to anyone offering food.

**Why this works for the game:**
- It reinforces the cozy philosophy — violence is optional, kindness is always available
- It gives each character a distinct personality in combat (Luna befriending by ignoring enemies is peak Luna)
- It creates a soft completionist loop — can you befriend every creature on the road trip?
- Befriended creatures occasionally show up later in the game, remembering you. The raccoon from Chapter 1 might appear in Chapter 6 and give you an item. The world remembers kindness.

### The Bestiary / Road Trip Journal

Every creature you encounter (fought or befriended) gets an entry in the **Road Trip Journal** — a bestiary with funny descriptions, stats, and a note on whether you befriended them. Completing the bestiary is an optional side goal. Entries are written from Obi's or Luna's perspective (Obi's are earnest: "This friend smells like pine needles and ambition." Luna's are withering: "Mediocre. 4/10.").

### Stats (Kept Simple)

| Stat | What it does |
|------|-------------|
| HP | Health. Reach 0 = knocked out for the battle (revives after). |
| Attack | Physical damage dealt. |
| Defense | Damage reduction. |
| Speed | Turn order. |
| Heart | Special move effectiveness, healing power. Annie's key stat. |

- **No MP/mana.** Special moves have cooldowns (usable every X turns) instead. Simpler, no resource management anxiety.
- **Leveling:** XP from battles and quests. Level ups are automatic and generous — stat boosts + occasional new move. Max level ~20 for a 3-5 hour game.

### Enemy Examples

| Enemy | Location | Vibe |
|-------|----------|------|
| Trash Pandas (raccoons) | Rest stops, campgrounds | Steal your snacks mid-battle. Annoying, not dangerous. |
| Angry Geese | Parks, lakes | Surprisingly tough. The game's running joke. |
| Skunks | Forest areas | Status effect: "Stinky" — party members refuse to stand near the affected character. |
| Possums | Everywhere | Play dead mid-battle, then surprise attack. |
| Mosquito Swarm | Humid areas | Lots of tiny hits. Obi's howl is effective. |
| Boss: The Legendary Goose | Chapter 7 | A goose of unusual size. Multiple phases. Honks dramatically. |

### Party Dynamics in Combat

- All four party members are always in battle (no bench/reserves for a 4-person family)
- Each character has 4 special moves that unlock as they level up
- **Combo moves** (unlocked at higher levels): two characters combine for a powerful attack
  - John + Annie: *"Together"* — massive party heal
  - Obi + Luna: *"Chaos siblings"* — simultaneous attack on all enemies
  - Annie + Obi: *"Good boy"* — Obi gets a massive attack buff because Annie believes in him
  - John + Luna: *"Mutual respect"* — Luna actually listens to John for once, precision strike

---

## 7. Overworld Systems

### 7a. Tile Map & Movement

- **Tile size:** 32×32 pixels (standard for pixel RPGs at this scale)
- **Grid-based movement:** character moves tile-to-tile with smooth tweened animation (not instant snap)
- **Camera:** follows the active character, smooth scroll, bounded to map edges
- **Layer system:** ground tiles → decoration tiles → character/NPC layer → overlay tiles (roofs, tree canopy that fade when you walk under)

### 7b. Interaction System

- **Action button** (Space / Enter / tap): interact with whatever you're facing
- Context-sensitive: talk to NPC, examine object, pick up item, read sign, open chest
- Some interactions are character-specific (Annie can read John's thoughts, Obi can sniff a spot, Luna can climb a wall)

### 7c. Character Switching

- **Hotkey or menu** to switch the active character at any time in the overworld
- Non-active party members follow in a line behind (like Pokémon party following, or Chrono Trigger)
- Switching is instant — the camera follows the new active character
- Some puzzles require switching mid-solution (Obi digs a hole → switch to Luna → Luna drops through → Luna pushes a button from below)

### 7d. Inventory

- Simple grid inventory (items have icons and names)
- Categories: **Key Items** (quest-related, can't sell/drop), **Consumables** (healing, buffs), **Treasures** (sell for coins), **Gifts** (give to NPCs for side quests)
- Used in battle (consumables) and overworld (key items on specific interaction points)

### 7e. Save System

- Manual save at save points (rest stops, park benches, beds — thematic)
- Auto-save on area transitions
- localStorage-based (same as ACD)
- Multiple save slots (3)

### 7f. Dialogue System

- Text box at bottom of screen, character portrait on left
- NPC dialogue differs based on who you're controlling:
  - **John or Annie:** Normal human conversation
  - **Obi:** NPCs say "What a cute dog!" Obi's internal dialogue is earnest and simple. "This person smells like sandwiches. I trust them."
  - **Luna:** NPCs say "Oh, a cat!" Luna's internal dialogue is withering and superior. "This human's decor choices are... a choice."
- Dialogue choices (occasionally): Annie gets empathetic options, John gets practical options
- Animal-to-animal conversations: Obi and Luna can talk to animal NPCs and get information/quests the humans can't

### 7g. Character Perspective Shifts

When you switch the active character, the world subtly changes to reflect how that character perceives things. This is mostly cosmetic/dialogue, but it reinforces that each character has their own inner life.

- **Annie:** The default view. Warm, bright, full color. NPCs are friendly. The world is inviting. She notices beauty, people, and small kindnesses.
- **John:** Slightly more muted palette. He notices practical details — he can examine broken things, read maps, spot structural problems. His internal monologue is dry and observational. Objects Annie finds "charming," John finds "a liability."
- **Obi:** The world is EXCITING. Everything has a faint scent trail overlay. Food items glow. Squirrels are highlighted in red (THREAT). His internal monologue is joyful and guileless. Fire hydrants are fascinating. Every human is the best human he's ever met. The mailman is deeply suspicious.
- **Luna:** The world is beneath her. Everything has a slight cool-tone filter. High places are highlighted (OPPORTUNITY). Small moving things are highlighted (PREY). Her internal monologue is dry, judgmental, and occasionally accidentally profound. She rates everything silently. She would never admit she cares, but she does.

These perspective shifts aren't full visual overhauls — they're subtle tints, different interaction text, and unique internal monologue when examining objects. They reward switching characters just to see how each one reacts to the same thing.

### 7h. Environmental Storytelling

The world tells its own stories through details the player discovers, not through exposition.

- **The car** accumulates visual changes as the trip progresses. New bumper stickers from towns visited. A scratch from the Chapter 6 breakdown. Obi's nose prints on the back window.
- **Rooms tell stories.** John's parents' house in Galax has photos on the walls, a specific chair that's clearly "dad's chair," a fridge covered in magnets. Annie's parents' place has beach towels everywhere.
- **NPC routines.** NPCs in each town have simple daily routines — the baker is at the counter in the morning, sitting outside in the afternoon. This makes towns feel alive without complex AI.
- **Returning details.** If you befriended a creature in an earlier chapter, you might spot one of the same species in a later chapter, and it's friendly on sight. The world accumulates evidence that you were kind.
- **The pets react to environments.** Obi is visibly excited near water, nervous in dark areas, deliriously happy in open fields. Luna is calm everywhere except near the ocean (suspicious). These aren't dialogue — they're sprite animation changes and small behavioral tells.

---

## 7½. Mini-Activities

Short, optional activities embedded in the world that break up exploration and combat. These aren't full minigames — they're 1–2 minute diversions that add texture.

### Fishing

- Available at any body of water (ponds, rivers, the ocean at Myrtle Beach)
- Simple timing mechanic: cast → wait for nibble → press button at the right moment
- Different fish per region (Indiana catfish, Kentucky trout, mountain brook trout, Carolina sea bass)
- Fish can be sold, given to NPCs, or cooked
- **John has a fishing bonus** (accuracy, patience). **Obi sniffs out the best spots.**
- A "Fish Log" in the journal tracks every species caught

### Cooking / Campfire

- At rest stops and campgrounds, the family can cook a meal together
- Combine 2–3 ingredients into a consumable healing item
- Better ingredients = better results
- **Annie has a cooking bonus** (better output, occasional bonus items)
- Cooking triggers a short, charming animation of the family eating together — one of the game's coziest recurring moments
- Recipes are collectible — found in shops, given by NPCs, discovered by experimenting

### Photography

- Carried over from ACD's photo capture concept
- Annie (or any character) can take "photos" at scenic spots (marked with a subtle camera icon)
- Each photo is a small pixel art postcard-style image saved to the journal
- Scenic spots are placed at beautiful overlooks, funny moments, and emotional beats
- Collecting all photos in an area unlocks a small bonus (a decoration for the new house)

### Foraging / Collecting

- Each area has 3–5 regional collectibles hidden in the environment
- Indiana: arrowheads. Kentucky: crystals. Appalachia: wildflowers. Carolina: seashells.
- **Obi's sniff** reveals hidden collectibles nearby
- Completing a regional set unlocks a decorative item for the Wilmington house
- Purely optional — gentle encouragement to explore every corner

### Roadside Games

- Occasional NPC-run activities at rest stops and towns
- Examples: a ring-toss game, a "guess the weight of the pumpkin" booth, a pie-eating contest
- One-off scripted interactions, not reusable systems — each unique to its location

---

## 8. Progression & Economy

### Currency: Road Trip Coins

- Found in the world, earned from battles, rewarded for quests
- Spent at shops in each town (consumables, accessories, gifts for NPCs)
- Generous economy — shopping should feel fun, not grindy

### Accessories

- Equippable items that provide small stat boosts and are visible on sprites
- Examples: Obi's blue bandana (starting item), Luna's star collar, Annie's sun hat, John's fishing cap
- Found as quest rewards, bought in shops, or discovered in hidden areas
- Purely positive — no trade-offs, just bonuses. Cozy game = no min-maxing anxiety.

### Quest Log

- Main quest always tracked (get to Wilmington)
- Side quests per area (3–5 per chapter)
- Simple checklist style — no complex branching
- Completing side quests rewards coins, accessories, XP, and occasionally Little Things

---

## 9. The Magic Layer

### Design Rule

The magic in this world is never explained. It's just *there*. Characters notice it but don't dwell on it. It's gentle, warm, and a little weird.

### Manifestations

- **Animals can talk to each other.** Obi and Luna have full conversations. Animal NPCs are characters. Humans can't quite hear it — they just see the pets being "cute."
- **Certain places shimmer.** Crossroads, old trees, bodies of water — they have a soft glow. Nothing happens when you examine them, but they feel alive.
- **The world responds to kindness.** This is a concrete, trackable mechanic (though the player should never see the numbers). Every kind action — befriending an enemy, completing a side quest, helping an NPC — adds to a hidden **Warmth** counter per area. As Warmth increases:
  - Flowers appear along paths that were bare
  - The color palette shifts subtly warmer
  - Background music adds instruments (a bare piano gets strings, then woodwinds)
  - Butterflies, fireflies, and birds appear in areas where there were none
  - NPCs who were standoffish become friendly; new dialogue unlocks
  - In the final chapter, the Warmth of every area you've visited is totaled. High total Warmth triggers extra details in the epilogue — more people at the housewarming, more decorations in the new house, a fuller credits montage.
- **Strangers are slightly impossible.** A shopkeeper who knows your name. A child who gives you exactly the item you need. A fox who speaks in proverbs. Nobody comments on how weird this is.
- **The car.** The family car is a character. It plays a song at exactly the right moment. It starts when it shouldn't be able to. It seems to know the way even when the GPS is wrong. In the scene where it breaks down (Chapter 6), fixing it feels like healing a friend, not repairing a machine. The car has no dialogue, no face, no anthropomorphism — it's just a car that loves its family. You know this without being told.

---

## 10. Art Pipeline — PixelLab + Aseprite (Research-Validated)

> Full details in the Style Guide. This is the summary.

### Tool Stack & Budget

- **PixelLab Tier 2 "Pixel Artisan"** — $24/mo × 3 months = ~$72. 3,000 credits/month. Aseprite plugin is the primary interface.
- **Aseprite** — $19.99 one-time. Palette enforcement, cleanup, animation editing, sprite sheet export.
- **Retro Diffusion Lite** — $20 one-time backup (Aseprite extension). For portraits or small sprites if PixelLab underdelivers.
- **Total ceiling: ~$112**

### Style Target

- **Resolution:** 64×64 tile grid, humans are 64×96 (1 tile wide, 1.5 tiles tall), Obi is 64×64, Luna is 48×64. All sprites are above PixelLab's 32×32 quality threshold so no re-canvasing is needed.
- **Native canvas:** 960×540 px, scaled 2× to 1920×1080
- **Palette:** Warm, cozy — earth tones, soft greens, warm yellows, sunset oranges. No pure black or white. Each chapter adds 3–5 local accent colors.
- **Style reference:** Stardew Valley meets Earthbound. Charming, slightly chunky, expressive faces.

### Workflow (Portrait-First Anchoring)

1. Generate Annie's **128×128 portrait** first — this is the true style anchor
2. Derive Annie's **64×96 overworld sprite** using portrait as style reference
3. Generate **8-directional rotation** using the "Rotate character" Pro tool
4. Generate **walk cycle** using skeleton animation (NOT text-based) with `fixed head → always`
5. Repeat for John, Obi, Luna — always anchored to the original portrait set
6. Generate tilesets via **Wang format** → Sprite Fusion → JSON export
7. Every asset goes through **Aseprite cleanup**: palette snap, manual fixes, tag organization, sprite sheet export

### Key Risks

| Risk | Mitigation |
|------|-----------|
| Luna (48×64) quality | Now above PixelLab's 32×32 threshold after the May 2026 resolution doubling — generate natively, no re-canvas. Retro Diffusion remains as fallback if drift appears. |
| Style drift after ~20 generations | Always re-anchor to original portraits, never to recent output. Forced palette. |
| 10–20% of animation frames need manual repair | Budget Aseprite cleanup time. Onion skinning to catch issues. |
| PixelLab cloud-only (outage = blocked) | Export all PNGs to local disk immediately after every generation. |

---

## 11. Technical Architecture

### Platform

- **Deployment:** GitHub Pages (static hosting, free, HTTPS)
- **Engine:** Custom HTML5 Canvas (same core tech as ACD, but properly structured)
- **Module system:** ES modules (GitHub Pages serves over HTTP, so imports work)
- **No framework.** Vanilla JS, canvas 2D context. Keep it simple.

### Project Structure (Proposed)

```
homeward/
├── index.html              # Entry point
├── src/
│   ├── main.js             # Bootstrap, game loop
│   ├── engine/
│   │   ├── canvas.js       # Canvas setup, rendering helpers
│   │   ├── input.js        # Keyboard, mouse, touch
│   │   ├── camera.js       # Viewport scrolling
│   │   ├── audio.js        # Sound system
│   │   ├── state.js        # Game state manager
│   │   ├── cutscene.js     # Cutscene sequencer (camera, dialogue, movement)
│   │   └── save.js         # localStorage save/load
│   ├── world/
│   │   ├── tilemap.js      # Tile rendering + collision
│   │   ├── entity.js       # Base entity (characters, NPCs, objects)
│   │   ├── party.js        # Party management + following
│   │   ├── npc.js          # NPC behavior + dialogue triggers
│   │   └── transition.js   # Area transitions
│   ├── battle/
│   │   ├── battle.js       # Battle state machine
│   │   ├── actions.js      # Attack/special/item/flee logic
│   │   ├── befriend.js     # Befriend actions, friendliness meter, outcomes
│   │   ├── enemy-ai.js     # Enemy turn decisions
│   │   └── rewards.js      # XP, coins, drops
│   ├── ui/
│   │   ├── hud.js          # Health, coins, active character
│   │   ├── dialogue.js     # Text box system
│   │   ├── menu.js         # Pause, inventory, party stats
│   │   ├── inventory.js    # Item grid
│   │   ├── bestiary.js     # Creature journal (Obi/Luna voice entries)
│   │   └── journal.js      # Quest log + Little Things + Bestiary
│   ├── data/
│   │   ├── maps/           # JSON map files (from Tiled or custom editor)
│   │   ├── enemies.json    # Enemy stat definitions + befriend actions/thresholds
│   │   ├── items.json      # Item definitions
│   │   ├── recipes.json    # Cooking recipes
│   │   ├── fish.json       # Fish species per region
│   │   ├── collectibles.json # Regional collectibles per area
│   │   ├── quests.json     # Quest definitions
│   │   ├── dialogue/       # Dialogue scripts per area (character-variant)
│   │   ├── cutscenes.json  # Scripted cutscene sequences
│   │   └── thoughts.json   # All Little Things
│   └── characters/
│       ├── john.js         # John's stats, moves, ability logic
│       ├── annie.js        # Annie's stats, moves, warmth sense
│       ├── obi.js          # Obi's stats, moves, sniff/dig
│       └── luna.js         # Luna's stats, moves, climb/stealth
│   └── activities/
│       ├── fishing.js      # Fishing timing minigame
│       ├── cooking.js      # Campfire cooking / recipe system
│       ├── photography.js  # Scenic photo capture
│       └── foraging.js     # Regional collectible system
├── assets/
│   ├── sprites/            # Character sprite sheets
│   ├── tiles/              # Tileset images
│   ├── portraits/          # Dialogue portraits
│   ├── ui/                 # Menu/HUD elements
│   └── audio/              # Sound effects, music
└── tools/
    └── map-editor/         # If we build a simple map editor
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tile format | JSON (Tiled-compatible) | Tiled is a free, mature map editor. Export JSON, load in-game. |
| Sprite format | PNG sprite sheets | One image per character, frames laid out in a grid. Standard. |
| Dialogue format | JSON with branching | Simple tree structure. Easy to author, easy to extend. |
| State management | Single global state object | Same pattern as ACD's `store`. Works, keeps things simple. |
| Build step | None (ES modules, served by GH Pages) | No webpack, no bundler. Just files. Dev server for local testing. |

---

## 12. Milestone Plan

### Milestone 0 — Engine Foundation (the "walking around" milestone)
- [ ] Project scaffolding, ES module structure, game loop
- [ ] Tile map renderer (load JSON, draw tiles, collision layer)
- [ ] Player character (Annie) with 8-direction movement
- [ ] Camera follow + smooth scroll
- [ ] One test map (Wicker Park apartment interior, ~30×20 tiles)
- [ ] Basic interaction system (press Space near object → text box)
- **Deliverable:** Annie walks around a room, bumps into walls, reads a sign. Deployed to GitHub Pages.

### Milestone 1 — Party & Switching
- [ ] Party system (all four characters follow the leader)
- [ ] Character switching (hotkey or UI button)
- [ ] Character-specific interactions (Obi sniff spot, Luna climb point, John fix object)
- [ ] One outdoor test map with ability-gated areas
- **Deliverable:** All four characters walk around, switch between them, each accesses a different secret.

### Milestone 2 — Combat
- [ ] Battle transition (overworld → battle screen)
- [ ] Turn-based battle system (attack, special, item, flee)
- [ ] 2–3 enemy types with basic AI
- [ ] XP and leveling
- [ ] Victory/defeat handling
- **Deliverable:** Walk into tall grass, fight raccoons, level up.

### Milestone 3 — Dialogue & NPCs
- [ ] Dialogue system with portraits
- [ ] Character-dependent dialogue (different text for John/Annie/Obi/Luna)
- [ ] NPCs with dialogue trees
- [ ] Quest acceptance / completion flow
- **Deliverable:** Talk to an NPC, get a quest, complete it, get a reward.

### Milestone 4 — First Complete Chapter
- [ ] Chapter 0: Wicker Park fully built (apartment, street, 2–3 interiors)
- [ ] Tutorial flow (learn move, switch, talk, interact)
- [ ] First Little Things (3–4 in this area)
- [ ] Packing-up quest + saying goodbye to the neighborhood
- [ ] Transition to Chapter 1
- **Deliverable:** Playable 20–30 minute intro chapter.

### Milestone 5 — Art Pipeline Validation & Content Pipeline
- [ ] PixelLab Tier 2 subscribed, Aseprite purchased
- [ ] Annie portrait (128×128, neutral) generated and approved as style anchor
- [ ] Annie full pipeline: portrait → overworld sprite → 8-dir rotation → walk cycle → battle poses
- [ ] Luna native generation at 48×64 — evaluate quality. Decision gate: PixelLab or Retro Diffusion?
- [ ] John and Obi full pipelines, anchored to Annie portrait
- [ ] One tileset (Ch0 Wicker Park) generated via Wang format → Sprite Fusion → JSON verified in-engine
- [ ] Aseprite cleanup workflow validated: palette snap, tag organization, sprite sheet export + JSON
- [ ] Dialogue authoring workflow (write JSON → plays in-game)
- [ ] Build remaining chapters one at a time (1–2 per milestone)
- **Deliverable:** Repeatable, validated pipeline for cranking out new characters, areas, and tilesets. All four main characters fully sprited.

### Milestones 6–10 — Chapters 1–9
- Each chapter: map(s), NPCs, dialogue, quests, enemies (if applicable), Little Things, set pieces
- Rest chapters (Kentucky friend, Galax, Myrtle Beach, Epilogue) have no/light combat but need rich dialogue and side quests
- Roughly one chapter per milestone
- Playtest after each

### Milestone 11 — Polish & Release
- [ ] All Little Things written and placed
- [ ] Journal/scrapbook complete
- [ ] Menu screens (title, pause, save/load, credits)
- [ ] Music and sound effects
- [ ] Final playtest
- [ ] Deploy to GitHub Pages
- **Deliverable:** The finished game. Give it to Annie.

---

## 13. Resolved & Remaining Questions

### Resolved

1. **Music:** Procedural Web Audio, evolved from ACD's system. Reworked to fit the RPG — area-specific themes, battle music, rest chapter ambient tracks. The Warmth system adds instruments dynamically as areas brighten.
2. **Map editor:** Tiled (free, established, exports JSON). No reason to build custom.
3. **Dialogue writing:** Claude drafts all dialogue and story, John edits/polishes. The Little Things are co-written — Claude proposes, John validates for authenticity.
4. **Scope flex:** Piedmont chapter cut. Kentucky stays (now includes John's best friend as a key NPC). 10 chapters total (0–9 including epilogue). Further cuts if needed: Chapter 2 (Small-Town Indiana) is the most cuttable remaining. Never cut Kentucky (friend), Galax (John's parents), Myrtle Beach (Annie's parents), or the Epilogue.
5. **Mobile support:** Desktop first. Mobile (touch controls) after desktop is stable.
6. **Art pipeline:** PixelLab Tier 2 confirmed as primary tool ($24/mo × 3 months). Aseprite ($20) for cleanup/export. Retro Diffusion Lite ($20) as backup for portraits and Luna. Portrait-first anchoring workflow. 32×32 tiles confirmed (PixelLab sweet spot). See Style Guide §8 for full validated pipeline.
7. **Game title.** Homeward.

### Still Open

1. **The Kentucky friend's name.** Use real name or fictionalize? (Probably fictionalize for the game, but base on reality.)
2. **Car breakdown scene.** Piedmont chapter was cut, but the car breakdown was a good comic beat. Move it to another chapter? Maybe the Kentucky → Appalachia transition?
3. **Hybrid art style.** John mentioned "pixel art / hybrid art" early on. The research supports a two-tier approach: 64×96 pixel art for overworld sprites, 128×128 pixel art for dialogue portraits (more detail, more expression). Both are pixel art but at different fidelity levels. True "hybrid" (mixing pixel art with high-res illustrated art) is not recommended — it's hard to make consistent and PixelLab doesn't support it.

---

## 14. What Makes This Special

This isn't a game about saving the world. It's a game about four living things in a car who love each other, driving toward something new, and finding magic in the ordinary miles between here and there.

The Little Things aren't a collectible mechanic. They're the reason the game exists. Every one of them should make Annie feel seen.

The befriend system isn't a pacifist gimmick. It's the game saying: kindness is always an option, and the world is better when you choose it.

The magic isn't the point. The family is the point. The magic is just the world agreeing.

And at the end, when both sets of parents are in the new house, and Obi is asleep on someone's foot, and Luna is judging everyone from the highest shelf — that's the whole game. That's the whole point. Everyone you love, in one place, and you built the road that got them there.
