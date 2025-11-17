const { DynamoDB } = require('aws-sdk');
const { ZenEngine } = require('@gorules/zen-engine');

const dynamodb = new DynamoDB.DocumentClient();

// Mock MCP Client (replace with your actual MCP client)
const mcpClient = {
  async createTask(taskDetails) {
    console.log('📝 Creating task via MCP:', taskDetails);
    // Your actual MCP server call here
    return { success: true, taskId: 'task-' + Date.now() };
  },
  
  async sendEmail(emailDetails) {
    console.log('📧 Sending email via MCP:', emailDetails);
    // Your actual MCP email call here
    return { success: true, emailId: 'email-' + Date.now() };
  },
  
  async updateField(fieldUpdate) {
    console.log('🔄 Updating field via MCP:', fieldUpdate);
    // Your actual MCP field update call here
    return { success: true, updated: true };
  }
};

// Load rule from DynamoDB
async function loadRuleFromDatabase(tableName, ruleId, version) {
  const result = await dynamodb.get({
    TableName: tableName,
    Key: { 
      id: ruleId,
      version: version
    }
  }).promise();
  
  if (!result.Item) {
    throw new Error(`Rule not found: ${ruleId}`);
  }
  
  // Return the data field as-is (it's already a JSON string)
  return result.Item.data;
}

exports.handler = async (event) => {
  console.log('🚀 Lambda triggered by EventBridge');
  console.log('📦 Event:', JSON.stringify(event, null, 2));

  try {
    // Get environment variables
    const rulesTableName = process.env.RULES_TABLE_NAME;
    const eventsTableName = process.env.EVENTS_TABLE_NAME;

    // Extract assignment data from EventBridge event
    const assignmentData = {
      claim: event.detail.claim || '',
      assignmentId: event.detail.assignmentId || 'unknown',
      timestamp: event.time || new Date().toISOString()
    };

    console.log('📋 Processing assignment:', assignmentData);

    // Get rule ID and version from event
    const ruleId = event.detail.ruleId || 'e239a972-7e8f-4f69-acd4-c3994df5e684';
    const ruleVersion = event.detail.version || 1;

    // Load rule from DynamoDB - returns JSON string
    const ruleJsonString = await loadRuleFromDatabase(rulesTableName, ruleId, ruleVersion);

    console.log('📜 Loaded rule',ruleJsonString);

    // Evaluate rule with ZEN Engine - convert string to Buffer
    const engine = new ZenEngine();
    const decision = engine.createDecision(Buffer.from(ruleJsonString, 'utf8'));
    const rawResult = await decision.evaluate(assignmentData);

    console.log('⚖️  Rule evaluation result:', JSON.stringify(rawResult, null, 2));

    // Store event in DynamoDB
   
    // Extract the result
    const result = rawResult.result || {};
    const action = result.action;

    console.log('🎯 Action determined:', action);

    // Take action based on rule result
    if (action === 'create_task') {
      const taskDetails = {
        taskName: result.task_name,
        assignmentId: assignmentData.assignmentId,
        claim: assignmentData.claim,
        createdDate: new Date().toISOString()
      };

      console.log('📋 Creating task:', taskDetails);

      const mcpResponse = await mcpClient.createTask(taskDetails);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Task created successfully',
          action: 'create_task',
          taskDetails: taskDetails,
          mcpResponse: mcpResponse
        })
      };
      
    } else if (action === 'send_email') {
      const emailDetails = {
        to: result.email_to,
        subject: result.email_subject,
        body: result.email_body,
        assignmentId: assignmentData.assignmentId,
        claim: assignmentData.claim
      };

      console.log('📧 Sending email:', emailDetails);

      const mcpResponse = await mcpClient.sendEmail(emailDetails);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Email sent successfully',
          action: 'send_email',
          emailDetails: emailDetails,
          mcpResponse: mcpResponse
        })
      };
      
    } else if (action === 'update_field') {
      const fieldUpdate = {
        fieldName: result.field_name,
        fieldValue: result.field_value,
        assignmentId: assignmentData.assignmentId,
        claim: assignmentData.claim
      };

      console.log('🔄 Updating field:', fieldUpdate);

      const mcpResponse = await mcpClient.updateField(fieldUpdate);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Field updated successfully',
          action: 'update_field',
          fieldUpdate: fieldUpdate,
          mcpResponse: mcpResponse
        })
      };
      
    } else {
      console.log('ℹ️  No action required for this assignment');

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Assignment processed - no action required',
          ruleEvaluated: true,
          assignment: assignmentData,
          result: result
        })
      };
    }

  } catch (error) {
    console.error('❌ Lambda error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process assignment',
        details: error.message,
        stack: error.stack
      })
    };
  }
};