# AWS Plugin

## Overview

The AWS Plugin for Token Ring AI provides integration with Amazon Web Services, enabling authentication verification and S3 operations. This plugin leverages the AWS SDK v3 and integrates seamlessly with Token Ring's agent framework, offering tools for S3 bucket listing and AWS account identity retrieval via STS.

## Key Features

- **AWS Authentication**: Uses AWS SDK v3 with credential management for STS and S3 clients
- **S3 Bucket Listing**: Provides a tool to list all S3 buckets in the configured account
- **Account Identity**: Retrieves AWS account information via STS GetCallerIdentity
- **Service Architecture**: Implements TokenRingService for consistent service lifecycle management
- **Chat Commands**: Interactive `aws status` command for authentication status checking
- **Generic Client Initialization**: Supports initialization of any AWS SDK client via `initializeAWSClient`
- **Flexible Configuration**: Zod-based configuration schema for credentials and region
- **Singleton Client Management**: AWS SDK clients are cached and reused automatically

## Core Components

### AWSService

The main service class that provides AWS integration functionality.

**Service Properties:**

- `name: "AWSService"` - Service identifier
- `description: "Provides AWS functionality"` - Service description
- `options`: Configuration options object containing:
  - `accessKeyId: string` - AWS Access Key ID
  - `secretAccessKey: string` - AWS Secret Access Key
  - `sessionToken?: string` - Optional AWS Session Token
  - `region: string` - The configured AWS region
- `stsClient?: STSClient` - Singleton STS client (private, auto-created, cached)
- `s3Client?: S3Client` - Singleton S3 client (private, auto-created, cached)

**Configuration Interface:**

```typescript
interface AWSCredentials {
  accessKeyId: string;      // Required: AWS Access Key ID
  secretAccessKey: string;  // Required: AWS Secret Access Key
  sessionToken?: string;    // Optional: AWS Session Token for temporary credentials
  region: string;           // Required: AWS region (e.g., 'us-east-1')
}
```

**Service Methods:**

```typescript
class AWSService implements TokenRingService {
  name = "AWSService";
  description = "Provides AWS functionality";

  constructor({ accessKeyId, secretAccessKey, sessionToken, region }: AWSCredentials);

  // Client Management
  initializeAWSClient<T>(
    ClientClass: new (config: {
      region: string;
      credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string };
    } & Record<string, unknown>) => T,
    clientConfig?: Record<string, unknown>
  ): T;

  getSTSClient(): STSClient;
  getS3Client(): S3Client;

  // Authentication
  isAuthenticated(): boolean;
  getCallerIdentity(): Promise<{ Arn?: string; Account?: string; UserId?: string }>;

  // Service Lifecycle
  run(signal: AbortSignal): Promise<void>;

  // Status Reporting
  status(agent: Agent): Promise<{
    active: boolean;
    service: string;
    authenticated: boolean;
    accountInfo?: { Arn?: string; Account?: string; UserId?: string };
    error?: string;
  }>;
}
```

### Tools

The AWS plugin provides one tool for S3 operations registered via the chat service during plugin installation.

#### `aws_listS3Buckets`

Lists all S3 buckets in the configured AWS account and region.

**Tool Definition:**

```typescript
{
  name: "aws_listS3Buckets",
  displayName: "Aws/listS3BucketsTool",
  description: "Lists all S3 buckets in the configured AWS account and region.",
  inputSchema: z.object({}),
  execute: async (_args: z.input<typeof inputSchema>, agent: Agent) => Promise<{
    type: 'json';
    data: { buckets: Array<{ Name: string; CreationDate: Date }> }
  }>
}
```

**Usage in Agent:**

```typescript
const agent = app.createAgent();

// Execute the tool
const result = await agent.callTool("aws_listS3Buckets", {});
console.log("S3 Buckets:", result.data.buckets);

result.data.buckets.forEach((bucket) => {
  console.log(`Bucket: ${bucket.Name} - Created: ${bucket.CreationDate}`);
});
```

**Internal Implementation:**

