/**
 * GUI Controller - Controls mouse, keyboard, and applications
 *
 * Allows agents to:
 * - Move mouse and click
 * - Type text
 * - Take screenshots
 * - Launch applications
 * - Control Photoshop, GIMP, Paint, etc.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Window {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GUIAction {
  type: 'move_mouse' | 'click' | 'type' | 'screenshot' | 'find_window' | 'launch_app' | 'key_press' | 'drag';
  [key: string]: any;
}

export class GUIController {
  private platform: 'linux' | 'darwin' | 'win32';
  private pythonAvailable: boolean = false;

  constructor() {
    this.platform = os.platform() as 'linux' | 'darwin' | 'win32';
    this.checkDependencies();
  }

  /**
   * Check if required dependencies are available
   */
  private async checkDependencies(): Promise<void> {
    try {
      // Check Python
      await execAsync('python3 --version');
      this.pythonAvailable = true;

      // Check PyAutoGUI
      try {
        await execAsync('python3 -c "import pyautogui"');
        console.log('✅ PyAutoGUI available for GUI control');
      } catch {
        console.log('⚠️  PyAutoGUI not installed. Install with: pip3 install pyautogui');
        console.log('   GUI control will use fallback methods');
      }
    } catch {
      this.pythonAvailable = false;
      console.log('⚠️  Python3 not found. GUI control features limited.');
    }
  }

  /**
   * Move mouse to position
   */
  async moveMouse(x: number, y: number, duration: number = 0): Promise<void> {
    if (this.pythonAvailable) {
      await this.executePython(`
import pyautogui
pyautogui.moveTo(${x}, ${y}, duration=${duration})
      `);
    } else {
      // Fallback for platform-specific tools
      if (this.platform === 'linux') {
        await execAsync(`xdotool mousemove ${x} ${y}`);
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick m:${x},${y}`);
      }
    }
  }

  /**
   * Click mouse button
   */
  async click(button: 'left' | 'right' | 'middle' = 'left', clicks: number = 1): Promise<void> {
    if (this.pythonAvailable) {
      await this.executePython(`
import pyautogui
pyautogui.click(button='${button}', clicks=${clicks})
      `);
    } else {
      if (this.platform === 'linux') {
        const btn = button === 'left' ? '1' : button === 'right' ? '3' : '2';
        await execAsync(`xdotool click --repeat ${clicks} ${btn}`);
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick c:.`);
      }
    }
  }

  /**
   * Type text
   */
  async type(text: string, interval: number = 0): Promise<void> {
    // Escape special characters
    const escaped = text.replace(/'/g, "\\'");

    if (this.pythonAvailable) {
      await this.executePython(`
import pyautogui
pyautogui.typewrite('${escaped}', interval=${interval})
      `);
    } else {
      if (this.platform === 'linux') {
        await execAsync(`xdotool type '${escaped}'`);
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick t:'${escaped}'`);
      }
    }
  }

  /**
   * Press key
   */
  async pressKey(key: string): Promise<void> {
    if (this.pythonAvailable) {
      await this.executePython(`
import pyautogui
pyautogui.press('${key}')
      `);
    } else {
      if (this.platform === 'linux') {
        await execAsync(`xdotool key ${key}`);
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick kp:${key}`);
      }
    }
  }

  /**
   * Press key combination
   */
  async pressKeys(...keys: string[]): Promise<void> {
    if (this.pythonAvailable) {
      const keysStr = keys.map(k => `'${k}'`).join(', ');
      await this.executePython(`
import pyautogui
pyautogui.hotkey(${keysStr})
      `);
    } else {
      if (this.platform === 'linux') {
        await execAsync(`xdotool key ${keys.join('+')}`);
      }
    }
  }

  /**
   * Drag mouse
   */
  async drag(from: Point, to: Point, duration: number = 0.5): Promise<void> {
    await this.moveMouse(from.x, from.y);
    await this.sleep(100);

    if (this.pythonAvailable) {
      await this.executePython(`
import pyautogui
pyautogui.drag(${to.x - from.x}, ${to.y - from.y}, duration=${duration})
      `);
    } else {
      // Fallback: move + click + drag + release
      await this.moveMouse(from.x, from.y);
      await execAsync('xdotool mousedown 1');
      await this.moveMouse(to.x, to.y, duration * 1000);
      await execAsync('xdotool mouseup 1');
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(region?: Region): Promise<Buffer> {
    const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);

    if (this.pythonAvailable) {
      if (region) {
        await this.executePython(`
import pyautogui
screenshot = pyautogui.screenshot(region=(${region.x}, ${region.y}, ${region.width}, ${region.height}))
screenshot.save('${tempFile}')
        `);
      } else {
        await this.executePython(`
import pyautogui
screenshot = pyautogui.screenshot()
screenshot.save('${tempFile}')
        `);
      }
    } else {
      // Platform-specific screenshot tools
      if (this.platform === 'linux') {
        if (region) {
          await execAsync(`scrot -a ${region.x},${region.y},${region.width},${region.height} ${tempFile}`);
        } else {
          await execAsync(`scrot ${tempFile}`);
        }
      } else if (this.platform === 'darwin') {
        await execAsync(`screencapture ${tempFile}`);
      }
    }

    const buffer = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return buffer;
  }

  /**
   * Find window by title
   */
  async findWindow(title: string): Promise<Window | null> {
    try {
      if (this.platform === 'linux') {
        const { stdout } = await execAsync(`wmctrl -l | grep -i "${title}"`);
        const lines = stdout.trim().split('\n');

        if (lines.length === 0 || !lines[0]) {
          return null;
        }

        const parts = lines[0].split(/\s+/);
        const windowId = parts[0];
        const windowTitle = parts.slice(3).join(' ');

        // Get window geometry
        const { stdout: geom } = await execAsync(`xdotool getwindowgeometry ${windowId}`);
        const posMatch = geom.match(/Position: (\d+),(\d+)/);
        const sizeMatch = geom.match(/Geometry: (\d+)x(\d+)/);

        return {
          id: windowId,
          title: windowTitle,
          x: posMatch ? parseInt(posMatch[1]) : 0,
          y: posMatch ? parseInt(posMatch[2]) : 0,
          width: sizeMatch ? parseInt(sizeMatch[1]) : 0,
          height: sizeMatch ? parseInt(sizeMatch[2]) : 0
        };
      } else if (this.platform === 'darwin') {
        // macOS: use osascript
        const script = `
tell application "System Events"
  set appList to every process whose name contains "${title}"
  if length of appList > 0 then
    set app to item 1 of appList
    return {name, position, size} of window 1 of app
  end if
end tell
        `;

        const { stdout } = await execAsync(`osascript -e '${script}'`);
        // Parse AppleScript output
        // TODO: Implement parsing
        return null;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Activate/focus window
   */
  async activateWindow(window: Window): Promise<void> {
    if (this.platform === 'linux') {
      await execAsync(`wmctrl -i -a ${window.id}`);
    } else if (this.platform === 'darwin') {
      await execAsync(`osascript -e 'tell application "${window.title}" to activate'`);
    }
  }

  /**
   * Launch application
   */
  async launchApp(appName: string): Promise<void> {
    console.log(`🚀 Launching ${appName}...`);

    if (this.platform === 'linux') {
      // Try common app names
      const apps: Record<string, string> = {
        'photoshop': 'wine ~/.wine/drive_c/Program\\ Files/Adobe/Photoshop/photoshop.exe',
        'gimp': 'gimp',
        'paint': 'pinta',
        'krita': 'krita',
        'inkscape': 'inkscape',
        'blender': 'blender',
        'vscode': 'code',
        'code': 'code'
      };

      const command = apps[appName.toLowerCase()] || appName;
      spawn(command, [], { detached: true, stdio: 'ignore' });
    } else if (this.platform === 'darwin') {
      await execAsync(`open -a "${appName}"`);
    } else if (this.platform === 'win32') {
      await execAsync(`start ${appName}`);
    }

    // Wait for app to launch
    await this.sleep(2000);
  }

  /**
   * Execute Python script
   */
  private async executePython(script: string): Promise<string> {
    const tempFile = path.join(os.tmpdir(), `gui-script-${Date.now()}.py`);
    fs.writeFileSync(tempFile, script);

    try {
      const { stdout, stderr } = await execAsync(`python3 ${tempFile}`);
      fs.unlinkSync(tempFile);
      return stdout || stderr;
    } catch (error: any) {
      fs.unlinkSync(tempFile);
      throw error;
    }
  }

  /**
   * Sleep/wait
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get screen size
   */
  async getScreenSize(): Promise<{ width: number; height: number }> {
    if (this.pythonAvailable) {
      const output = await this.executePython(`
import pyautogui
size = pyautogui.size()
print(f"{size[0]},{size[1]}")
      `);

      const [width, height] = output.trim().split(',').map(Number);
      return { width, height };
    }

    // Fallback
    return { width: 1920, height: 1080 };
  }

  /**
   * Get mouse position
   */
  async getMousePosition(): Promise<Point> {
    if (this.pythonAvailable) {
      const output = await this.executePython(`
import pyautogui
pos = pyautogui.position()
print(f"{pos[0]},{pos[1]}")
      `);

      const [x, y] = output.trim().split(',').map(Number);
      return { x, y };
    }

    return { x: 0, y: 0 };
  }
}
