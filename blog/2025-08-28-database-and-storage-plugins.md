---
slug: database-and-storage-plugins
title: Database and Storage Plugins - MySQL, WebSearch, Wikipedia
authors: [mdierolf]
tags: [tokenring, plugins, database, announcement]
---

# Database and Storage Plugins

New plugins for database integration, web search abstraction, and Wikipedia access.

<!-- truncate -->

## MySQL Plugin

Full MySQL database integration with connection pooling:

### Features
- **Connection Pooling**: Efficient, reusable connections using mysql2
- **SQL Execution**: Asynchronous query execution with result handling
- **Schema Inspection**: Retrieve table schemas via SHOW TABLES and SHOW CREATE TABLE
- **Read/Write Control**: Optional write permission enforcement

### Usage
```typescript
const mysqlResource = new MySQLResource({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp',
  allowWrites: true
});

const result = await mysqlResource.executeSql('SELECT * FROM users');
```

## WebSearch Plugin

Abstract web search interface with pluggable providers:

### Features
- **Pluggable Architecture**: Support for multiple search engines
- **Web & News Search**: General web and news-specific search
- **Page Fetching**: Retrieve web page content
- **Localization**: Country codes, languages, and locations

Provides the foundation for Serper and ScraperAPI integrations.

## Wikipedia Plugin

Wikipedia API integration for knowledge retrieval:

### Features
- **Article Search**: Search Wikipedia articles with limit and offset options
- **Page Content**: Fetch raw wiki markup content by title
- **Retry Logic**: Built-in retry for API requests
- **Multi-Language**: Support for different language Wikipedias

### Usage
```typescript
const wiki = new WikipediaService();
const results = await wiki.search('Token Ring', { limit: 5 });
const content = await wiki.getPage('Token Ring');
```

Enable agents to research topics and access the world's knowledge base.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