```typescript
import { ListBucketsCommand } from "@aws-sdk/client-s3";

async function execute(_args: {}, agent: Agent) {
  const awsService = agent.requireServiceByType(AWSService);

  if (!awsService.isAuthenticated()) {
    throw new Error(`[aws_listS3Buckets] AWS credentials not configured in AWSService.`);
  }

  try {
    const s3Client = awsService.getS3Client();
    const command = new ListBucketsCommand({});
    const response: any = await s3Client.send(command);
    const buckets = (response.Buckets || []).map((bucket: any) => ({
      Name: bucket.Name,
      CreationDate: bucket.CreationDate,
    }));
    return { type: 'json' as const, data: { buckets } };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[aws_listS3Buckets] Error listing S3 buckets: ${message}`);
  }
}
```

### Chat Commands

#### `aws`

Provides a command group for AWS-related operations.

**Sub-commands:**

- `status`: View current AWS authentication status and account information

**Command Structure:**

```typescript
{
  description: "AWS commands for authentication and status",
  execute: async (remainder: string, agent: Agent) => void,
  help: string
}
```

**Usage:**

```bash
aws status      # Display current AWS authentication status
```

**Usage in Agent:**

```typescript
const agent = app.createAgent();
await agent.sendMessage("aws status");

// Output:
// AWS Authentication Status:
//   Account: 123456789012
//   Arn: arn:aws:iam::123456789012:user/tokenring-user
//   UserId: AIDAEXAMPLE123456
//   Region: us-east-1
```

**Command Implementation:**

```typescript
async function execute(remainder: string, agent: Agent) {
  const awsService = agent.requireServiceByType(AWSService);
  const [subcommand, ..._args] = remainder.trim().split(/\s+/);

  if (subcommand === "status") {
    try {
      const identity = await awsService.getCallerIdentity();
      const lines: string[] = [
        "AWS Authentication Status:",
        indent([
          `Account: ${identity.Account}`,
          `Arn: ${identity.Arn}`,
          `UserId: ${identity.UserId}`,
          `Region: ${awsService.options.region}`
        ], 1)
      ];
      agent.infoMessage(lines.join("\n"));
    } catch (error: unknown) {
      agent.errorMessage("Failed to get AWS caller identity:", error as Error);
      agent.infoMessage("Please ensure AWS credentials and region are correctly configured in the AWSService.");
    }
  } else {
    agent.chatOutput(help);
  }
}
```

## Configuration

### Plugin Configuration Schema

The AWS plugin configuration is defined using Zod schema:

```typescript
import {z} from "zod";

export const AWSConfigSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sessionToken: z.string().optional(),
  region: z.string(),
}).strict();

const packageConfigSchema = z.object({
  aws: AWSConfigSchema.optional(),
});
```

**Configuration Structure:**

```typescript
interface AWSConfig {
  aws?: {
    accessKeyId: string;      // Required by constructor
    secretAccessKey: string;  // Required by constructor
    sessionToken?: string;    // Optional: AWS session token for temporary credentials
    region: string;           // Required by constructor
  };
}
```

**Configuration Example:**

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp({
  plugins: [
    awsPlugin
  ]
});

// Configure credentials after plugin registration
app.config = {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1'
  }
};
```

**Recommended Configuration Using Plugin Registration:**

```typescript
app.install(awsPlugin, {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1',
    sessionToken: process.env.AWS_SESSION_TOKEN // optional
  }
});
```

### Required Configuration Parameters

- **accessKeyId**: AWS Access Key ID for authentication
- **secretAccessKey**: AWS Secret Access Key for authentication
- **region**: AWS region where credentials apply (e.g., 'us-east-1', 'us-west-2')

### Optional Configuration Parameters

- **sessionToken**: AWS session token for temporary credentials or assume-role scenarios

## Integration

### Plugin Registration

The AWS plugin automatically registers the following components when configured in the app config:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp();

app.install(awsPlugin, {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1'
  }
});

// Service automatically available
const awsService = app.requireService('AWSService');
```

**Component Registration Flow:**

1. Plugin install phase waits for ChatService
2. Registers tool `aws_listS3Buckets` with ChatService
3. Waits for AgentCommandService
4. Registers command `aws` with AgentCommandService
5. Adds AWSService instance to app services

**Plugin Code:**

```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.aws) {
      app.waitForService(ChatService, chatService =>
        chatService.addTools(tools)
      );
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      app.addServices(new AWSService(config.aws));
    }
  },
  config: packageConfigSchema
};
```

### Service Access

Agents can access the AWSService directly:

```typescript
import AWSService from "@tokenring-ai/aws";

const agent = app.createAgent();
const awsService = agent.requireServiceByType(AWSService);

// Check authentication
if (awsService.isAuthenticated()) {
  const identity = await awsService.getCallerIdentity();
  console.log(`Account: ${identity.Account}`);
  console.log(`ARN: ${identity.Arn}`);
  console.log(`User ID: ${identity.UserId}`);
}
```

### Tool Usage

The plugin automatically adds the `aws_listS3Buckets` tool to the agent's tool registry:

```typescript
const app = new TokenRingApp();
app.install(awsPlugin, {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!
  }
});

