#!/usr/bin/env node
import { Command } from 'commander';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { ProjectManager } from '../core/projectManager';
import { Orchestrator } from '../orchestrator/orchestrator';
import { InteractiveShell } from './shell';

const program = new Command();
program.name('codeflow').description('Claude Code-like multi agent CLI').version('0.1.0');

program
  .command('init <name>')
  .description('create a new project workspace')
  .action((name) => {
    const pm = new ProjectManager();
    const { id, projDir } = pm.createProject(name);
    console.log(`Created project ${name} (${id}) at ${projDir}`);
  });

program
  .command('run <workflow>')
  .option('-p, --project <id>', 'project id to use')
  .description('run a workflow YAML file')
  .action(async (workflow, options) => {
    const orchestrator = createOrchestrator(options.project);
    await orchestrator.runWorkflowFile(workflow);
  });

program
  .command('shell')
  .option('-p, --project <id>', 'project id to use')
  .description('start interactive shell')
  .action(async (options) => {
    const orchestrator = createOrchestrator(options.project);
    const shell = new InteractiveShell(orchestrator);
    await shell.start();
  });

program
  .command('info <workflow>')
  .description('show a summary of a workflow file')
  .action((workflow) => {
    const absolutePath = path.resolve(workflow);
    const doc = yaml.load(fs.readFileSync(absolutePath, 'utf-8')) as any;
    console.log('Name:', doc?.name ?? '(keine)');
    console.log('Agents:', Object.keys(doc?.agents ?? {}).join(', '));
    console.log('Steps:', (doc?.steps ?? []).length);
  });

program.parseAsync(process.argv);

function createOrchestrator(projectId?: string) {
  const pm = new ProjectManager();
  let projectDir: string | undefined;
  if (projectId) {
    projectDir = pm.getProjectDirById(projectId);
  } else {
    const detected = pm.detectProject(process.cwd());
    projectDir = detected.root;
    if (!projectDir) {
      const created = pm.createProject('codeflow');
      projectDir = created.projDir;
    }
  }
  return new Orchestrator(projectDir!, true);
}
