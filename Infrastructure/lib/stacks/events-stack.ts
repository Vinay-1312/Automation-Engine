import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

// import stack classes so props can accept them (keeps app.ts call-site unchanged)
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';

export interface EventStackProps extends cdk.StackProps {
  /**
   * Optional existing rules table to grant read access to the evaluator lambda.
   */
  rulesTable?: dynamodb.ITable;
  /**
   * Optional existing MCP tasks queue to grant send permission from evaluator.
   */
  mcpQueue?: sqs.IQueue;
  /**
   * Path to the built Rules Evaluator lambda code (relative to repo root).
   * If omitted, the default './rules-evaluator/dist' is used.
   */
  rulesEvaluatorCodePath?: string;

  // Accept the stacks passed from app.ts to match call-site:
  databaseStack?: DatabaseStack;
  computeStack?: ComputeStack;
}

export class EventStack extends cdk.Stack {
  public readonly eventBus: events.IEventBus;
  public readonly rulesEvaluatorFn: lambda.Function;

  constructor(scope: Construct, id: string, props: EventStackProps = {}) {
    super(scope, id, props);

    // EventBridge bus used by the app (keeps name compatible with CFN template)
    this.eventBus = new events.EventBus(this, 'RulesEngineEventBus', {
      eventBusName: 'rules-engine-events'
    });

    const codePath = props.rulesEvaluatorCodePath
      ? path.resolve(props.rulesEvaluatorCodePath)
      : path.resolve(__dirname, '../../rules-evaluator/dist');

    this.rulesEvaluatorFn = new lambda.Function(this, 'RulesEvaluatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(codePath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        EVENT_BUS_NAME: this.eventBus.eventBusName,
        RULES_TABLE: props.rulesTable?.tableName ?? '',
        MCP_QUEUE_URL: props.mcpQueue?.queueUrl ?? ''
      }
    });

    if (props.rulesTable) {
      props.rulesTable.grantReadData(this.rulesEvaluatorFn);
    }
    if (props.mcpQueue) {
      props.mcpQueue.grantSendMessages(this.rulesEvaluatorFn);
    }

    // Event rule forwards 'rule-evaluation-request' events from source 'rules-engine'
    new events.Rule(this, 'ForwardToRulesEvaluator', {
      eventBus: this.eventBus,
      description: 'Route rule evaluation requests to the rules evaluator lambda',
      eventPattern: {
        source: ['rules-engine']
      },
      targets: [ new targets.LambdaFunction(this.rulesEvaluatorFn) ]
    });

    new cdk.CfnOutput(this, 'EventBusName', { value: this.eventBus.eventBusName });
    new cdk.CfnOutput(this, 'RulesEvaluatorFunctionArn', { value: this.rulesEvaluatorFn.functionArn });
  }
}