const agent = app.createAgent();

// Use the S3 buckets tool (no parameters required)
const result = await agent.callTool("aws_listS3Buckets", {});
console.log('S3 Buckets:', result.data.buckets);
```

### Command Usage

The plugin automatically adds the `aws` command to the agent's command interface:

```typescript
const app = new TokenRingApp();
app.install(awsPlugin, {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!
  }
});

const agent = app.createAgent();

// Use the aws status command
await agent.sendMessage("aws status");
```

## Usage Examples

### Basic Service Initialization

```typescript
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Check authentication status
if (awsService.isAuthenticated()) {
  const identity = await awsService.getCallerIdentity();
  console.log(`Account: ${identity.Account}`);
  console.log(`ARN: ${identity.Arn}`);
  console.log(`User ID: ${identity.UserId}`);
}
```

### Listing S3 Buckets

**Via Tool (Recommended):**

```typescript
const agent = app.createAgent();
const result = await agent.callTool("aws_listS3Buckets", {});
console.log('S3 Buckets:', result.data.buckets);

result.data.buckets.forEach((bucket) => {
  console.log(`Bucket: ${bucket.Name} - Created: ${bucket.CreationDate}`);
});
```

**Via Service Direct:**

```typescript
const s3Client = awsService.getS3Client();
const command = new ListBucketsCommand({});
const response = await s3Client.send(command);
console.log('S3 Buckets:', response.Buckets);
```

### Generic AWS Client Initialization

The service provides a flexible method to initialize any AWS SDK client:

```typescript
import { SNSClient, ListTopicsCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!
});

// Initialize SNS client for Simple Notification Service
const snsClient = awsService.initializeAWSClient(SNSClient);
const topics = await snsClient.send(new ListTopicsCommand({}));
console.log("SNS Topics:", topics.Topics?.map(t => t.TopicArn));

// Initialize DynamoDB client with custom endpoint
const dynamoClient = awsService.initializeAWSClient(DynamoDBClient, {
  endpoint: "https://custom-dynamodb.endpoint.amazonaws.com"
});
const tables = await dynamoClient.send(new ListTablesCommand({}));
console.log("DynamoDB Tables:", tables.TableNames);

// Initialize EC2 client
const ec2Client = awsService.initializeAWSClient(EC2Client);
const instances = await ec2Client.send(new DescribeInstancesCommand({}));
console.log("EC2 Instances:", instances.Reservations?.[0]?.Instances);
```

**Client Configuration Options:**

All initialized clients share the service's base region and credentials. Additional options are merged per-client:

```typescript
// Both clients use service's credentials and default region
const dbClient = awsService.initializeAWSClient(DynamoDBClient, {
  endpoint: "custom-endpoint.amazonaws.com",  // Override default endpoint
  useFipsEndpoint: true                        // Enable FIPS endpoints
});
```

### Authentication Verification

```typescript
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!
});

// Check if credentials are configured (basic validation)
console.log("Authenticated:", awsService.isAuthenticated());

// Get detailed account information
try {
  const status = await awsService.getCallerIdentity();
  console.log("Account:", status.Account);
  console.log("ARN:", status.Arn);
  console.log("User ID:", status.UserId);
} catch (error) {
  console.error("Authentication failed:", error.message);
}
```

### Service Status Reporting

```typescript
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!
});

const agent = app.createAgent();
const serviceStatus = await awsService.status(agent);

console.log("Active:", serviceStatus.active);
console.log("Authenticated:", serviceStatus.authenticated);
if (serviceStatus.accountInfo) {
  console.log("Account:", serviceStatus.accountInfo.Account);
  console.log("ARN:", serviceStatus.accountInfo.Arn);
}
if (serviceStatus.error) {
  console.error("Error:", serviceStatus.error);
}
```

**Status Object Structure:**

```typescript
{
  active: boolean;              // Whether the service is running
  service: string;              // Service name ("AWSService")
  authenticated: boolean;       // Whether credentials validated
  accountInfo?: {              // Account identity if authenticated
    Arn?: string;              // AWS ARN of identity
    Account?: string;          // AWS Account ID
    UserId?: string;           // AWS User ID
  };
  error?: string;              // Error message if validation failed
}
```

### Accessing STS Client

```typescript
import AWSService from "@tokenring-ai/aws";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const agent = app.createAgent();
const awsService = agent.requireServiceByType(AWSService);

