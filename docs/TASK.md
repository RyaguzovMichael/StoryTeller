Remaining roadmap for the browser-based narrative engine

Stages 1 (infrastructure/CI) and 2 (isolated game loop core, local
`localStorage`-only single-scenario state, 4-phase game loop, `EndGameManager`,
`SystemNotificationManager`, SVG hex grid, drag-and-drop hand, editor) are
implemented — see `CLAUDE.md` and `docs/DEVELOPMENT.md` for the current state
of that architecture, which has evolved somewhat from the original prompts
below.

What remains is Stage 3 (routing / multi-scenario UGC platform) and Stage 4
(Supabase backend). The prompts below are kept as a reference for the original
intent; per `CLAUDE.md`'s planning rules, actual implementation plans for these
stages should be expressed as contracts (types/signatures/module boundaries),
not executed as one large prose prompt.

## Deferred engine/type refactors (backlog)

Design intents raised during the engine cleanup, intentionally postponed:

- **Split `GameState` into static + runtime.** Separate the immutable
  scenario-reflection (storyId, metadata, event pool, narrative templates,
  interval, draw/hand limits) from the mutable runtime fields.
- **`GameState | EmptyState` at the type level (variant U).** Replace the
  `useGame` placeholder + view-local `ready` flag with a store value that is
  either empty (only at startup) or a guaranteed-ready `GameState`. Reworks the
  reactivity bridge (ref-swap instead of in-place `Object.assign`).
- **Branded id types.** Give entities with an `id` a dedicated type instead of
  bare `string`, so functions take a meaningful id type.
- **Card `text` → `title` + `description`.**
- **Drop `CardType`.** Cards should be a single uniform type; their difference
  is only *when* the player receives them (narrative intervention), not a stored
  kind.
- **Card effects as an abstraction.** Effects will be varied — model them as an
  abstract function/handler rather than ad-hoc `overwrite_*` fields.

### Gameplay tweaks

- **Another way to draw cards.** Currently the hand only refills after resolving
  an event (`drawCardCountPerTurn`). Consider an additional draw mechanic so the
  player can replenish the hand outside event resolution.
- **Notification / confirmation variants.** Every event currently requires an
  explicit confirm click, which is mildly annoying. Introduce different
  notification/confirmation modes (e.g. auto-resolve for some events, confirm
  only when it matters) instead of a blanket confirm.

---

Stage 3: Routing, UGC ecosystem, and multi-scenario management

The third stage transforms the isolated prototype into a full-fledged UGC platform architecture. Shifting from the concept of a single hardcoded scenario to supporting multiple stories requires introducing a routing system based on `vue-router`.

The navigation structure is divided into three specialized zones, ensuring a seamless user experience when switching between content consumption and creation.

The first zone is the Main Page (Story Catalog), which serves as the platform's storefront.

Here, mechanisms for sorting by user ratings and filtering by genre tags (e.g., fantasy, detective, horror) are implemented. The second zone is the Game Client (Player), which is loaded via a dynamic route.

The third zone is the Browser Editor (Visual Constructor), which now requires a preliminary scenario selection screen to edit or create a new empty structure.

Data structure transformation and visual constructor

The data model in local storage undergoes significant changes. Instead of a single scenario object, an array of `stories` objects is formed.

| Story Structure Field | Purpose in the Ecosystem Architecture |
| --- | --- |
| `id` | Unique identifier (UUID) for routing and data binding. |
| `metadata` | An object containing the title, array of genre tags, author's name, and aggregated rating. Used exclusively by the Catalog for quick card rendering without parsing heavy configurations. |
| `mapData` | Serialized representation of the `map.json` file, describing axial coordinates and terrain markers. |
| `eventsData` | Serialized representation of the `events.json` file with a pool of text checks and triggers. |
| `playerDeck` | Serialized representation of the `player_deck.json` file containing the starting set of movement and action cards. |

The functionality of the Visual Constructor is significantly expanded. To lower the entry barrier, authors are provided with a visual grid markup tool.

