/**
 * Image Editor Automator
 *
 * Automates Photoshop, GIMP, Paint, etc.
 * Agents can create and edit images using GUI control
 */

import { GUIController, Point, Region } from '../gui-controller';

export interface ImageEditorConfig {
  name: 'photoshop' | 'gimp' | 'paint' | 'krita';
  menuBar: Point;
  toolbarLeft?: Point;
}

export class ImageEditorAutomator {
  private gui: GUIController;
  private config: ImageEditorConfig;
  private isInitialized: boolean = false;

  constructor(editorName: 'photoshop' | 'gimp' | 'paint' | 'krita') {
    this.gui = new GUIController();
    this.config = this.getEditorConfig(editorName);
  }

  /**
   * Get editor-specific configuration
   */
  private getEditorConfig(name: string): ImageEditorConfig {
    // These are approximate positions - might need calibration
    const configs: Record<string, ImageEditorConfig> = {
      photoshop: {
        name: 'photoshop',
        menuBar: { x: 100, y: 30 },
        toolbarLeft: { x: 30, y: 200 }
      },
      gimp: {
        name: 'gimp',
        menuBar: { x: 100, y: 50 },
        toolbarLeft: { x: 30, y: 150 }
      },
      paint: {
        name: 'paint',
        menuBar: { x: 50, y: 30 },
        toolbarLeft: { x: 30, y: 100 }
      },
      krita: {
        name: 'krita',
        menuBar: { x: 100, y: 40 },
        toolbarLeft: { x: 30, y: 150 }
      }
    };

    return configs[name] || configs.gimp;
  }

  /**
   * Initialize: Launch app and wait for ready
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(`🎨 Initializing ${this.config.name}...`);

    // Launch application
    await this.gui.launchApp(this.config.name);

    // Wait for window to appear
    await this.sleep(3000);

    // Find and activate window
    const window = await this.gui.findWindow(this.config.name);
    if (window) {
      await this.gui.activateWindow(window);
      console.log(`✅ ${this.config.name} ready`);
    } else {
      console.log(`⚠️  ${this.config.name} window not found, continuing anyway...`);
    }

    this.isInitialized = true;
    await this.sleep(1000);
  }

  /**
   * Create new image
   */
  async createNewImage(width: number, height: number): Promise<void> {
    await this.initialize();

    console.log(`📄 Creating new image: ${width}x${height}`);

    // File → New
    await this.clickMenu('File', 'New');
    await this.sleep(500);

    // Wait for dialog
    await this.sleep(1000);

    // Enter dimensions (method varies by app)
    if (this.config.name === 'gimp') {
      // GIMP: Width and Height fields are accessible via Tab
      await this.gui.type(width.toString());
      await this.gui.pressKey('tab');
      await this.gui.type(height.toString());
      await this.sleep(500);
      await this.gui.pressKey('Return');
    } else if (this.config.name === 'photoshop') {
      // Photoshop has specific field positions
      // TODO: Implement Photoshop-specific field navigation
      await this.gui.pressKeys('cmd', 'n'); // Cmd+N for New
      await this.sleep(1000);
      await this.gui.type(width.toString());
      await this.gui.pressKey('tab');
      await this.gui.type(height.toString());
      await this.gui.pressKey('Return');
    } else {
      // Generic approach: Tab through fields
      await this.gui.type(width.toString());
      await this.gui.pressKey('tab');
      await this.gui.type(height.toString());
      await this.gui.pressKey('Return');
    }

    await this.sleep(1000);
    console.log(`✅ Canvas created`);
  }

  /**
   * Select tool from toolbar
   */
  async selectTool(toolName: string): Promise<void> {
    console.log(`🔧 Selecting tool: ${toolName}`);

    // Keyboard shortcuts (common across apps)
    const shortcuts: Record<string, string> = {
      'brush': 'b',
      'pencil': 'p',
      'eraser': 'e',
      'rectangle': 'r',
      'ellipse': 'e',
      'line': 'l',
      'text': 't',
      'fill': 'g',
      'eyedropper': 'i',
      'move': 'v',
      'zoom': 'z',
      'hand': 'h'
    };

    const shortcut = shortcuts[toolName.toLowerCase()];
    if (shortcut) {
      await this.gui.pressKey(shortcut);
      await this.sleep(200);
    } else {
      console.log(`⚠️  Unknown tool: ${toolName}, trying click method...`);
      // Fallback: click toolbar (if we knew positions)
    }
  }

