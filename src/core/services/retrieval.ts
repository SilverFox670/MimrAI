import { KnowledgeNode, ContentReference } from '../types/knowledge';

export interface RetrievalService {
    query(input: string, limit?: number): Promise<ContentReference[]>;
    similar(nodeId: string, limit?: number): Promise<ContentReference[]>;
    updateEmbeddings(node: KnowledgeNode): Promise<KnowledgeNode>;
}
