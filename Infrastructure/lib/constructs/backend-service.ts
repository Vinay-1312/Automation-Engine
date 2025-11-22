import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DatabaseStack } from '../stacks/database-stack';

interface BackendServiceProps {
  vpc?: ec2.IVpc;
  databaseStack: DatabaseStack;
}

export class BackendService extends Construct {
  public readonly service: ecs.FargateService;
  public readonly vpc: ec2.IVpc;
  public readonly serviceUrl: string;

  constructor(scope: Construct, id: string, props: BackendServiceProps) {
    super(scope, id);

    // Use provided VPC or create new one
    

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'BackendCluster', {

      containerInsights: false
    });

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Grant DynamoDB permissions
    props.databaseStack.rulesTable.grantReadWriteData(taskDefinition.taskRole);
    props.databaseStack.eventsTable.grantReadWriteData(taskDefinition.taskRole);

    // Grant EventBridge permissions
    taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'events:PutEvents'
      ],
      resources: ['*']
    }));

    // Add Container
    const container = taskDefinition.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromRegistry('355949198757.dkr.ecr.eu-west-2.amazonaws.com/rulesengine/vinay/rules-engine-api:latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'BackendService' }),
      environment: {
        RULES_TABLE_NAME: props.databaseStack.rulesTable.tableName,
        EVENTS_TABLE_NAME: props.databaseStack.eventsTable.tableName,
        AWS_REGION: cdk.Stack.of(this).region,
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    // Create Fargate Service without ALB
    this.service = new ecs.FargateService(this, 'BackendFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true
    });


    new cdk.CfnOutput(this, 'BackendServiceArn', {
      value: this.service.serviceArn,
      description: 'Backend Service ARN'
    });
  }
}
