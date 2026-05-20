Architectural specification and step-by-step deployment strategy for a browser-based narrative engine via AI-assisted development 

Fundamental concept and technology stack selection 

Designing a modern browser engine for narrative card games requires a radical rethinking of traditional approaches to interactive media development. An analysis of the initial requirements demonstrates the need to create a lightweight environment, independent of heavy servers, driven entirely by text configuration files. The main goal is to form a storytelling constructor functioning as a single hub for user-generated content (UGC), where users can seamlessly switch between consuming content and creating it. To minimize the entry barrier and ensure instant launch on any devices, including mobile platforms with limited bandwidth, the architecture completely excludes the use of heavy game engines like Pixi.js, Phaser, or Godot Web.

Instead of traditional Canvas solutions, the game board rendering is based on pure Scalable Vector Graphics (SVG) and Cascading Style Sheets (CSS Grid) technologies. This approach guarantees a zero-weight graphic core, allowing the hexagonal grid to be rendered based solely on terrain text markers extracted from the `map.json` configuration file. The grid's mathematical model relies on axial coordinates, enabling efficient calculation of neighboring nodes for entity movement.

The client logic is built around the Vue 3 framework using the Composition API and strict TypeScript typing. Vue 3's reactive system is ideal for instantly processing changes in hidden numerical parameters (such as the hidden counter $S$ ) and managing complex interface states, including game loop phases and inventory. TypeScript performs a critical function of protecting against algorithmic errors and artificial intelligence hallucinations during the code generation stage by strictly fixing data contracts for JSON files.

The deployment strategy for this architecture via the `claude-cli` command-line interface requires a strict phased separation. Development begins with isolating the infrastructure layer, moves to creating a local game loop state machine, expands to a full-fledged multi-scenario routing system, and concludes with integration with a cloud Backend-as-a-Service (BaaS) database. Each stage is accompanied by an in-depth architectural justification and the formation of a comprehensive prompt designed to transfer context to the generative language model.

---

Stage 1: Infrastructure foundation and continuous integration 

The first development stage is completely abstracted from business logic and game mechanics, focusing exclusively on creating a reliable engineering foundation.

For a platform oriented towards user-generated content, it is critically important to ensure continuous delivery of updates (CI/CD) that remains transparent to the end user. GitHub Pages is selected as the hosting platform, providing free hosting for the compiled static frontend. The build process is delegated to the Vite tool, which provides extremely fast hot module replacement during local development and optimal asset minification when preparing for production deployment.

Pipeline automation is achieved through the use of GitHub Actions. With each commit of changes to the main repository branch, the virtual environment automatically installs dependencies, performs static code checking via ESLint, compiles TypeScript files, and deploys the `dist` directory to a dedicated `gh-pages` branch. This architecture ensures that the project is distributed across a global content delivery network (CDN), ensuring instant loading even on devices with low performance.

Special attention at this stage is given to the TypeScript configuration. Strict mode (`strict: true`) is not just a recommendation, but an architectural requirement.

Considering that subsequent stages will be generated using an LLM, strict typing prevents implicit type casting and ensures that data structures for maps, events, and triggers will conform to predefined interfaces. Below is the specified prompt for initializing the first stage via `claude-cli`.

> Act as a Lead Frontend Architect. Your task is to design and initialize the infrastructure foundation for a browser-based card narrative engine.
> The project must not contain game business logic at this stage. The final result should be a fully configured static environment built via Vite and automatically deployed to GitHub Pages via a CI/CD pipeline.
> The platform's technology stack is strictly fixed: * Framework: Vue 3 (Composition API, `script setup` syntax).
> * Language: TypeScript with strict mode strictly enabled to prevent hallucinations in future data contracts.
> * Bundler: Vite.
> * Code quality tools: ESLint, Prettier.
> * Deployment environment: GitHub Pages via GitHub Actions.
> Generate a comprehensive sequence of bash commands to initialize the project based on the `vue-ts` template, install the necessary dependencies, and configure the Git repository.
> After that, provide the full source code for the following critical configuration files.
> The `vite.config.ts` configuration file must include dynamic definition of the base path (`base` property), depending on an environment variable, to ensure correct routing of static files when deploying to a subdirectory of the repository on GitHub Pages.
> The `tsconfig.json` configuration file must be set to maximum strictness, including forbidding the implicit `any` type, strict null-value checking, and strict function binding.
> The pipeline file `.github/workflows/deploy.yml` must describe the process triggered by a push to the `main` branch.
> This process should use the `actions/checkout` action, set up the current LTS version of Node.js, run the build via `npm run build`, and publish the contents of the `dist` folder to the `gh-pages` branch using `peaceiris/actions-gh-pages`.
> Also design the basic directory structure inside the `src` folder, preparing empty folders for `components`, `views`, `store`, and `types`, to lay the foundation for the next stage.
> Create a minimal valid `App.vue` component that outputs the formatted text "System initialized. Ready to load game core modules" to the screen.
> Your response must be structured as a step-by-step guide for executing the initialization without adding unnecessary game elements.
> 
> 

