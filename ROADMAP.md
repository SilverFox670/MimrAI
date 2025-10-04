# MimrAI Roadmap

MimrAI is a flexible assistant designed to **support knowledge management**, with distinct roles:

## 1. Campaign Partner (MVP)

The MVP serves as a **fun, proof-of-concept**, demonstrating the flexibility of the system while solving **common DM and player challenges**, such as:

- **Consistency of information** across sessions  
- Easy retrieval of NPCs, items, and story elements  
- Generating scenes, encounters, and quests dynamically  

**Core Capabilities:**

- **Content Creation & Retrieval**:  
  - Helps organize and retrieve **notes, characters, scenes, items, or other campaign content**.  
  - Uses **retrieval-augmented generation (RAG)** for interactive querying of campaign details.

- **Response Enrichment**
  - Applies **focused enrichment** to retrieved information to help **adapt content to system mechanics** (e.g., D&D, Legends in the Mist).  

- **Interactive Assistance**:  
  - Provides **DM and player support** via Discord or an optional local interface.  
  - **Story-first**, fun, and immediately useful during sessions.

> The MVP is not only a tool for gameplay—it **validates the architecture** for future expansions, including full knowledge management.

---

## 2. Architecture Overview (Campaign Partner MVP)

**Volatility-Based Decomposition for MVP:**

| Layer | Role | Volatility |
|-------|------|------------|
| **User Interface** | Discord / Web UI | Low |
| **Conversational Layer** | DM / Player mode, command parsing | Low |
| **Query Enrichment** | Story-focused prompt shaping; optional mechanics adapter | Low |
| **RAG Engine** | Store & retrieve campaign content (NPCs, scenes, quests, items) | Medium |
| **Content Sources** | Generated or user-provided campaign content | High |

**Mermaid Diagram: Campaign Partner MVP**

```mermaid
flowchart TD
    %% User Devices
    subgraph Devices ["User Devices"]
        PlayerLaptop[Laptop / Tablet / Mobile]
        DiscordClient[Discord / Web UI]
    end

    %% Conversational Layer - Low Volatility
    subgraph Conversational ["Conversational Layer - Low Volatility"]
        Mode["Mode Manager - DM / Player"]
        Cmds["Command Processing - /npc, /generate scene, /summarize session"]
    end

    %% Query Enrichment - Low Volatility
    subgraph Enrichment ["Query Enrichment Layer - Story Focused"]
        Intent["Detect Intent - Story / Scene / NPC"]
        Shape["Shape Prompt for Narrative Generation"]
        MechanicsAdapter["Optional Mechanics Adapter (future)"]
    end

    %% RAG Engine - Medium Volatility
    subgraph RAG ["Campaign Content Storage"]
        Embed["Embeddings / Vector DB for NPCs, Quests, Scenes, Items"]
        Retrieve["Context Retrieval"]
        Generate["LLM Narrative Generation"]
    end

    %% Content Sources - High Volatility
    subgraph Content ["Generated Campaign Content"]
        NPCs["NPCs / Quests / Taverns"]
        Sessions["Session Logs"]
        Scenes["Generated Scenes / Encounters"]
        Items["Items / Artifacts / Props"]
        NotesPlaceholder["(Optional knowledge management integration in future)"]
    end

    %% Device Flows
    PlayerLaptop --> DiscordClient
    DiscordClient --> Conversational
    Conversational --> Mode
    Mode --> Cmds
    Cmds --> Enrichment
    Enrichment --> RAG

    %% RAG Engine -> Content
    NPCs --> Embed
    Sessions --> Embed
    Scenes --> Embed
    Items --> Embed
    NotesPlaceholder --> Embed

    Embed --> Retrieve
    Retrieve --> Generate

    %% LLM output back to Conversational Layer
    Generate --> Conversational
    Conversational --> DiscordClient
````

---

## 3. Roadmap & Next Steps

### Phase 1: Campaign Partner MVP

1. **Prototype Content Creation & Retrieval**

   * Hardcode sample NPCs, scenes, and items.
   * Test Discord command flow (`/npc`, `/generate scene`, `/summarize session`).

2. **Implement RAG Engine**

   * Store generated content for retrieval and context continuity.

3. **Build Query Enrichment Layer**

   * Story-focused prompt shaping.
   * Mechanics adapter stub for future system adaptation.

4. **Discord Bot MVP**

   * Interactive DM & player support.

5. **Folder Structure & Documentation**

   * Define storage for NPCs, sessions, scenes, items.
   * Provide contributor guide and onboarding instructions.

> **Purpose:** This phase **proves the flexibility of the architecture**, showing that content retrieval, generation, and enrichment work together while providing immediate value in gameplayitemsePhase 2: Knowledge Management Integration

* Expand MimrAI to support **personal note creation, retrieval, and enrichment**.
* Enable RAG-based interactive querying for **general knowledge management**.
* Optional web dashboard and multi-device sync.
* Advanced LLM features: narrative consistency, long-term memory, and collaborative collaborative workflows.

---


 ✅ Summary

* **Campaign Partner MVP:** Fun, story-first assistant demonstrating **system flexibility** and solving common DM/play problems.
* **Knowledge Management Partner (Future):** Extends the architecture to manage personal notes, research, and other knowledge.
* The architecture allows the MVP to be **practical, and extensible** for future expansions.


