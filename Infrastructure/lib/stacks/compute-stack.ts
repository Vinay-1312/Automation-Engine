import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { RulesEvaluator } from '../constructs/rules-evaluator';
import { McpService } from '../constructs/mcp-service';
import { BackendService } from '../constructs/backend-service';
import { McpClientLambda } from '../constructs/mcp-client-lambda';
import { DatabaseStack } from './database-stack';

interface ComputeStackProps extends cdk.StackProps {
  databaseStack: DatabaseStack;
}

export class ComputeStack extends cdk.Stack {
  public readonly rulesEvaluator: RulesEvaluator;
  public readonly backendService: BackendService;
  public readonly mcpService: McpService;
  public readonly mcpClientLambda: McpClientLambda;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create VPC for all compute resources
  
    // Backend Service (.NET Web API)
    /*
    this.backendService = new BackendService(this, 'BackendService', {
      
      databaseStack: props.databaseStack
    });
*/
    // Rules Evaluator Lambda
    this.rulesEvaluator = new RulesEvaluator(this, 'RulesEvaluator', {
      databaseStack: props.databaseStack
    });

    // MCP Service on ECS
    this.mcpService = new McpService(this, 'McpService');

    // MCP Client Lambda with SQS
    this.mcpClientLambda = new McpClientLambda(this, 'McpClientLambda', {
      mcpService: this.mcpService
    });
  }
}
