import fs from 'fs';
import path from 'path';

const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Always start from pristine PostgreSQL schema
let schema = fs.readFileSync(postgresSchemaPath, 'utf8');

// Replace datasource to sqlite
schema = schema.replace(
  /datasource db \{[\s\S]*?provider\s*=\s*"postgresql"[\s\S]*?\}/,
  `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
);

// Quote enum defaults
const enumDefaults = [
  'OWNER',
  'PROJECT_MANAGER',
  'EDITOR',
  'VIEWER',
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'HEALTHY',
  'AT_RISK',
  'CRITICAL',
  'DEADLINE',
  'MEETING',
  'MILESTONE',
  'RELEASE',
  'REVIEW',
  'ASSIGNMENT',
  'COMPLETION',
  'DEADLINE_WARNING',
  'OVERDUE',
  'INVITATION',
  'MENTION',
  'COMMENT',
  'DEPENDENCY_BLOCKED',
  'AI_INSIGHT'
];

enumDefaults.forEach(def => {
  schema = schema.replace(new RegExp(`@default\\(${def}\\)`, 'g'), `@default("${def}")`);
});

// Replace enum field types with String
const enums = [
  'RoleType',
  'ProjectStatus',
  'PriorityLevel',
  'TaskStatus',
  'ProjectHealth',
  'EventType',
  'NotificationType'
];

enums.forEach(enumName => {
  const regex = new RegExp(`\\b${enumName}\\b`, 'g');
  schema = schema.replace(regex, 'String');
});

// Remove enum blocks for SQLite
schema = schema.replace(/enum String \{[\s\S]*?\}/g, '');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✅ Successfully switched Prisma schema to SQLite mode with quoted string defaults!');
