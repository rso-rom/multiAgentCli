/**
 * Action parser: converts model text into structured Actions.
 * Two main patterns:
 * 1) JSON block enclosed in ```json ... ```  -> parse as Action|Action[]
 * 2) Action list in plain text with prefixed tokens (e.g. ACTION: { ... })
 * 3) Code blocks are extracted and returned as payload (for write actions)
 *
 * Action shape:
 *  { type: 'mkdir' | 'write' | 'shell' | 'patch', path?: string, content?: string, command?: string }
 */

export type Action = { type: string; [k:string]: any };

export function parseActionsFromText(text: string): Action[] {
  // 1) Try to find ```json``` block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const j = JSON.parse(jsonMatch[1]);
      if (Array.isArray(j)) return j;
      return [j];
    } catch (e) {
      // fallthrough
    }
  }

  // 2) Try to find standalone JSON object (first match)
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const j = JSON.parse(objMatch[0]);
      if (Array.isArray(j)) return j;
      return [j];
    } catch { /* fallthrough */ }
  }

  // 3) Parse simple lines like: ACTION: mkdir src
  const actions: Action[] = [];
  const lines = text.split(/\r?\n/);
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    const m = t.match(/^(mkdir|write|shell|patch)\s+(.*)/i);
    if (m) {
      const typ = m[1].toLowerCase();
      const rest = m[2];
      if (typ === 'mkdir') actions.push({ type: 'mkdir', path: rest.trim() });
      else if (typ === 'shell') actions.push({ type: 'shell', command: rest.trim() });
      else if (typ === 'write') {
        // expect "write <path>\n```<lang>\n<content>\n```" Ã¢ÂÂ naive: find codeblock afterwards
        const idx = lines.indexOf(l);
        let content = '';
        for (let i = idx+1; i < lines.length; i++) {
          const ln = lines[i];
          if (ln.startsWith('```')) {
            // find end
            const lang = ln.slice(3).trim();
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
              content += lines[i] + '\n';
              i++;
            }
            break;
          }
        }
        actions.push({ type: 'write', path: rest.trim(), content });
      } else if (typ === 'patch') {
        actions.push({ type: 'patch', patch: rest.trim() });
      }
    }
  }

  return actions;
}
