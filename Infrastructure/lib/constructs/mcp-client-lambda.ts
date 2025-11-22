import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { McpService } from './mcp-service';

interface McpClientLambdaProps {
  mcpService: McpService;
}

export class McpClientLambda extends Construct {
  public readonly function: lambda.Function;
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: McpClientLambdaProps) {
    super(scope, id);

    // Create SQS Queue for MCP tasks
    this.queue = new sqs.Queue(this, 'McpTasksQueue', {
      queueName: 'mcp-tasks-queue',
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(1),
      // Free tier optimized settings
      receiveMessageWaitTime: cdk.Duration.seconds(20), // Enable long polling
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create Lambda function
    this.function = new lambda.Function(this, 'McpClientFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../mcp-client/src'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
       // MCP_SERVICE_URL: props.mcpService.serviceUrl,
        QUEUE_URL: this.queue.queueUrl,      },
    });

    // Add SQS trigger
    this.function.addEventSource(new lambdaEventSources.SqsEventSource(this.queue, {
      batchSize: 1, // Process one message at a time to minimize resource usage
      maxBatchingWindow: cdk.Duration.seconds(0), // Disable batching for immediate processing
    }));

    // Grant permissions to access MCP service
    //props.mcpService.grantAccess(this.function);

    // Grant permissions to read from SQS
    this.queue.grantConsumeMessages(this.function);
  }
}
