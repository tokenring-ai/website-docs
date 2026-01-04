# AWS Plugin

## Overview

The AWS Plugin for TokenRing AI provides integration with Amazon Web Services, enabling agents to authenticate, manage resources, and execute AWS-related tasks. This plugin leverages the AWS SDK v3 and integrates seamlessly with TokenRing's agent framework, offering tools for S3 operations, account information retrieval, and more.

## Key Features

- **Secure AWS Authentication**: Uses AWS SDK v3 with proper credential management
- **S3 Bucket Listing**: Provides a tool to list all S3 buckets in the configured account
- **Account Identity**: Retrieves AWS account information via STS
- **Plugin Architecture**: Integrates with TokenRing application framework
- **Service Status**: Provides authentication status and account information
- **Chat Commands**: Interactive AWS commands for status checking
- **Generic Client Initialization**: Supports initialization of any AWS SDK client
- **Type-Safe Configuration**: Zod-based schema validation for configuration

## Core Properties

### AWSService Properties

- `region` (string): The AWS region configured for the service
- `name` (string): Always "AWSService"
- `description` (string): Always "Provides AWS functionality"

## Core Methods/API

### AWSService

The main service class that handles AWS SDK clients and authentication.

#### Constructor

`new AWSService(credentials: AWSCredentials)`

Initializes the service with AWS credentials.

#### Methods

- `initializeAWSClient&lt;T&gt;(ClientClass, clientConfig)`: Initializes any AWS SDK client
  - `ClientClass`: The AWS SDK client class to initialize (e.g., S3Client, SNSClient)
  - `clientConfig`: Additional configuration for the client
  - Returns: Initialized AWS SDK client instance

- `getSTSClient()`: Returns or creates an STS client
  - Returns: `STSClient` instance

- `getS3Client()`: Returns or creates an S3 client
  - Returns: `S3Client` instance

- `isAuthenticated()`: Checks if credentials and region are configured
  - Returns: `boolean` indicating if credentials are properly configured

- `getCallerIdentity()`: Retrieves AWS account identity via STS
  - Returns: `&#123; Arn?: string; Account?: string; UserId?: string &#125;`

- `run(signal: AbortSignal)`: Service startup with authentication check
  - `signal`: AbortSignal for service lifecycle management
  - Returns: Promise that resolves when service stops

- `status(agent: Agent)`: Returns service status and account information
  - `agent`: The agent instance
  - Returns: `&#123; active: boolean; service: string; authenticated: boolean; accountInfo?: &#123; Arn?: string; Account?: string; UserId?: string &#125;; error?: string &#125;`

#### AWSCredentials Interface

```typescript
interface AWSCredentials &#123;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
&#125;
```

## Usage Examples

### Basic Service Usage

```typescript
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService(&#123;
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
&#125;);

// Check authentication status
if (awsService.isAuthenticated()) &#123;
  const identity = await awsService.getCallerIdentity();
  console.log(`Account: $&#123;identity.Account&#125;`);
  console.log(`ARN: $&#123;identity.Arn&#125;`);
&#125;
```

### Using S3 Client

```typescript
import &#123; ListBucketsCommand &#125; from "@aws-sdk/client-s3";
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService(&#123;
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
&#125;);

const s3Client = awsService.getS3Client();
const command = new ListBucketsCommand(&#123;&#125;);
const response = await s3Client.send(command);
console.log('S3 Buckets:', response.Buckets);
```

### Generic AWS Client Initialization

```typescript
import &#123; SNSClient &#125; from "@aws-sdk/client-sns";
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService(&#123;
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
&#125;);

const snsClient = awsService.initializeAWSClient(SNSClient);
```

### Using the S3 Buckets Tool

```typescript
import &#123; TokenRingApp &#125; from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp(&#123;
  plugins: [
    awsPlugin.withConfig(&#123;
      aws: &#123;
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      &#125;
    &#125;)
  ]
&#125;);

const agent = app.createAgent();
const result = await agent.executeTool("aws_listS3Buckets", &#123;&#125;);
console.log('S3 Buckets:', result.buckets);
```

### Using AWS Chat Commands

```typescript
import &#123; TokenRingApp &#125; from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp(&#123;
  plugins: [
    awsPlugin.withConfig(&#123;
      aws: &#123;
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      &#125;
    &#125;)
  ]
&#125;);

const agent = app.createAgent();
const result = await agent.executeCommand("aws status");
```

## Configuration

### Environment Variables

- `AWS_ACCESS_KEY_ID`: Your AWS Access Key ID (required)
- `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key (required)
- `AWS_REGION`: Your AWS region (e.g., 'us-east-1', required)
- `AWS_SESSION_TOKEN`: Optional session token for temporary credentials

### Configuration Schema

```typescript
interface AWSCredentials &#123;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
&#125;
```

### Setup Requirements

- **Required**: `accessKeyId`, `secretAccessKey`, `region`
- **Optional**: `sessionToken` (for temporary credentials)

### Authentication Flow

1. **Service Initialization**: AWS credentials and region are provided
2. **Client Setup**: STS and S3 clients are initialized with credentials
3. **Authentication Check**: Credentials are verified during service startup
4. **Status Reporting**: Caller identity is retrieved and reported
5. **Tool Access**: Tools can only execute if authentication is successful

## Integration

### Plugin Installation

When added to a TokenRing application, the plugin automatically registers the AWSService, tools, and chat commands:

```typescript
import &#123; TokenRingApp &#125; from '@tokenring-ai/app';
import awsPlugin from '@tokenring-ai/aws';

const app = new TokenRingApp(&#123;
  plugins: [
    awsPlugin.withConfig(&#123;
      aws: &#123;
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        sessionToken: process.env.AWS_SESSION_TOKEN // optional
      &#125;
    &#125;)
  ]
&#125;);
```

### Agent Usage

Agents can access the AWSService directly to perform AWS operations:

```typescript
const awsService = agent.requireServiceByType(AWSService);
const identity = await awsService.getCallerIdentity();
```

### Chat Commands

The `aws status` command can be used in chat to view authentication status.

## Best Practices

- Store AWS credentials securely using environment variables or secret management
- Use IAM roles with minimal required permissions for production deployments
- Consider using temporary credentials (session tokens) for enhanced security
- Always verify credentials before performing critical operations
- Handle authentication failures gracefully in your application

## Testing

### Unit Tests

Run tests with:

```bash
bun test
```

The project uses vitest for unit testing.

## Error Handling

### Common Errors

- **Credentials Not Configured**: Occurs if `accessKeyId`, `secretAccessKey`, or `region` are missing
- **Authentication Failure**: Occurs if credentials are invalid or lack required permissions
- **Service Unavailable**: AWS services may be temporarily unavailable
- **Region Mismatch**: Region configuration does not match the AWS account

### Troubleshooting Steps

- Verify AWS credentials are correct
- Check IAM permissions for STS GetCallerIdentity and S3 ListBuckets
- Ensure region configuration matches the AWS account region
- Check network connectivity to AWS services

## Related Components

- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service and tool management
- `@aws-sdk/client-s3`: AWS S3 client
- `@aws-sdk/client-sts`: AWS STS client
