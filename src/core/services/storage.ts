import { KnowledgeNode } from '../types/knowledge';

export interface StorageAdapter {
    store(node: KnowledgeNode): Promise<void>;
    retrieve(id: string): Promise<KnowledgeNode>;
    search(query: string, limit?: number): Promise<KnowledgeNode[]>;
    delete(id: string): Promise<void>;
    update(node: KnowledgeNode): Promise<void>;
}
