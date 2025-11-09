import { ObsidianAdapter } from '../../../src/adapters/storage/obsidian';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the fs/promises module
jest.mock('fs/promises');
jest.mock('chokidar', () => ({
    watch: jest.fn().mockReturnValue({
        on: jest.fn()
    })
}));

describe('ObsidianAdapter', () => {
    let adapter: ObsidianAdapter;
    const mockVaultPath = '/test/vault';

    beforeEach(() => {
        adapter = new ObsidianAdapter(mockVaultPath);
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('should verify vault exists', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            await adapter.connect();

            expect(fs.access).toHaveBeenCalledWith(mockVaultPath);
        });

        it('should check for .obsidian directory', async () => {
            (fs.access as jest.Mock)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            await adapter.connect();

            expect(fs.access).toHaveBeenCalledWith(path.join(mockVaultPath, '.obsidian'));
        });

        it('should handle missing .obsidian directory', async () => {
            (fs.access as jest.Mock)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('ENOENT'));

            await expect(adapter.connect()).resolves.not.toThrow();
        });
    });

    describe('read', () => {
        it('should read file content', async () => {
            const content = 'Test content';
            (fs.readFile as jest.Mock).mockResolvedValue(content);

            const result = await adapter.read('test.md');

            expect(result).toBe(content);
            expect(fs.readFile).toHaveBeenCalledWith(
                path.join(mockVaultPath, 'test.md'),
                'utf-8'
            );
        });
    });

    describe('write', () => {
        it('should write file content', async () => {
            const content = 'Test content';
            await adapter.write('test.md', content);

            expect(fs.writeFile).toHaveBeenCalledWith(
                path.join(mockVaultPath, 'test.md'),
                content,
                'utf-8'
            );
        });
    });

    describe('list', () => {
        it('should list markdown files recursively', async () => {
            const mockFiles = [
                { name: 'test1.md', isDirectory: () => false, isFile: () => true },
                { name: 'test2.md', isDirectory: () => false, isFile: () => true },
                { name: 'subfolder', isDirectory: () => true, isFile: () => false }
            ];

            (fs.readdir as jest.Mock)
                .mockResolvedValueOnce(mockFiles)
                .mockResolvedValueOnce([]);

            const files = await adapter.list();

            expect(files).toContain('test1.md');
            expect(files).toContain('test2.md');
            expect(fs.readdir).toHaveBeenCalledWith(mockVaultPath, { withFileTypes: true });
        });

        it('should ignore hidden directories', async () => {
            const mockFiles = [
                { name: '.hidden', isDirectory: () => true, isFile: () => false },
                { name: 'test.md', isDirectory: () => false, isFile: () => true }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

            const files = await adapter.list();

            expect(files).toContain('test.md');
            expect(files).toHaveLength(1);
        });
    });
});