Instead of manually entering coordinates, the author interacts with a graphic representation of the SVG map.

Clicking the mouse on a specific cell (e.g., a hex with axial coordinates) opens a form to select a terrain tag (e.g., [Swamp]), which is automatically integrated into the `mapData` object. Upon initiating the publication process, the editor validates logical connections, compiles visual settings into a strict JSON structure, and updates the corresponding record in the `stories` array inside `localStorage`. Below is the prompt for integrating the router and expanding data structures.

> Act as an expert in Vue Router architecture and state management.
> Your task is to scale the existing application by adding routing and support for multiple scenarios, forming a prototype of a UGC platform.
> The database is still absent, all information is saved in `localStorage`, but the storage structure changes from a single object to an array of stories.
> You need to install and configure `vue-router` with the following path configuration.
> * The root route (`/`) should point to the `CatalogView` component, displaying a list of all stories.
> * The dynamic route (`/game/:id`) should point to the `GameView` component to launch a specific scenario.
> * The route (`/editor/`) should point to the `EditorSelectorView` component, providing a choice of story to edit or create a new one.
> * The dynamic route (`/editor/:id`) should point to the updated visual constructor component `EditorView`.
> Modify the data structure. Create a TypeScript `Story` interface, including a unique `id`, a `metadata` object (with `title`, `tags`, `rating` fields), and nested `mapData`, `eventsData`, `playerDeck` configurations.
> Write an initialization function that, upon the application's first launch, checks for the presence of the `stories` array in `localStorage` and, if it is empty, generates two mock stories for demonstration.
> Develop the logic for the `CatalogView` component. It must fetch the array of stories, render cards based on the `metadata` object, provide a filtering interface by tags array, and sorting by the `rating` field.
> Each card must contain a navigation button initiating a transition to the `/game/:id` route.
> Refactor the `GameView` component. Upon mounting, the component should extract the `id` parameter from the route object, find the corresponding story in `localStorage`, and pass the extracted `mapData`, `eventsData`, and `playerDeck` structures into the reactive store to initialize the game loop from scratch.
> Refactor the editor components. The `EditorSelectorView` component should render a list of available stories with "Edit" and "Create New" buttons.
> The `EditorView` component must load a story via the passed `id`. Integrate an interactive SVG map into the editor, allowing the author to click on hexes and assign terrain text tags via a dropdown list.
> Implement a "Publish" method that collects all changes into a single valid `Story` object and atomically updates the array in `localStorage`.
> Provide the complete router configuration code and updated logic for working with `localStorage`.

---

Stage 4: Cloud infrastructure, Backend-as-a-Service, and authorization system

The final stage of architectural evolution marks the transition from a local prototype to a globally distributed production environment.

Replacing the browser's local storage with a remote server infrastructure is carried out by integrating the Supabase platform.

The choice of this solution in the Backend-as-a-Service category is due to its fundamental architecture, based on a powerful PostgreSQL relational database, and built-in modules for authentication and object file storage, perfectly correlating with the engine's "one folder equals one story" paradigm.

Using BaaS preserves the "thin backend" concept. The server side does not contain complex game logic in Node.js or Python; its area of responsibility is strictly limited to performing basic Create, Read, Update, and Delete (CRUD) operations, as well as distributing static files. This provides a radical reduction in costs for maintaining server infrastructure and guarantees system scalability.

Designing the relational schema and object storage

Project data is conceptually divided into structured metadata and unstructured configuration arrays.

Story metadata, user profiles, and text reviews are placed in PostgreSQL tables.

Since the volume of a single metadata record does not exceed 1 kilobyte, using a database provides the highest performance when forming the Catalog. Heavy configuration files (`map.json`, `events.json`, `player_deck.json`), the weight of which varies between 10–50 kilobytes, are uploaded into a specialized Supabase Storage bucket.

| PostgreSQL Table | Structure and Key Relations |
| --- | --- |
| `profiles` | Contains `id` (UUID, primary key, references `auth.users`) and a text field `username`. |
| `stories` | Contains `id` (UUID), `author_id` (UUID, foreign key to `profiles`), text array `tags`, aggregated `rating`, and `json_url_path` (string pointer to the directory in the Storage bucket). |
| `reviews` | Contains unique `id`, `story_id`, `user_id`, numeric score `score`, and a text comment. |