  /**
   * Set foreground color
   */
  async setForegroundColor(color: string): Promise<void> {
    console.log(`🎨 Setting color: ${color}`);

    // Click on foreground color swatch
    // Position varies by app, using approximate position
    if (this.config.toolbarLeft) {
      await this.gui.moveMouse(this.config.toolbarLeft.x, this.config.toolbarLeft.y + 400);
      await this.gui.click('left', 2); // Double-click to open color picker
      await this.sleep(500);

      // Type hex color if supported
      if (color.startsWith('#')) {
        await this.gui.type(color.substring(1)); // Remove #
        await this.gui.pressKey('Return');
        await this.sleep(300);
      }
    }
  }

  /**
   * Draw rectangle
   */
  async drawRectangle(x: number, y: number, width: number, height: number, color?: string): Promise<void> {
    console.log(`📐 Drawing rectangle: ${x},${y} ${width}x${height}`);

    // Select rectangle tool
    await this.selectTool('rectangle');

    // Set color if specified
    if (color) {
      await this.setForegroundColor(color);
    }

    // Draw by dragging
    await this.gui.drag(
      { x, y },
      { x: x + width, y: y + height },
      0.3
    );

    await this.sleep(500);
    console.log(`✅ Rectangle drawn`);
  }

  /**
   * Draw ellipse/circle
   */
  async drawEllipse(x: number, y: number, width: number, height: number, color?: string): Promise<void> {
    console.log(`⭕ Drawing ellipse: ${x},${y} ${width}x${height}`);

    await this.selectTool('ellipse');

    if (color) {
      await this.setForegroundColor(color);
    }

    await this.gui.drag(
      { x, y },
      { x: x + width, y: y + height },
      0.3
    );

    await this.sleep(500);
    console.log(`✅ Ellipse drawn`);
  }

  /**
   * Draw line
   */
  async drawLine(from: Point, to: Point, color?: string, width?: number): Promise<void> {
    console.log(`📏 Drawing line: ${from.x},${from.y} → ${to.x},${to.y}`);

    await this.selectTool('line');

    if (color) {
      await this.setForegroundColor(color);
    }

    // Set line width via menu (if specified)
    if (width) {
      // This is app-specific, skipping for now
    }

    await this.gui.drag(from, to, 0.2);

    await this.sleep(500);
    console.log(`✅ Line drawn`);
  }

  /**
   * Add text
   */
  async addText(x: number, y: number, text: string, size?: number, color?: string): Promise<void> {
    console.log(`📝 Adding text at ${x},${y}: "${text}"`);

    await this.selectTool('text');

    if (color) {
      await this.setForegroundColor(color);
    }

    // Click where text should be
    await this.gui.moveMouse(x, y);
    await this.gui.click();
    await this.sleep(500);

    // Type the text
    await this.gui.type(text);

    // Finish text editing
    await this.gui.pressKeys('ctrl', 'Return'); // Or Cmd+Return on macOS

    await this.sleep(500);
    console.log(`✅ Text added`);
  }

  /**
   * Fill with color
   */
  async fill(x: number, y: number, color: string): Promise<void> {
    console.log(`🎨 Fill at ${x},${y} with ${color}`);

    await this.selectTool('fill');
    await this.setForegroundColor(color);

    // Click to fill
    await this.gui.moveMouse(x, y);
    await this.gui.click();

    await this.sleep(300);
    console.log(`✅ Filled`);
  }

