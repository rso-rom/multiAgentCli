/**
 * Test script for workflow execution
 */

async function testWorkflow() {
  const { MarkdownWorkflowParser } = require('./dist/orchestrator/markdown-workflow-parser');
  const { Workflow } = require('./dist/orchestrator/workflow');

  const task = `Entwickle ein Hallo World vue.js app mit spring boot als backend welches genutzt wird um zwei zahlen zu addieren. Die vue.js app hat zwei eingabe felder für die Zahlen. Lege hierfür einen appcoding-example ordner an.`;

  console.log('🧪 Testing Natural Workflow System\n');
  console.log(`📝 Task: ${task}\n`);

  try {
    // Find workflow
    const workflowPath = MarkdownWorkflowParser.findWorkflow('develop');

    if (!workflowPath) {
      console.error('❌ Workflow not found: develop');
      return;
    }

    console.log(`✅ Found workflow: ${workflowPath}\n`);

    // Parse with variables
    const variables = {
      task,
      TASK: task,
      arguments: task,
      ARGUMENTS: task
    };

    console.log('📋 Parsing workflow...\n');
    const definition = MarkdownWorkflowParser.parseFile(workflowPath, variables);

    console.log(`✅ Workflow: ${definition.name}`);
    console.log(`   Description: ${definition.description}`);
    console.log(`   Agents: ${Object.keys(definition.agents).length}`);
    console.log(`   Steps: ${definition.steps.length}\n`);

    // Create and execute workflow
    const workflow = new Workflow(definition);

    console.log('🚀 Starting workflow execution...\n');
    console.log('─'.repeat(60));

    await workflow.execute();

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Workflow completed successfully!\n');

    // Show results
    const results = workflow.getAllResults();

    console.log('📊 Results Summary:\n');
    for (const [agent, output] of Object.entries(results)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 [${agent.toUpperCase()}]`);
      console.log('='.repeat(60));
      console.log(output);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testWorkflow().catch(console.error);
