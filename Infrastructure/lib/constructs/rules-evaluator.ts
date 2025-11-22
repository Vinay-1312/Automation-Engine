import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as targets from 'aws-cdk-lib/aws-events-targets';

import { Construct } from 'constructs';
import { DatabaseStack } from '../stacks/database-stack';

interface RulesEvaluatorProps {
  databaseStack: DatabaseStack;
}

export class RulesEvaluator extends Construct {
  public readonly function: lambda.Function;
   public readonly eventBus: events.IEventBus;

  constructor(scope: Construct, id: string, props: RulesEvaluatorProps) {
    super(scope, id);

     // EventBridge bus used by the app (keeps name compatible with CFN template)
      this.eventBus = new events.EventBus(this, 'RulesEngineEventBus', {
          eventBusName: 'rules-engine-events'
        });

    this.function = new lambda.Function(this, 'RulesEvaluatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../rules-evaluator/src'),
      timeout: cdk.Duration.seconds(30), // Reduced timeout to save costs
      memorySize: 128, // Minimum memory size
      environment: {
        RULES_TABLE_NAME: props.databaseStack.rulesTable.tableName,
        EVENTS_TABLE_NAME: props.databaseStack.eventsTable.tableName,
     },
      retryAttempts: 0, // Disable retries to stay within free tier limits
    });

      this.function.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'sqs:SendMessage',
    'sqs:GetQueueAttributes'
  ],
  resources: ['arn:aws:sqs:*:*:*'] // Or specify specific queue ARNs for better security
}));
    // Grant DynamoDB permissions
    props.databaseStack.rulesTable.grantReadData(this.function);
    props.databaseStack.eventsTable.grantReadWriteData(this.function);

    // Grant permissions to publish to EventBridge
      new events.Rule(this, 'ForwardToRulesEvaluator', {
          eventBus: this.eventBus,
          description: 'Route rule evaluation requests to the rules evaluator lambda',
          eventPattern: {
            source: ['rules-engine']
          },
          targets: [ new targets.LambdaFunction(this.function) ]
        });
          new cdk.CfnOutput(this, 'EventBusName', { value: this.eventBus.eventBusName });
            new cdk.CfnOutput(this, 'RulesEvaluatorFunctionArn', { value: this.function.functionArn });
    
  }
}
