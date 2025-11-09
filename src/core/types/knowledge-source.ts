import { KnowledgeNode } from '../types/knowledge';
import { ObsidianNote } from '../types/obsidian';

export interface KnowledgeSourceAdapter {
    /** Connect to the knowledge source */
    connect(): Promise<void>;
    
    /** Read content from the source */
    read(path: string): Promise<string>;
    
    /** Write content back to the source */
    write(path: string, content: string): Promise<void>;
    
    /** Watch for changes in the source */
    watch?(callback: (path: string) => void): void;
    
    /** List all available content */
    list(): Promise<string[]>;
}

export interface KnowledgeProcessor {
    /** Convert source-specific content to KnowledgeNode */
    toKnowledgeNode(content: string, metadata?: Record<string, unknown>): Promise<KnowledgeNode>;
    
    /** Convert KnowledgeNode back to source-specific format */
    fromKnowledgeNode(node: KnowledgeNode): Promise<string>;
}

export interface ObsidianProcessor extends KnowledgeProcessor {
    /** Parse Obsidian-specific markdown features */
    parseNote(content: string): Promise<ObsidianNote>;
    
    /** Handle wiki-links and other Obsidian syntax */
    resolveLinks(note: ObsidianNote): Promise<ObsidianNote>;
    
    /** Extract frontmatter metadata */
    extractFrontMatter(content: string): Record<string, unknown>;
}
