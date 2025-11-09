import { KnowledgeSourceAdapter } from "@core/types/knowledge-source";
import { ObsidianVault } from "@core/types/obsidian";
import * as fs from "fs/promises";
import * as path from "path";
import { watch } from "chokidar";

export class ObsidianAdapter implements KnowledgeSourceAdapter {
  private vault: ObsidianVault;
  private watcher: any;

  constructor(vaultPath: string) {
    this.vault = { path: vaultPath };
  }

  async connect(): Promise<void> {
    // Verify vault exists and is accessible
    await fs.access(this.vault.path);

    // Check for .obsidian config directory
    const configPath = path.join(this.vault.path, ".obsidian");
    try {
      await fs.access(configPath);
      this.vault.configDir = configPath;
    } catch {
      // No .obsidian directory, might not be a vault
      console.warn(
        "No .obsidian directory found, might not be an Obsidian vault"
      );
    }
  }

  async read(notePath: string): Promise<string> {
    const fullPath = path.join(this.vault.path, notePath);
    return fs.readFile(fullPath, "utf-8");
  }

  async write(notePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.vault.path, notePath);
    await fs.writeFile(fullPath, content, "utf-8");
  }

  watch(callback: (path: string) => void): void {
    const watchPath = path.join(this.vault.path, "**/*.md");
    this.watcher = watch(watchPath, {
      ignored: /(^|[/\\])\../, // Ignore hidden files
      persistent: true,
    });

    this.watcher.on("change", (path: string) => {
      callback(path);
    });
  }

  async list(): Promise<string[]> {
    const files: string[] = [];

    async function walkDir(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          await walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    }

    await walkDir(this.vault.path);
    return files.map((f) => path.relative(this.vault.path, f));
  }
}