  /**
   * Apply blur filter
   */
  async applyBlur(radius: number = 5): Promise<void> {
    console.log(`💫 Applying blur filter (radius: ${radius})`);

    await this.clickMenu('Filters', 'Blur', 'Gaussian Blur');
    await this.sleep(1000);

    // Set radius (method varies by app)
    await this.gui.type(radius.toString());
    await this.sleep(300);
    await this.gui.pressKey('Return');

    await this.sleep(500);
    console.log(`✅ Blur applied`);
  }

  /**
   * Save image
   */
  async saveImage(filePath: string): Promise<void> {
    console.log(`💾 Saving image: ${filePath}`);

    // File → Export/Save As
    await this.gui.pressKeys('shift', 'ctrl', 's'); // Ctrl+Shift+S
    await this.sleep(1000);

    // Type file path
    await this.gui.type(filePath);
    await this.sleep(300);

    // Save
    await this.gui.pressKey('Return');
    await this.sleep(500);

    // Confirm export options (if dialog appears)
    await this.gui.pressKey('Return');

    await this.sleep(1000);
    console.log(`✅ Image saved`);
  }

  /**
   * Click menu items
   */
  private async clickMenu(...items: string[]): Promise<void> {
    // Click menu bar
    await this.gui.moveMouse(this.config.menuBar.x, this.config.menuBar.y);
    await this.gui.click();
    await this.sleep(200);

    // Navigate through menu items
    for (let i = 0; i < items.length; i++) {
      // Type first letter to jump to menu item
      const firstLetter = items[i][0].toLowerCase();
      await this.gui.pressKey(firstLetter);
      await this.sleep(200);

      if (i < items.length - 1) {
        // Open submenu
        await this.gui.pressKey('Right');
        await this.sleep(200);
      } else {
        // Execute final item
        await this.gui.pressKey('Return');
        await this.sleep(300);
      }
    }
  }

  /**
   * Take screenshot of canvas
   */
  async screenshotCanvas(region?: Region): Promise<Buffer> {
    return await this.gui.screenshot(region);
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close application
   */
  async close(): Promise<void> {
    console.log(`👋 Closing ${this.config.name}`);
    await this.gui.pressKeys('alt', 'F4'); // Or Cmd+Q on macOS
    await this.sleep(500);
  }
}

/**
 * High-level image creation commands
 */
export class ImageCreator {
  private automator: ImageEditorAutomator;

  constructor(editor: 'photoshop' | 'gimp' | 'paint' | 'krita' = 'gimp') {
    this.automator = new ImageEditorAutomator(editor);
  }

  /**
   * Create a simple logo
   */
  async createLogo(width: number, height: number, text: string, bgColor: string, textColor: string): Promise<string> {
    await this.automator.initialize();
    await this.automator.createNewImage(width, height);

    // Fill background
    await this.automator.fill(width / 2, height / 2, bgColor);

    // Add text in center
    await this.automator.addText(width / 3, height / 2, text, 48, textColor);

    // Save
    const outputPath = `/tmp/logo-${Date.now()}.png`;
    await this.automator.saveImage(outputPath);

    return outputPath;
  }

  /**
   * Create a simple diagram
   */
  async createDiagram(width: number, height: number, shapes: Array<{
    type: 'rectangle' | 'ellipse' | 'line';
    x: number;
    y: number;
    width?: number;
    height?: number;
    to?: Point;
    color: string;
  }>): Promise<string> {
    await this.automator.initialize();
    await this.automator.createNewImage(width, height);

    // Draw each shape
    for (const shape of shapes) {
      if (shape.type === 'rectangle') {
        await this.automator.drawRectangle(shape.x, shape.y, shape.width!, shape.height!, shape.color);
      } else if (shape.type === 'ellipse') {
        await this.automator.drawEllipse(shape.x, shape.y, shape.width!, shape.height!, shape.color);
      } else if (shape.type === 'line') {
        await this.automator.drawLine({ x: shape.x, y: shape.y }, shape.to!, shape.color);
      }
    }

    // Save
    const outputPath = `/tmp/diagram-${Date.now()}.png`;
    await this.automator.saveImage(outputPath);

    return outputPath;
  }
}
