import { KnowledgeNode } from '../types/knowledge';

export interface EnrichmentService {
    enrich(node: KnowledgeNode): Promise<KnowledgeNode>;
    enrichQuery(query: string): Promise<string>;
    extractMetadata(content: string): Promise<Partial<KnowledgeNode['metadata']>>;
}
