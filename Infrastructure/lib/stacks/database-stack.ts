import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly rulesTable: dynamodb.Table;
  public readonly eventsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Rules table with free tier optimized settings
    this.rulesTable = new dynamodb.Table(this, 'RulesTable', {
      tableName: 'RulesTable',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PROVISIONED, // Use provisioned for predictable free tier
      readCapacity: 5, // Minimum RCU within free tier
      writeCapacity: 5, // Minimum WCU within free tier
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl', // Enable TTL to manage storage costs
    });

    // Events table with free tier optimized settings
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      partitionKey: { name: 'ruleId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED, // Use provisioned for predictable free tier
      readCapacity: 5, // Minimum RCU within free tier
      writeCapacity: 5, // Minimum WCU within free tier
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl', // Enable TTL to manage storage costs
    });
  }
}