---

Stage 2: Isolated game loop core and local state 

The second stage represents the most complex architectural transition, consisting of the software implementation of a state machine controlling the gameplay.

According to the initial requirements, at this stage, the system functions in complete isolation from external databases. All information is stored exclusively in the browser's `localStorage`. The platform operates in single-user mode (the current client in the browser) without an authorization system.

A critical constraint of this stage is the presence of a single test scenario that is automatically loaded in both editor mode (Edit View) and game mode (Game View).

To ensure the purity of mechanics testing, each transition into game mode must be accompanied by a complete reset of the reactive state to its initial configuration parameters, erasing the progress of the previous session.

Deconstruction of game loop phases and grid mathematics 

The game loop is deconstructed into four strict algorithmic phases, the management of which is delegated to a reactive store. Interaction begins with a coordinate grid representing SVG polygons.

Using pure SVG instead of Canvas allows binding standard DOM events (e.g., `@click`) directly to the hexes.

| Game Phase | State Machine Mechanics and Vue 3 Reactivity 

 |
| --- | --- |
| Phase 1: Basic Movement | The player selects an adjacent hex on the grid. The movement method validates the distance, updates the entity's local coordinates, and reads the event identifier (`event_id`) attached to the new hex. The engine extracts the event data from the event pool array and outputs the narrative text. 

 |
| Phase 2: Blind Draw | The movement interface is blocked. The user applies Drag-and-Drop technology (via Vue.Draggable) to move cards from the hand component to the active zone. The cards contain only text narrative elements, hiding numerical weights. Playing cards iteratively modifies the hidden counter $S$ in the reactive store without visual display of these changes. 

 |
| Phase 3: Accepting Consequences | The user initiates calculation by pressing the confirmation button. The engine compares the final value $S_{final}=$ with the event's difficulty threshold. Depending on the result (failure, success, critical success), the system modifies the player's numerical resources and updates the text interface. 

 |
| Phase 4: Narrative Intervention (Meta-trigger) | With a set frequency, the engine interrupts the standard loop, generating a mandatory narrative card. The player is forced to drag this card onto any available hex of the SVG grid. This action permanently mutates the card object in `localStorage`, overwriting the terrain text marker and `event_id`. 

 |

System monitoring architecture 

The platform separates numerical resources from unique narrative items. Numerical indicators (such as health or gold) are stored as simple reactive counters, preventing the inventory interface from being cluttered with identical cards. To implement asynchronous game interruption, the `EndGameManager` module is used, operating on the Observer pattern.

Utilizing built-in `watch` and `watchEffect` mechanisms in Vue 3, this manager continuously tracks mutations in numerical resources.

Upon reaching a critical threshold, the manager instantly stops the game loop and initiates the session end screen.

In parallel, the `SystemNotificationManager` functions, intercepting interface control to display system messages or tutorial hints. This component renders modal windows on top of the game board, strictly blocking any interactions with the SVG grid or inventory until the user explicitly confirms reading. Below is the prompt for generating this complex system.

> Act as a Game Logic Engineer and a Vue 3 expert. Your task is to develop the core of the card narrative engine.
> Databases and authentication do not exist at this stage. All information is saved in `localStorage`.
> There is only one user in the system and exactly one test scenario, which is hardcoded into the logic and automatically opens in two modes: Game View and Edit View.
> Critical condition: every time the Game View component is mounted, the scenario must start from scratch, completely resetting progress to the initial configuration data.
> Implement strict TypeScript interfaces in the `types` directory.
> * The `MapConfig` interface should describe a two-dimensional array or list of cells, where each cell contains X and Y coordinates, a terrain text tag, `event_id`, and a boolean `is_revealed` flag.
> * The `PlayerDeck` interface should describe an array of cards, where each card has a unique identifier, narrative text description (without visible numerical parameters), and type (standard or narrative).
> * The `EventPool` interface should contain an array of possible events, including a text description, a hidden numerical difficulty value, and `success_outcome` and `fail_outcome` objects describing resource changes.
> * The `GameState` interface must record the player's current resources, active game loop phase, array of cards in hand, position on the map, and the hidden calculation counter ($S$).
> Design a state management system using the Composition API (or Pinia).
> The state must be initialized by reading the single test scenario from `localStorage`, and in its absence, create a default mock scenario object.
> Implement a state machine for the four phases of the game.
> * Phase 1: Upon clicking an adjacent SVG polygon, update the player's coordinates and extract text from `EventPool`.
> * Phase 2: Use the `vuedraggable` library to move cards from the hand array to the active zone array, which reactively and covertly increases the $S$ parameter.
> * Phase 3: A confirmation method that compares the $S$ parameter with the event difficulty, updates resources, and clears the active zone.
> * Phase 4: Logic for issuing a narrative card, blocking movement until the card is dragged onto a grid hex, causing properties of this cell to be overwritten in local storage.
> Design the `EndGameManager` module using the `watch` function to monitor resource states.
> If a resource drops to zero, generate a game over event.
> Design a global `SystemNotificationManager` component that subscribes to system events and renders modal windows that block the rest of the UI.
> Develop UI components.
> * The `HexGrid` component must accept the map configuration array and mathematically calculate axial coordinates to render `polygon` tags within a single SVG container without using third-party graphics engines.
> * The `PlayerHand` component must display cards and support Drag-and-Drop mechanics.
> * The `EditorView` component should be a form for editing the JSON tree of this single scenario, serializing the data, and writing it over the old ones in `localStorage` upon saving.
> Provide the complete store code, the polygon calculation mathematics for SVG, and the structure of the main Game View component linking all these modules.
> 
> 

