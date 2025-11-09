import { KnowledgeManager } from '../../../src/core/services/knowledge-manager';
import { KnowledgeSourceAdapter, KnowledgeProcessor } from '../../../src/core/types/knowledge-source';
import { KnowledgeNode } from '../../../src/core/types/knowledge';

// Mock implementation of KnowledgeSourceAdapter
class MockSource implements KnowledgeSourceAdapter {
    private content: Map<string, string> = new Map();
    private connected = false;

    async connect(): Promise<void> {
        this.connected = true;
    }

    async read(path: string): Promise<string> {
        if (!this.connected) throw new Error('Not connected');
        const content = this.content.get(path);
        if (!content) throw new Error('File not found');
        return content;
    }

    async write(path: string, content: string): Promise<void> {
        if (!this.connected) throw new Error('Not connected');
        this.content.set(path, content);
    }

    async list(): Promise<string[]> {
        if (!this.connected) throw new Error('Not connected');
        return Array.from(this.content.keys());
    }

    setMockContent(path: string, content: string): void {
        this.content.set(path, content);
    }
}

// Mock implementation of KnowledgeProcessor
class MockProcessor implements KnowledgeProcessor {
    async toKnowledgeNode(content: string, metadata?: Record<string, unknown>): Promise<KnowledgeNode> {
        return {
            id: metadata?.path as string || 'test',
            content,
            metadata: {
                type: 'note',
                source: 'mock',
                created: new Date(),
                modified: new Date(),
                relationships: [],
                volatility: 'medium'
            }
        };
    }

    async fromKnowledgeNode(node: KnowledgeNode): Promise<string> {
        return node.content;
    }
}

describe('KnowledgeManager', () => {
    let manager: KnowledgeManager;
    let mockSource: MockSource;
    let mockProcessor: MockProcessor;

    beforeEach(() => {
        manager = new KnowledgeManager();
        mockSource = new MockSource();
        mockProcessor = new MockProcessor();

        manager.registerSource('mock', mockSource);
        manager.registerProcessor('mock', mockProcessor);
    });

    describe('connect', () => {
        it('should connect to source', async () => {
            await manager.connect('mock');
            // Should not throw
        });

        it('should throw for unknown source', async () => {
            await expect(manager.connect('unknown')).rejects.toThrow();
        });
    });

    describe('processFile', () => {
        beforeEach(async () => {
            await manager.connect('mock');
        });

        it('should process a file and create a node', async () => {
            const path = 'test.md';
            const content = '# Test Content';
            mockSource.setMockContent(path, content);

            const node = await manager.processFile('mock', path);

            expect(node.content).toBe(content);
            expect(node.id).toBe(path);
            expect(node.metadata.source).toBe('mock');
        });

        it('should throw for missing file', async () => {
            await expect(manager.processFile('mock', 'missing.md')).rejects.toThrow();
        });
    });

    describe('indexSource', () => {
        beforeEach(async () => {
            await manager.connect('mock');
        });

        it('should index all files from source', async () => {
            mockSource.setMockContent('test1.md', 'Content 1');
            mockSource.setMockContent('test2.md', 'Content 2');

            await manager.indexSource('mock');

            expect(manager.getNode('test1.md')).toBeDefined();
            expect(manager.getNode('test2.md')).toBeDefined();
        });
    });

    describe('updateNode', () => {
        beforeEach(async () => {
            await manager.connect('mock');
        });

        it('should update node content in source', async () => {
            const node: KnowledgeNode = {
                id: 'test.md',
                content: 'Updated content',
                metadata: {
                    type: 'note',
                    source: 'mock',
                    created: new Date(),
                    modified: new Date(),
                    relationships: [],
                    volatility: 'medium'
                }
            };

            await manager.updateNode(node);

            const updated = await mockSource.read('test.md');
            expect(updated).toBe('Updated content');
        });
    });

    describe('findRelated', () => {
        beforeEach(async () => {
            await manager.connect('mock');
        });

        it('should find related nodes', async () => {
            const node1: KnowledgeNode = {
                id: 'test1.md',
                content: 'Content 1',
                metadata: {
                    type: 'note',
                    source: 'mock',
                    created: new Date(),
                    modified: new Date(),
                    relationships: ['test2.md'],
                    volatility: 'medium'
                }
            };

            const node2: KnowledgeNode = {
                id: 'test2.md',
                content: 'Content 2',
                metadata: {
                    type: 'note',
                    source: 'mock',
                    created: new Date(),
                    modified: new Date(),
                    relationships: [],
                    volatility: 'medium'
                }
            };

            await manager.updateNode(node1);
            await manager.updateNode(node2);

            const related = manager.findRelated('test1.md');
            expect(related).toHaveLength(1);
            expect(related[0].id).toBe('test2.md');
        });
    });
});