// Get STS client for authentication operations
const stsClient = awsService.getSTSClient();

// Perform STS operations
const command = new GetCallerIdentityCommand({});
const response = await stsClient.send(command);
console.log('Account:', response.Account);
console.log('User ID:', response.UserId);
console.log('ARN:', response.Arn);
```

### Complete Agent Integration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp();

app.install(awsPlugin, {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!
  }
});

const agent = app.createAgent();

// List S3 buckets using the tool
const bucketsResult = await agent.callTool("aws_listS3Buckets", {});
console.log('S3 Buckets:', bucketsResult.data.buckets);

// Check authentication status using the command
await agent.sendMessage("aws status");
```

## Client Management Patterns

### Singleton Pattern

AWS SDK clients are cached and reused across operations to minimize connection overhead:

```typescript
const s3Client1 = awsService.getS3Client();  // Creates if not exists
const s3Client2 = awsService.getS3Client();  // Returns cached instance

// Both references point to the same S3Client instance
console.log(s3Client1 === s3Client2);  // true
```

### Generic Client Initialization

Use `initializeAWSClient()` for cross-service initialization with shared credentials:

```typescript
// Initialize any AWS SDK client
const sns = awsService.initializeAWSClient(SNSClient);
const ddb = awsService.initializeAWSClient(DynamoDBClient, {
  endpoint: 'custom.s3.amazonaws.com'
});
const ecs = awsService.initializeAWSClient(EC2Client, {
  region: 'ap-southeast-1'
});
```

## Service Methods

### `initializeAWSClient<T>(ClientClass, clientConfig)`

Initializes any AWS SDK client with the configured credentials.

**Type Parameters:**

- `T`: The type of AWS SDK client to create

**Parameters:**

- `ClientClass`: The AWS SDK client class to initialize (e.g., `S3Client`, `DynamoDBClient`, `SNSClient`)
- `clientConfig`: Additional configuration that will be merged with service credentials and region

**Returns:** Initialized AWS SDK client instance

**Example:**

```typescript
// Initialize S3 client (also provided by getS3Client)
const s3Client = awsService.initializeAWSClient(S3Client);

// Initialize SNS client with custom endpoint
const snsClient = awsService.initializeAWSClient(SNSClient, {
  endpoint: 'https://custom-endpoint.amazonaws.com'
});

// Initialize DynamoDB client
const dynamoClient = awsService.initializeAWSClient(DynamoDBClient);

// Initialize client for any AWS service
const kinesisClient = awsService.initializeAWSClient(KinesisClient, {
  region: 'us-west-2'
});
```

### `getSTSClient()`

Gets or creates an STS client for AWS identity operations.

**Returns:** `STSClient` singleton instance

**Example:**

```typescript
const stsClient = awsService.getSTSClient();

// Get caller identity
const identity = await stsClient.send(new GetCallerIdentityCommand({}));
console.log('Account:', identity.Account);

// Assume role or other STS operations
const assumedRole = await stsClient.send(new AssumeRoleCommand({
  RoleArn: 'arn:aws:iam::123456789012:role/MyRole',
  RoleSessionName: 'session'
}));
```

### `getS3Client()`

Gets or creates an S3 client for S3 operations.

**Returns:** `S3Client` singleton instance

**Example:**

```typescript
const s3Client = awsService.getS3Client();

// List buckets
const buckets = await s3Client.send(new ListBucketsCommand({}));

// Put object
await s3Client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: 'content'
}));

// Get object
const getObject = await s3Client.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt'
}));
```

**Note:** This method is primarily for S3 bucket listing via the AWS plugin's tool. For comprehensive S3 operations, consider using the dedicated S3 package (`@tokenring-ai/s3`).

### `isAuthenticated()`

Checks if credentials and region are properly configured in the service.

**Returns:** `boolean` - true if credentials are configured and valid, false otherwise

**Example:**

```typescript
if (awsService.isAuthenticated()) {
  console.log('AWS is authenticated and ready for operations');
} else {
  console.log('AWS credentials not configured');
}
```

### `getCallerIdentity()`

Retrieves the AWS account identity via STS GetCallerIdentity.

**Returns:** `{ Arn?: string; Account?: string; UserId?: string }`

**Throws:** Error if service is not authenticated (`isAuthenticated()` returns false)

**Example:**

