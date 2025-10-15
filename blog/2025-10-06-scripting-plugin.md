---
slug: scripting-plugin
title: Scripting Plugin - Workflow Automation
authors: [mdierolf]
tags: [tokenring, plugins, scripting, automation, announcement]
---

# Scripting Plugin - Workflow Automation

The Scripting plugin brings powerful workflow automation with variables, functions, and LLM integration.

<!-- truncate -->

## Key Features

### 📝 Variables
Store and manipulate data:
```bash
/var $name = "Alice"
/var $topic = "AI safety"
/var $summary = llm("Summarize $topic")
```

### 🔧 Functions
Define reusable functions:
```bash
# Static functions
/func static greet($name) => "Hello, $name!"

# LLM functions
/func llm search($query, $site) => "Search for $query on $site"

# JavaScript functions
/func js calculate($x, $y) { return $x + $y; }
```

### 📋 Lists and Iteration
Work with collections:
```bash
/list @files = ["file1.txt", "file2.txt", "file3.txt"]
/for $file in @files { /echo Processing $file }
```

### 🔀 Control Flow
Conditionals and loops:
```bash
/prompt $username "Enter your name:"
/confirm $proceed "Continue?"
/if $proceed { /echo Continuing... } else { /echo Stopped }
/while $condition { /echo Running... }
```

### 🎯 Predefined Scripts
Run command sequences by name:
```javascript
export async function setupProject(projectName) {
  return [
    `/agent switch writer`,
    `/template run projectSetup ${projectName}`,
    `/tools enable filesystem`,
    `/agent switch publisher`
  ];
}
```

## Global Functions

Packages can register global functions:
```typescript
scriptingService.registerFunction({
  name: "readFile",
  item: {
    type: 'js',
    params: ['path'],
    body: `return fs.readFileSync(path, 'utf-8');`
  }
});
```

## Usage

```bash
# Variables with LLM
/var $analysis = llm("Analyze this code: $code")

# Function calls
/call search("quantum computing", "Google Scholar")

# Iteration
/for $f in @ts-files { /echo $basename at $path }

# Scripts
/script run setupProject myapp
```

## Inspiration

Scripting operators inspired by [mlld](https://github.com/mlld-lang/mlld) - a modular LLM scripting language.

Automate repetitive tasks, create reusable workflows, and build powerful AI-driven automation.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
