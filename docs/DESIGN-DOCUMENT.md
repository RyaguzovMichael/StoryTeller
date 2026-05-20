# **Design Document: Universal Card Narrative Engine (Version 2)**

## **1. General Concept and Philosophy**

The primary goal is to create a story-building toolkit configured exclusively through text files, where one folder equals one story. The engine is a fully universal mediator, not tied to any specific genre. It operates solely on mathematical concepts: coordinates, entities (cards), variables, and conditions. Gameplay is built on an "Easy to Start" principle, where all internal numbers and parameters are hidden from the player behind artistic text descriptions, creating additional psychological tension and a focus on narrative.

To minimize the barrier to entry and build an initial audience, the platform is built as a fully **browser-based environment**. This turns the project into a unified UGC hub (User-Generated Content), where users can seamlessly switch between playing other people's stories and creating their own.

## **2. Game World Generation (Tag System)**

The field is a hex grid formed based on landscape tags rather than hard-coded events, allowing authors to easily configure the generator.

* **Map Markup:** Each cell in the matrix has only a text marker (e.g., \[Swamp\], \[Tavern\]).
* **Event Pool:** In the configuration file events.json, the author specifies which events can appear on a given tag and with what probability.
* **Initialization:** When the game starts, the engine iterates over the grid, rolls a virtual die, and associates each coordinate with a specific event ID from the pool matching the appropriate tag.

## **3. Game Loop and Hidden Check Mechanics**

The player's interaction cycle with a cell is divided into 4 strict phases:

| Phase | Phase Name | Engine Mechanics and Behavior |
| :---- | :---- | :---- |
| **Phase 1** | Basic Movement | The player moves their token to an adjacent cell. The engine reads the event ID linked to the hex and displays its artistic description on screen. |
| **Phase 2** | Blind Play | The player evaluates the situation by the text and plays cards from their hand. Cards have no visible parameters — only text is written on them. Each card adds hidden points to the event's system counter. |
| **Phase 3** | Accept Consequences | The player clicks the "Accept Consequences" button. The engine sums the hidden points from all played cards, compares them against the event's difficulty, and selects one of the hidden branches (Failure / Success / Critical Success). |
| **Phase 4** | Story Intervention (Meta-Trigger) | Every few turns, basic movement is blocked. The engine deals the player a "Story Card." The player must place it on the field, permanently rewriting the tag and base event of the chosen hex. |

## **4. Automation and Response Systems**

### **4.1. Reactive Ending System (EndGameManager)**

Game endings are not tied to the start or end of a turn. The engine operates on the Observer pattern (Event Listener), continuously listening to the system event stream, and can interrupt the game at any moment upon detecting triggers:

* **"Resource Change" Event:** Fires instantly when the numeric value of a resource changes. If a variable reaches a critical value set by the author, the game is interrupted with an ending screen.
* **"Coordinate Change" Event:** The player's token has moved to a specific final hex at a defined \[X, Y\].
* **"Card Added to Hand" Event:** A card ID marked as a final card is added to the hand array.

### **4.2. System Notification System (SystemNotificationManager)**

To support full in-game tutorials, hints, and notifications about hidden processes, the engine provides a mechanism for forced system windows (pop-ups).

Any game event, phase, or variable change can contain a system\_notifications array. When a trigger fires, the engine pauses execution of the current phase and renders a modal window with the author's text over the game interface. The game resumes only after the player clicks the confirmation button in the window.

## **5. Platform Ecosystem (UGC & Browser)**

Since the engine is fully universal and runs on JSON, the web interface is divided into three key zones:

* **Story Catalog:** The platform's main page. Sorting by rating, reviews, tags (fantasy, detective, horror), and authors. Provides instant launch of any story without downloading.
* **Game Client (Player):** A lightweight web frontend that parses the JSON files of the selected story and renders the interface: the game field, card hand, hidden resources, and text canvas.
* **Browser Editor (Visual Constructor):** A tool for creating content without writing code.
  * **Simple Table and Form Interface:** At the initial stage, authors are provided with table and form input to fill in card parameters, landscape tags, and conditions.
  * **Grid Markup Tool:** A visual map where the author can set cell tags by clicking (e.g., click on cell \[0,2\] → select tag \[Swamp\]).
  * **Export to JSON:** Via the "Publish" button, the editor automatically validates logical links, compiles data into a JSON file structure, and uploads the story to the shared platform database.