```typescript
try {
  const identity = await awsService.getCallerIdentity();
  console.log(`Account: ${identity.Account}`);
  console.log(`ARN: ${identity.Arn}`);
  console.log(`User ID: ${identity.UserId}`);
} catch (error) {
  console.error('Authentication failed:', error.message);
  // Ensure credentials and region are configured
}
```

### `run(signal: AbortSignal)`

Starts the AWSService and validates authentication during startup.

**Parameters:**

- `signal`: AbortSignal for service lifecycle management

**Returns:** Promise that resolves when service stops (waits for AbortSignal)

**Example:**

```typescript
const controller = new AbortController();
const { signal } = controller;

// Start the service (blocks until signal is aborted)
await awsService.run(signal);

// Stop the service
controller.abort();
```

### `status(agent: Agent)`

Reports the current service status and account information.

**Parameters:**

- `agent`: The agent instance for error reporting

**Returns:** Status object with:
- `active: boolean` - Whether the service is active
- `service: string` - Service name ("AWSService")
- `authenticated: boolean` - Whether credentials are authenticated
- `accountInfo?: { Arn?: string; Account?: string; UserId?: string }` - Account identity information
- `error?: string` - Error message if authentication failed

**Example:**

```typescript
const agent = app.createAgent();
const status = await awsService.status(agent);

console.log(`Active: ${status.active}`);
console.log(`Authenticated: ${status.authenticated}`);
if (status.accountInfo) {
  console.log(`Account: ${status.accountInfo.Account}`);
  console.log(`ARN: ${status.accountInfo.Arn}`);
  console.log(`User ID: ${status.accountInfo.UserId}`);
}

if (status.error) {
  console.error(`Error: ${status.error}`);
}
```

## Best Practices

### Credential Security

- Store AWS credentials securely using environment variables or secret management
- Never commit credentials to version control
- Use IAM users with minimal required permissions:
  - For `aws_listS3Buckets`: `s3:ListAllMyBuckets`
  - For STS operations: `sts:GetCallerIdentity`
  - For custom client operations: IAM roles based on specific service permissions
- Rotate credentials regularly
- Consider using temporary credentials (session tokens) for enhanced security in production

### Service Management

- Leverage singleton pattern for AWS SDK clients to reuse connections
- Always handle AbortSignal for proper service lifecycle management
- Monitor service startup failures in production
- Use `initializeAWSClient()` for cross-service initialization to share credentials

### Error Handling

- Always check `isAuthenticated()` before AWS operations
- Wrap tool operations with error handling
- Use agent services for user-facing error messages
- Prefix errors with tool names for debugging (`[aws_listS3Buckets]`)
- Handle authentication failures gracefully in your application

### Performance

- AWS SDK clients are cached and reused (singleton pattern)
- Use appropriate timeout configurations for sensitive operations
- Consider batch operations for multiple S3 interactions
- Minimize unnecessary authentication checks

### Configuration

- Always include all required configuration parameters in constructor
- Validate region configuration matches your AWS account
- Consider using environment variables for credential storage
- Store session tokens securely for temporary credentials

## Error Handling

### Service-Level Errors

Service initialization and authentication are validated during startup in the `run()` method:

```typescript
async run(signal: AbortSignal): Promise<void> {
  console.log("AWSService starting");
  try {
    const identity = await this.getCallerIdentity();
    console.log("AWS authentication successful:", identity);
  } catch (error: any) {
    console.error("AWSService failed to start:", error.message);
    // Service continues running but will fail operations
  }
  return waitForAbort(signal, async (ev) => {
    console.log("AWSService stopping");
  });
}
```

### Tool Execution Errors

Tool errors are wrapped with tool-name prefixes for clear error attribution:

