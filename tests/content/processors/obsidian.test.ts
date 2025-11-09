import { KnowledgeNode } from '../../../src/core/types/knowledge';
import { ObsidianNote } from '../../../src/core/types/obsidian';
import { ObsidianContentProcessor } from '../../../src/content/processors/obsidian';

describe('ObsidianContentProcessor', () => {
    let processor: ObsidianContentProcessor;

    beforeEach(() => {
        processor = new ObsidianContentProcessor();
    });

    describe('parseNote', () => {
        it('should parse a note with frontmatter', async () => {
            const content = `---
title: Test Note
tags: [test, markdown]
date: 2025-11-09
---
# Test Content
This is a test note`;

            const note = await processor.parseNote(content);

            expect(note.content).toBe(content);
            expect(note.frontMatter).toEqual({
                title: 'Test Note',
                tags: ['test', 'markdown'],
                date: '2025-11-09'
            });
        });

        it('should parse a note without frontmatter', async () => {
            const content = '# Test Content\nThis is a test note';
            const note = await processor.parseNote(content);

            expect(note.content).toBe(content);
            expect(note.frontMatter).toEqual({});
        });
    });

    describe('extractLinks', () => {
        it('should extract wiki-style links', async () => {
            const content = 'Link to [[Another Note]] and [[Page|Alias]]';
            const note = await processor.parseNote(content);

            expect(note.links.internal).toContain('Another Note');
            expect(note.links.internal).toContain('Page');
            expect(note.links.internal).not.toContain('Alias');
        });

        it('should extract markdown links', async () => {
            const content = '[External](https://example.com) and [Internal](note.md)';
            const note = await processor.parseNote(content);

            expect(note.links.external).toContain('https://example.com');
            expect(note.links.internal).toContain('note.md');
        });

        it('should extract tags', async () => {
            const content = 'Some #tags and #more-tags';
            const note = await processor.parseNote(content);

            expect(note.links.tags).toContain('tags');
            expect(note.links.tags).toContain('more-tags');
        });
    });

    describe('toKnowledgeNode', () => {
        it('should convert note to knowledge node', async () => {
            const content = `---
title: Test Note
tags: [test]
---
# Content
With [[link]] and #tag`;

            const node = await processor.toKnowledgeNode(content, { path: 'test.md' });

            expect(node).toMatchObject({
                id: 'test.md',
                content: content,
                metadata: {
                    type: 'note',
                    source: 'obsidian',
                    relationships: ['link'],
                    tags: ['tag'],
                    volatility: 'medium'
                }
            });
            expect(node.metadata.created).toBeInstanceOf(Date);
            expect(node.metadata.modified).toBeInstanceOf(Date);
        });
    });

    describe('fromKnowledgeNode', () => {
        it('should convert knowledge node back to markdown', async () => {
            const node: KnowledgeNode = {
                id: 'test.md',
                content: '# Test Content',
                metadata: {
                    type: 'note',
                    source: 'obsidian',
                    created: new Date('2025-11-09'),
                    modified: new Date('2025-11-09'),
                    relationships: ['link'],
                    tags: ['test'],
                    volatility: 'medium'
                }
            };

            const markdown = await processor.fromKnowledgeNode(node);
            
            expect(markdown).toContain('---');
            expect(markdown).toContain('tags:');
            expect(markdown).toContain('# Test Content');
            expect(markdown).toMatch(/created:/);
            expect(markdown).toMatch(/modified:/);
        });
    });
});