---

Stage 3: Routing, UGC ecosystem, and multi-scenario management 

The third stage transforms the isolated prototype into a full-fledged UGC platform architecture. Shifting from the concept of a single hardcoded scenario to supporting multiple stories requires introducing a routing system based on `vue-router`.

The navigation structure is divided into three specialized zones, ensuring a seamless user experience when switching between content consumption and creation.

The first zone is the Main Page (Story Catalog), which serves as the platform's storefront.

Here, mechanisms for sorting by user ratings and filtering by genre tags (e.g., fantasy, detective, horror) are implemented. The second zone is the Game Client (Player), which is loaded via a dynamic route.

The third zone is the Browser Editor (Visual Constructor), which now requires a preliminary scenario selection screen to edit or create a new empty structure.

Data structure transformation and visual constructor 

The data model in local storage undergoes significant changes. Instead of a single scenario object, an array of `stories` objects is formed.

| Story Structure Field | Purpose in the Ecosystem Architecture 

 |
| --- | --- |
| `id` | Unique identifier (UUID) for routing and data binding. 

 |
| `metadata` | An object containing the title, array of genre tags, author's name, and aggregated rating. Used exclusively by the Catalog for quick card rendering without parsing heavy configurations. 

 |
| `mapData` | Serialized representation of the `map.json` file, describing axial coordinates and terrain markers. 

 |
| `eventsData` | Serialized representation of the `events.json` file with a pool of text checks and triggers. 

 |
| `playerDeck` | Serialized representation of the `player_deck.json` file containing the starting set of movement and action cards. 

 |

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
> 
> 

---

Stage 4: Cloud infrastructure, Backend-as-a-Service, and authorization system 

The final stage of architectural evolution marks the transition from a local prototype to a globally distributed production environment.

Replacing the browser's local storage with a remote server infrastructure is carried out by integrating the Supabase platform.

The choice of this solution in the Backend-as-a-Service category is due to its fundamental architecture, based on a powerful PostgreSQL relational database, and built-in modules for authentication and object file storage, perfectly correlating with the engine's "one folder equals one story" paradigm.

Using BaaS preserves the "thin backend" concept. The server side does not contain complex game logic in Node.js or Python;
its area of responsibility is strictly limited to performing basic Create, Read, Update, and Delete (CRUD) operations, as well as distributing static files. This provides a radical reduction in costs for maintaining server infrastructure and guarantees system scalability.

Designing the relational schema and object storage 

Project data is conceptually divided into structured metadata and unstructured configuration arrays.

Story metadata, user profiles, and text reviews are placed in PostgreSQL tables.

Since the volume of a single metadata record does not exceed 1 kilobyte, using a database provides the highest performance when forming the Catalog. Heavy configuration files (`map.json`, `events.json`, `player_deck.json`), the weight of which varies between 10–50 kilobytes, are uploaded into a specialized Supabase Storage bucket.

| PostgreSQL Table | Structure and Key Relations 

 |
| --- | --- |
| `profiles` | Contains `id` (UUID, primary key, references `auth.users`) and a text field `username`. 

 |
| `stories` | Contains `id` (UUID), `author_id` (UUID, foreign key to `profiles`), text array `tags`, aggregated `rating`, and `json_url_path` (string pointer to the directory in the Storage bucket). 

 |
| `reviews` | Contains unique `id`, `story_id`, `user_id`, numeric score `score`, and a text comment. 

 |

Game session architecture is optimized to minimize network latency. When selecting a story in the Catalog, the frontend executes a lightweight query to the `stories` table.

Pressing the start button initiates the asynchronous downloading of JSON files from Supabase Storage directly into the browser's RAM. After the download is complete, a network connection with the backend is no longer required. The entire game loop, including calculating the grid's mathematical model, computing the hidden counter $S$,
and monitoring via `EndGameManager`, is executed locally by the Vue 3 engine, entirely eliminating the impact of ping on the gaming experience. Authorized users can asynchronously send session results or text reviews back to the `reviews` table.

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
> 
> 

---

Sources 

* Design Document: Universal Card Narrative Engine V2 


* Game Idea 


* Technology Stack