Game session architecture is optimized to minimize network latency. When selecting a story in the Catalog, the frontend executes a lightweight query to the `stories` table.

Pressing the start button initiates the asynchronous downloading of JSON files from Supabase Storage directly into the browser's RAM. After the download is complete, a network connection with the backend is no longer required. The entire game loop, including calculating the grid's mathematical model, computing the hidden check total, and monitoring via `EndGameManager`, is executed locally by the Vue 3 engine, entirely eliminating the impact of ping on the gaming experience. Authorized users can asynchronously send session results or text reviews back to the `reviews` table.

Security system via Row Level Security (RLS)

Integrating the Supabase Auth module provides user registration via email or social network providers. Protection of user content is implemented directly at the PostgreSQL core level using the Row Level Security (RLS) mechanism.

RLS policies are configured so that the read operation (`SELECT`) from the `stories` table and Storage bucket is publicly accessible to any unauthorized visitors to the platform, guaranteeing free access to the gameplay.

However, modification operations (`INSERT`, `UPDATE`, `DELETE`) are strictly limited: the database allows a transaction to be executed only if the system variable `auth.uid()` matches the `author_id` field of the modified record, providing cryptographic protection of author stories from unauthorized alteration. Below is the final prompt for integrating the cloud infrastructure.

> Act as a Full-Stack Architect and Supabase integration expert.
> Your task is to complete the application's evolution by replacing the temporary `localStorage` with a real BaaS cloud infrastructure (Supabase) and introducing an authentication system.
> The platform remains static and is hosted on GitHub Pages, while the server logic is fully delegated to Supabase.
> The game loop must still be executed strictly locally in the browser after downloading configuration files.
> Integrate the Supabase client. Install the `@supabase/supabase-js` package and create a configuration file `src/services/supabase.ts` that initializes the client using the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
> Design the relational database schema and write SQL migration scripts to create the following tables in PostgreSQL.
> * Table `profiles`: fields `id` (link to `auth.users`) and `username`.
> * Table `stories`: fields `id`, `author_id` (link to `profiles`), `title`, `tags` (array), `rating`, `json_url_path` (path to the folder in storage).
> * Table `reviews`: fields linking user, story, score, and review text.
> Create instructions for initializing the `scenarios` bucket in Supabase Storage, which will store `map.json`, `events.json`, and `player_deck.json` files.
> Develop strict SQL security policies (Row Level Security).
> * For the `stories` table: the `SELECT` policy must be permitted for the `public` role (anonymous reading), and the `INSERT`/`UPDATE`/`DELETE` policies must check the condition `auth.uid() = author_id`.
> * For the `scenarios` bucket: reading is permitted to all, writing is permitted only to authorized users in directories corresponding to their identifier.
> Implement the user authorization interface. Create an `AuthModal.vue` component with registration and login forms based on the `supabase.auth.signInWithPassword` method.
> Configure reactive session tracking, saving the token and current user data in the global store.
> Refactor the frontend logic for API integration.
> * In the `CatalogView` component: replace reading from `localStorage` with an asynchronous request to the Supabase API (`supabase.from('stories').select('*')`).
> * In the `GameView` component: upon initialization, extract `json_url_path` from the parameters, initiate the downloading of JSON files via `supabase.storage.from('scenarios').download()`, parse the structure, and pass it to the local game engine.
> * Ensure that after loading, network requests for the game loop are not executed.
> * In the `EditorView` component: upon publication, collect the edited data, authorize, upload the generated `map.json`, `events.json`, and `player_deck.json` files to Storage via the `upload()` method, and save metadata to the `stories` table.
> Provide the complete SQL code for database migrations, RLS policy scripts, and updated code for load and save functions for frontend components.

---

Sources

* Design Document: Universal Card Narrative Engine V2
* Game Idea
* Technology Stack
