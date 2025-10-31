import { v4 as uuidv4 } from 'uuid';

export function makeProjectId(name: string) {
  return `${name}-${uuidv4().slice(0,8)}`;
}
