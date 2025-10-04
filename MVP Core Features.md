# MimrAI Campaign Partner MVP – Core Features

The MVP focuses on **proving system flexibility** while providing **practical value to DMs and players**. Each core feature emphasizes the **underlying processes** that enable the system to deliver meaningful, consistent, and story-first outputs.

---

## 1. Generation
- **Entity Identification:** Determine the type of content to generate (NPC, scene, quest, item) based on user input or system prompts.  
- **Attribute Construction:** Define characteristics, relationships, stats, lore, and narrative hooks for generated entities.  
- **Contextual Enhancement:** Incorporate story context, prior content, and system-specific mechanics to enrich the generated content.  
- **Iterative Refinement:** Use LLM feedback loops to ensure coherence, richness, and alignment with ongoing story arcs.  

**Key Goal:** Provide **rich, dynamic content** through a structured, context-aware process, making data and information **meaningful and engaging**.

---

## 2. Structuring
- **Content Categorization:** Automatically classify generated or imported content into NPCs, Scenes, Quests, Items, or other categories.  
- **Metadata Assignment:** Attach standardized metadata (e.g., tags, relationships, system stats, story context) to all stored content.  
- **Index Preparation:** Format content for embedding into the RAG engine to support retrieval and enrichment.  

**Key Goal:** Keep content **well-structured and metadata-rich**, supporting retrieval, enrichment, and extensibility.

---

## 3. Relation
- **Entity Linking:** Detect and establish relationships between content entities (NPCs → locations/factions/quests, Scenes → story arcs).  
- **Contextual Mapping:** Maintain connections between new and existing content to preserve story continuity.  
- **Consistency Verification:** Ensure retrieved or generated content aligns with previously stored relationships and story state.  

**Key Goal:** Ensure **data and information remain internally consistent**, and relationships are preserved **across sessions**, maintaining a coherent campaign world.

---

## 4. Summarization
- **Context Extraction:** Analyze session logs, NPCs, scenes, and items to identify key entities and events relevant to the current query.  
- **Relevance Filtering:** Select the most important information based on story impact, player actions, and prior content relationships.  
- **Narrative Synthesis:** Combine extracted and filtered information into coherent summaries that preserve story continuity and relationships.  
- **Consistency Reinforcement:** Cross-check new summaries against previously generated content to maintain internal consistency across sessions.  
- **Cognitive Load Reduction:** Structure summaries to highlight essential details, minimizing unnecessary repetition or overload for users.  

**Key Goal:** Enable **context-aware, process-driven summarization** that keeps information consistent and reduces cognitive load, supporting DMs and players in managing complex storylines.

---

## 5. Commands (Discord Interface)
- **Command Parsing:** Interpret user input and detect intent (e.g., generate NPC, summarize session, retrieve quest).  
- **Process Routing:** Route commands through the appropriate processes: Generation → Structuring → Relation → Summarization.  
- **Response Composition:** Assemble outputs from multiple layers (RAG retrieval, LLM generation, enrichment) into coherent messages.  
- **Interactive Feedback Loop:** Allow users to refine or expand outputs through follow-up commands.  

**Key Goal:** Make all functionality accessible in an **interactive, conversational format**, while ensuring processes deliver structured, context-aware results.

---

## Integration with Architecture

| Feature | Process Layer / Component |
|---------|-------------------------|
| Generation | LLM / Query Enrichment / RAG Engine |
| Structuring | RAG Engine / Vector DB / Metadata Layer |
| Relation | RAG Engine / Embeddings / Context Mapping |
| Summarization | LLM / RAG Retrieval / Context Extraction & Synthesis |
| Commands | Conversational Layer (Discord / Local Interface) |

> This MVP demonstrates the **flexibility of MimrAI**, solving practical DM and player problems around **story consistency, information retrieval, and content generation**, while leaving room for future **knowledge management expansion**.
