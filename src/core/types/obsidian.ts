export interface ObsidianNote {
    path: string;
    name: string;
    content: string;
    frontMatter?: Record<string, unknown>;
    links: {
        internal: string[];
        external: string[];
        tags: string[];
    };
    lastModified: Date;
}

export interface ObsidianVault {
    path: string;
    configDir?: string;
    pluginDir?: string;
}
