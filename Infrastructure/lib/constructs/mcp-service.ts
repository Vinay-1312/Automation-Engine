import * as cdk from 'aws-cdk-lib';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface McpServiceProps {
  // Remove database dependency
}

export class McpService extends Construct {
  public readonly application: elasticbeanstalk.CfnApplication;
  public readonly environment: elasticbeanstalk.CfnEnvironment;
  public readonly serviceUrl: string;

  constructor(scope: Construct, id: string, props?: McpServiceProps) {
    super(scope, id);

    // Create IAM role for Beanstalk EC2 instances
    const instanceRole = new iam.Role(this, 'McpInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkMulticontainerDocker'),
      ],
    });

    const vpc = new ec2.Vpc(this, 'McpVpc', {
    maxAzs: 2,
    natGateways: 0, // ← This makes it free!
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'PublicSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      },
    ],
  });

    // Create instance profile
    const instanceProfile = new iam.CfnInstanceProfile(this, 'McpInstanceProfile', {
      roles: [instanceRole.roleName],
    });

    // Create service role for Beanstalk
    const serviceRole = new iam.Role(this, 'McpServiceRole', {
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkEnhancedHealth'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkService'),
      ],
    });

    // Create S3 asset from the mcp-server directory - THIS IS THE KEY CHANGE
    const mcpServerAsset = new assets.Asset(this, 'McpServerAsset', {
      path: './../mcp-server',
    });

    // Create Elastic Beanstalk application
    this.application = new elasticbeanstalk.CfnApplication(this, 'McpApplication', {
      applicationName: 'mcp-fastapi-server',
      description: 'FastMCP Server Application',
    });

    // Create application version using the asset
    const appVersion = new elasticbeanstalk.CfnApplicationVersion(this, 'McpAppVersion', {
      applicationName: this.application.ref,
      description: `Version deployed at ${new Date().toISOString()}`,
      sourceBundle: {
        s3Bucket: mcpServerAsset.s3BucketName,
        s3Key: mcpServerAsset.s3ObjectKey,
      },
    });

    // Add dependency - make sure app exists before creating version
    appVersion.addDependency(this.application);

    // Create Beanstalk environment
    this.environment = new elasticbeanstalk.CfnEnvironment(this, 'McpEnvironment', {
      applicationName: this.application.ref,
      environmentName: 'mcp-production',
      solutionStackName: '64bit Amazon Linux 2023 v4.8.0 running Python 3.14',
      versionLabel: appVersion.ref,
      
      optionSettings: [
        // Python-specific settings
        // Environment variables
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'AWS_REGION',
          value: cdk.Stack.of(this).region,
        },
        // Instance settings
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'InstanceType',
          value: 't3.micro',
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.ref,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'ServiceRole',
          value: serviceRole.roleArn,
        },
        // Load balancer settings
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'EnvironmentType',
          value: 'LoadBalanced',
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'LoadBalancerType',
          value: 'application',
        },
        {
  namespace: 'aws:ec2:vpc',
  optionName: 'Subnets',
  value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
},
{
  namespace: 'aws:ec2:vpc',
  optionName: 'AssociatePublicIpAddress',
  value: 'true', // ← Change to true for public subnets
},
        // Health monitoring
        {
          namespace: 'aws:elasticbeanstalk:healthreporting:system',
          optionName: 'SystemType',
          value: 'enhanced',
        },
      ],
    });

    // Set the service URL
    this.serviceUrl = `http://${this.environment.attrEndpointUrl}`;

    // Outputs
    new cdk.CfnOutput(this, 'McpApplicationName', {
      value: this.application.ref,
      description: 'Elastic Beanstalk Application Name',
    });

    new cdk.CfnOutput(this, 'McpEnvironmentUrl', {
      value: this.serviceUrl,
      description: 'MCP Service URL',
    });
  }
}