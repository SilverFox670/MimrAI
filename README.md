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
    %% User Devices
    subgraph Devices ["User Devices"]
        Laptop[Laptop / Local PC]
        Tablet[Tablet / Mobile]
        DiscordClient[Discord / Web UI]
    end

    %% Conversational Layer - Low Volatility
    subgraph Conversational ["Conversational Layer - Low Volatility"]
        Mode["Mode Manager - Daily / Player / DM"]
        Cmds["Command Processing - ask / summarize / npc / generate"]
    end

    %% Query Enrichment Layer - Low Volatility
    subgraph Enrichment ["Query Enrichment Layer - Low Volatility"]
        Intent["Detect Intent - Story or Mechanics"]
        Translate["Translate Mechanics - System Adapter"]
        Shape["Shape Prompt for LLM"]
    end

    %% RAG Engine - Low/Medium Volatility
    subgraph RAG ["RAG Engine"]
        Embed["Embeddings / Vector DB - Medium Volatility"]
        Retrieve["Context Retrieval - Low Volatility"]
        Generate["LLM Generation - Low Volatility"]
    end

    %% Content Sources - High Volatility
    subgraph Content ["Content Sources - High Volatility"]
        Notes["Local Notes (Markdown / Obsidian)"]
        NPCs["NPCs / Quests / Taverns"]
        Sessions["Session Logs"]
    end

    %% Optional Cloud - Low Volatility
    subgraph Cloud ["Optional Cloud Services - Low Volatility"]
        CloudDB["Cloud Vector DB / Index Mirror"]
        CloudLLM["Cloud LLM API"]
    end

    %% Device Flows
    Laptop --> DiscordClient
    Tablet --> DiscordClient
    DiscordClient --> Conversational
    Conversational --> Mode
    Mode --> Cmds
    Cmds --> Enrichment
    Enrichment --> RAG

    %% RAG -> Local or Cloud
    Notes --> Embed
    NPCs --> Embed
    Sessions --> Embed
    Embed --> Retrieve
    Retrieve --> Generate

    %% LLM paths
    Generate --> LLMLocal[Local LLM]
    Generate --> CloudLLM

    %% Optional cloud DB sync
    Embed --> CloudDB
    CloudDB --> Retrieve

    %% Return to user
    LLMLocal --> Conversational
    CloudLLM --> Conversational
    Conversational --> DiscordClient
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

