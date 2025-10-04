# MimrAI

**MimrAI** is a story-first assistant for managing personal notes and tabletop RPG campaigns. It combines retrieval-augmented generation (RAG), generative storytelling, and multi-system mechanics translation, all accessible via Discord.

---

## Features

- **Story-first campaign notes** (arcs, NPCs, plot threads)  
- **Multi-system mechanics translation** (e.g., D&D → Legends in the Mist)  
- **Generative content**: NPCs, quests, encounters, and scenes  
- **Context-aware retrieval** from daily notes and campaign archives  
- **Discord conversational interface** with slash commands  

---

## Architecture Overview

MimrAI uses **Volatility-Based Decomposition**:

- **High Volatility**: raw notes, session logs, generated NPCs/quests  
- **Medium Volatility**: context node indexes (daily notes, player, DM archives)  
- **Low Volatility**: bot logic, RAG engine, query enrichment layer  

### Mermaid Architecture Diagram

```mermaid
flowchart TD
    %% User
    subgraph User [User - You & Players]
        Q[User Query or Command]
    end

    %% Conversational Layer - Low volatility
    subgraph Conversational ["Conversational Interface Layer - Low volatility"]
        Mode["Mode Manager - Daily / DnD-Player / DnD-DM"]
        Cmds["Command Processing - ask / summarize / npc / generate"]
    end

    %% Query Enrichment Layer - Low volatility
    subgraph Enrichment ["Query Enrichment Layer - System Adapter"]
        Intent["Detect Intent - Story or Mechanics"]
        Translate["Translate Mechanics - DnD to Legends"]
        Shape["Shape Prompt for LLM"]
    end

    %% Context Nodes - Medium volatility
    subgraph Context ["Context Nodes - Medium volatility"]
        PlayerIdx["Player / character index"]
        DMIdx["DM / campaign index"]
    end

    %% Content Sources - High volatility
    subgraph Content ["Content Sources - High volatility"]
        Notes["Markdown / Obsidian / Notion - daily notes"]
        NPCs["NPCs / Quests / Taverns - generated & evolving"]
        Sessions["Session logs - session notes"]
    end

    %% RAG Engine - Low volatility
    subgraph Engine ["RAG Engine - Low volatility"]
        Embed["Embeddings and Vector DB"]
        Retrieve["Context retrieval"]
        Generate["LLM generation"]
    end

    %% Core flows
    Q --> Conversational
    Conversational --> Mode
    Mode --> Cmds
    Cmds --> Enrichment
    Enrichment --> Context
    Context --> Embed
    Embed --> Retrieve
    Retrieve --> Generate
    Generate --> Conversational

    %% Content -> Indexing -> Embed
    Notes --> DailyIdx
    NPCs --> DMIdx
    Sessions --> DMIdx

    DailyIdx --> Embed
    PlayerIdx --> Embed
    DMIdx --> Embed

    %% Generated artifacts get saved back into campaign index
    Generate --> NPCs
    Generate --> DMIdx
````

---

## Example Commands

* `/ask <query>` – Retrieve info from notes or campaign
* `/summarize` – Summarize daily notes or story arcs
* `/npc <name>` – Generate or retrieve NPCs
* `/generate scene` – Produce narrative scenes or hooks
* `/mechanics npc <name>` – Optional system-specific mechanics output

---

## Getting Started

1. **Install Dependencies**

   * Python 3.10+, `discord.py`, `langchain`, `chromadb`

2. **Set Up Discord Bot**

   * Create a bot in the Discord Developer Portal and configure the token

3. **Index Notes**

   * Point MimrAI to your Markdown, Obsidian, or Notion content and build embeddings

4. **Run the Bot**

   * Start the Discord bot and interact via your server channels

---

MimrAI turns your notes and campaign materials into a **living, interactive assistant**, blending story, memory, and generative content in one system.

