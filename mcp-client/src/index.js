require('dotenv').config();
const Groq = require('groq-sdk');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

class MCPLambdaClient {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.mcpClients = new Map();
        this.tools = [];
    }

    async initializeMCPServers() {
        const servers = {
            "action_server": {
                "url": process.env.MCP_SERVER_URL || "http://localhost:8000/mcp",
                "transport": "streamable_http",
            }
        };

        for (const [name, config] of Object.entries(servers)) {
            try {
                console.log(`Connecting to MCP server: ${name}`);

                const transport = new StreamableHTTPClientTransport(new URL(config.url));
                const client = new Client({
                    name: "mcp-lambda-client",
                    version: "1.0.0",
                });

                await client.connect(transport);

                const serverInfo = await client.getServerInfo();
                console.log(`Connected to ${name}:`, serverInfo);

                this.mcpClients.set(name, client);

                const tools = await client.listTools();
                if (tools.tools) {
                    tools.tools.forEach(tool => {
                        this.tools.push({
                            ...tool,
                            serverName: name
                        });
                    });
                }

            } catch (error) {
                console.error(`Failed to connect to MCP server ${name}:`, error.message);
            }
        }

        console.log(`Total tools available: ${this.tools.length}`);
        return this.tools.length > 0;
    }

    async processActionWithGroq(messageBody) {
        try {
            const actionData = JSON.parse(messageBody);
            console.log('Processing action:', actionData);

            if (!this.tools.length) {
                throw new Error('No MCP tools available');
            }

            const toolsText = this.tools.map(tool =>
                `${tool.name}: ${tool.description}`
            ).join('\n');

            const prompt = `You are an action execution agent. You have access to these tools:
${toolsText}

Task: ${actionData.action || actionData.message || messageBody}

Choose the most appropriate tool and execute it. Respond with the tool name and parameters.`;

            const completion = await this.groq.chat.completions.create({
                model: "llama3-groq-70b-8192-tool-use-preview",
                messages: [{ role: "user", content: prompt }],
                tools: this.tools.map(tool => ({
                    type: "function",
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.inputSchema || {}
                    }
                })),
                tool_choice: "auto",
                temperature: 0.1,
                max_tokens: 1000
            });

            const toolCalls = completion.choices[0]?.message?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
                const results = [];

                for (const toolCall of toolCalls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);

                    console.log(`Executing tool: ${toolName} with args:`, toolArgs);

                    const tool = this.tools.find(t => t.name === toolName);
                    if (tool) {
                        const client = this.mcpClients.get(tool.serverName);
                        try {
                            const result = await client.callTool({
                                name: toolName,
                                arguments: toolArgs
                            });
                            results.push({
                                tool: toolName,
                                result: result
                            });
                        } catch (toolError) {
                            console.error(`Tool execution error for ${toolName}:`, toolError);
                            results.push({
                                tool: toolName,
                                error: toolError.message
                            });
                        }
                    }
                }

                return {
                    success: true,
                    action: actionData,
                    results: results
                };
            }

            return {
                success: false,
                action: actionData,
                error: "No tool calls generated"
            };

        } catch (error) {
            console.error('Groq API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cleanup() {
        for (const [name, client] of this.mcpClients.entries()) {
            try {
                await client.close();
                console.log(`Closed connection to ${name}`);
            } catch (error) {
                console.error(`Error closing connection to ${name}:`, error);
            }
        }
    }
}

// Lambda handler function
exports.handler = async (event) => {
    console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));

    const mcpClient = new MCPLambdaClient();

    try {
        // Initialize MCP connections
        const connected = await mcpClient.initializeMCPServers();
        if (!connected) {
            throw new Error('Failed to connect to any MCP servers');
        }

        const results = [];

        // Process SQS messages
        for (const record of event.Records) {
            try {
                console.log('Processing SQS message:', record.messageId);

                const result = await mcpClient.processActionWithGroq(record.body);

                results.push({
                    messageId: record.messageId,
                    result: result
                });

                console.log(`Message ${record.messageId} processed successfully`);

            } catch (error) {
                console.error(`Error processing message ${record.messageId}:`, error);
                // Return partial failure for this message
                results.push({
                    messageId: record.messageId,
                    error: error.message
                });
                // For SQS, we need to report batch item failures
                throw error; // This will mark the message as failed
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully processed messages',
                results: results
            })
        };

    } catch (error) {
        console.error('Lambda execution error:', error);
        throw error; // Let Lambda handle the retry logic

    } finally {
        await mcpClient.cleanup();
    }
};