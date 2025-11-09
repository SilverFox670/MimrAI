import { KnowledgeNode } from '@core/types/knowledge';
import { KnowledgeSourceAdapter, KnowledgeProcessor } from '@core/types/knowledge-source';
import { EventEmitter } from 'events';

export class KnowledgeManager extends EventEmitter {
    private sources: Map<string, KnowledgeSourceAdapter>;
    private processors: Map<string, KnowledgeProcessor>;
    private nodes: Map<string, KnowledgeNode>;

    constructor() {
        super();
        this.sources = new Map();
        this.processors = new Map();
        this.nodes = new Map();
    }

    registerSource(name: string, source: KnowledgeSourceAdapter): void {
        this.sources.set(name, source);
    }

    registerProcessor(name: string, processor: KnowledgeProcessor): void {
        this.processors.set(name, processor);
    }

    async connect(sourceName: string): Promise<void> {
        const source = this.sources.get(sourceName);
        if (!source) throw new Error(`Source ${sourceName} not found`);
        
        await source.connect();
        
        // Set up file watching if supported
        if (source.watch) {
            source.watch(async (path) => {
                await this.processFile(sourceName, path);
                this.emit('nodeUpdated', path);
            });
        }
    }

    async processFile(sourceName: string, path: string): Promise<KnowledgeNode> {
        const source = this.sources.get(sourceName);
        const processor = this.processors.get(sourceName);
        
        if (!source || !processor) {
            throw new Error(`Source or processor ${sourceName} not found`);
        }

        const content = await source.read(path);
        const node = await processor.toKnowledgeNode(content, { path });
        
        this.nodes.set(node.id, node);
        return node;
    }

    async indexSource(sourceName: string): Promise<void> {
        const source = this.sources.get(sourceName);
        if (!source) throw new Error(`Source ${sourceName} not found`);

        const files = await source.list();
        await Promise.all(files.map(path => this.processFile(sourceName, path)));
    }

    getNode(id: string): KnowledgeNode | undefined {
        return this.nodes.get(id);
    }

    async updateNode(node: KnowledgeNode): Promise<void> {
        const source = this.sources.get(node.metadata.source);
        const processor = this.processors.get(node.metadata.source);
        
        if (!source || !processor) {
            throw new Error(`Source or processor ${node.metadata.source} not found`);
        }

        const content = await processor.fromKnowledgeNode(node);
        await source.write(node.id, content);
        
        this.nodes.set(node.id, node);
        this.emit('nodeUpdated', node.id);
    }

    findRelated(nodeId: string): KnowledgeNode[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        return Array.from(this.nodes.values()).filter(other => 
            other.id !== nodeId && 
            (other.metadata.relationships.includes(nodeId) ||
             node.metadata.relationships.includes(other.id))
        );
    }

    searchByTag(tag: string): KnowledgeNode[] {
        return Array.from(this.nodes.values()).filter(node =>
            node.metadata.tags?.includes(tag)
        );
    }
}
