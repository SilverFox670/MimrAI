// Core knowledge types
export interface KnowledgeNode {
    id: string;
    content: string;
    metadata: KnowledgeMetadata;
    embeddings?: Float32Array;
}

export interface KnowledgeMetadata {
    type: 'note' | 'npc' | 'scene' | 'session';
    source: string;
    created: Date;
    modified: Date;
    relationships: string[];
    tags?: string[];
    volatility: 'high' | 'medium' | 'low';
}

export interface ContentReference {
    nodeId: string;
    relevance: number;
    context: string;
}
