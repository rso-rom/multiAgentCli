import { Plugin } from './plugin-interface';
import fs from 'fs';
import path from 'path';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  async loadPlugin(pluginPath: string): Promise<Plugin> {
    const plugin = await import(pluginPath);
    const instance = plugin.default as Plugin;
    await instance.init();
    this.plugins.set(instance.name, instance);
    return instance;
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const globalPluginManager = new PluginManager();