```typescript
async execute(_args: {}, agent: Agent) {
  const awsService = agent.requireServiceByType(AWSService);

  if (!awsService.isAuthenticated()) {
    throw new Error(`[aws_listS3Buckets] AWS credentials not configured in AWSService.`);
  }

  try {
    // ... operation
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[aws_listS3Buckets] Error listing S3 buckets: ${message}`);
  }
}
```

### Chat Command Errors

Chat commands use the agent service to communicate errors to the user:

```typescript
async execute(remainder: string, agent: Agent) {
  const awsService = agent.requireServiceByType(AWSService);
  const [subcommand, ..._args] = remainder.trim().split(/\s+/);

  if (subcommand === "status") {
    try {
      const identity = await awsService.getCallerIdentity();
      const lines: string[] = [
        "AWS Authentication Status:",
        indent([
          `Account: ${identity.Account}`,
          `Arn: ${identity.Arn}`,
          `UserId: ${identity.UserId}`,
          `Region: ${awsService.options.region}`
        ], 1)
      ];
      agent.infoMessage(lines.join("\n"));
    } catch (error: unknown) {
      agent.errorMessage("Failed to get AWS caller identity:", error as Error);
      agent.infoMessage("Please ensure AWS credentials and region are correctly configured in the AWSService.");
    }
  }
}
```

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| `AWS credentials are not configured` | Missing accessKeyId, secretAccessKey, or region in constructor | Ensure credentials are provided to AWSService constructor |
| `Failed to get AWS caller identity` | Authentication failure or insufficient STS permissions | Check IAM permissions for sts:GetCallerIdentity |
| `[aws_listS3Buckets] AWS credentials not configured` | Tool cannot access authenticated AWSService | Ensure plugin is installed with credentials configuration |
| `[aws_listS3Buckets] Error listing S3 buckets` | S3 operation failure | Check IAM permissions for s3:ListAllMyBuckets and network connectivity |

### Error Handling Pattern

Always use try-catch blocks when calling service methods:

```typescript
try {
  const identity = await awsService.getCallerIdentity();
  // Handle successful result
} catch (error) {
  if (error.message.includes('not configured')) {
    // Handle missing credentials
  } else if (error.message.includes('STS')) {
    // Handle STS permission issues
  } else {
    // Handle other errors
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage

# Run type checking and build verification
bun run build

# Run ESLint and fix formatting issues
bun run eslint
```

The package uses vitest for unit testing with node environment.

### Testing Focus Areas

- S3 bucket listing functionality
- STS identity retrieval
- Authentication status checks
- Service lifecycle management
- Client initialization patterns
- Error handling and edge cases

## Dependencies

```json
{
  "@tokenring-ai/app": "0.2.0",
  "@tokenring-ai/agent": "0.2.0",
  "@tokenring-ai/chat": "0.2.0",
  "@aws-sdk/client-s3": "^3.978.0",
  "@aws-sdk/client-sts": "^3.978.0",
  "@tokenring-ai/filesystem": "0.2.0",
  "node-fetch": "^3.3.2",
  "zod": "^4.3.6"
}
```

**Key Dependencies:**

- **@tokenring-ai/app**: Application framework for plugin registration and service management
- **@tokenring-ai/agent**: Agent framework for tool execution and service access
- **@tokenring-ai/chat**: Chat service for tool and command registration
- **@tokenring-ai/filesystem**: Filesystem utilities
- **@aws-sdk/client-s3**: S3 service client for bucket listing operations
- **@aws-sdk/client-sts**: STS service client for caller identity verification
- **zod**: Runtime type validation for configuration

**Unused Dependency Note:** The package.json lists `node-fetch: ^3.3.2` as a dependency but it is not currently used in the codebase. This may be kept for potential future extensions.

## Package Structure

```
pkg/aws/
├── index.ts                                  # Main exports (AWSService, AWSConfigSchema)
├── AWSService.ts                             # Core service class implementing TokenRingService
├── plugin.ts                                 # Token Ring plugin registration and service setup
├── tools.ts                                  # Barrel export for all tools
├── tools/
│   └── listS3BucketsTool.ts                 # S3 bucket listing tool implementation
├── chatCommands.ts                           # Chat command exports (barrel)
├── commands/
│   └── aws.ts                               # AWS chat command with status subcommand
├── package.json                              # Package metadata and dependencies
├── schema.ts                                 # Configuration schema definitions
├── vitest.config.ts                          # Test configuration
└── LICENSE                                   # License file (MIT)
```

## Related Components

- **AWSService.ts**: Main service implementation with:
  - Client management (STS, S3)
  - Authentication and identity verification
  - Generic client initialization
  - Service lifecycle management
  - Status reporting
- **chatCommands.ts**: Chat command definitions and exports
- **tools.ts**: Tool definitions and barrel export
- **commands/aws.ts**: AWS command handler with status subcommand
- **tools/listS3BucketsTool.ts**: S3 bucket listing tool with error handling
- **plugin.ts**: Plugin registration via install method
- **index.ts**: Public API exports and configuration schema
- **schema.ts**: Zod schema definitions for configuration

## Additional Resources

- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [STS GetCallerIdentity API](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html)
- [S3 Bucket Operations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html)
- [Token Ring Documentation](https://github.com/tokenring-ai/tokenring)
- [IAM Permissions Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## License

MIT License - see LICENSE file for details.
