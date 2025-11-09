import {
  //  KnowledgeProcessor,
  ObsidianProcessor,
} from "@core/types/knowledge-source";
import { KnowledgeNode } from "@core/types/knowledge";
import { ObsidianNote } from "@core/types/obsidian";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export class ObsidianContentProcessor implements ObsidianProcessor {
  async parseNote(content: string): Promise<ObsidianNote> {
    const frontMatter = this.extractFrontMatter(content);
    const links = await this.extractLinks(content);

    return {
      path: "", // Set by caller
      name: "", // Set by caller
      content,
      frontMatter,
      links,
      lastModified: new Date(),
    };
  }

  async resolveLinks(note: ObsidianNote): Promise<ObsidianNote> {
    // Here we could resolve wiki-links to their full paths
    // and validate that linked files exist
    return note;
  }

  extractFrontMatter(content: string): Record<string, unknown> {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontMatterRegex);

    if (!match) return {};

    try {
      return parseYaml(match[1]);
    } catch {
      return {};
    }
  }

  private async extractLinks(content: string): Promise<ObsidianNote["links"]> {
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;

    const internal: string[] = [];
    const external: string[] = [];
    const tags: string[] = [];

    // Extract wiki-style links
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      internal.push(match[1].split("|")[0]); // Handle aliased links
    }

    // Extract markdown links
    while ((match = mdLinkRegex.exec(content)) !== null) {
      if (match[2].startsWith("http")) {
        external.push(match[2]);
      } else {
        internal.push(match[2]);
      }
    }

    // Extract tags
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return {
      internal: [...new Set(internal)],
      external: [...new Set(external)],
      tags: [...new Set(tags)],
    };
  }

  async toKnowledgeNode(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<KnowledgeNode> {
    const note = await this.parseNote(content);

    return {
      id: (metadata?.path as string) || "",
      content: note.content,
      metadata: {
        type: "note",
        source: "obsidian",
        created: new Date(),
        modified: note.lastModified,
        relationships: note.links.internal,
        tags: note.links.tags,
        volatility: "medium",
        ...metadata,
      },
    };
  }

  async fromKnowledgeNode(node: KnowledgeNode): Promise<string> {
    // Convert a KnowledgeNode back to Obsidian markdown
    const frontMatter = {
      tags: node.metadata.tags,
      created: node.metadata.created,
      modified: node.metadata.modified,
      volatility: node.metadata.volatility,
    };

    const frontMatterYaml = `---\n${stringifyYaml(frontMatter)}\n---\n\n`;
    return frontMatterYaml + node.content;
  }
}
