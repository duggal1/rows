# Rows

Rows is an open-source AI website cloning and design-reference architecture. It takes an existing website, extracts its design context, and uses AI to reconstruct it as clean, structured application code.

## How It Works

1. The user provides a website URL.
2. Rows fetches and processes the website.
3. It extracts the relevant HTML, CSS, and JavaScript.
4. SVGs, excessive markup, and irrelevant content are truncated or removed to reduce unnecessary model context.
5. The highest-quality design context, including the relevant HTML and CSS, is prepared for the selected model provider.
6. The model generates structured Next.js, React, TypeScript, and Tailwind CSS code files.
7. Generated applications can use Motion, shadcn/ui, and other reusable UI components where appropriate.
8. The generated files are parsed, extracted, and stored as individual project files.
9. Background processing runs through Inngest.
10. Generated Next.js applications run inside isolated E2B containers.
11. E2B provides the filesystem and terminal environment required to install dependencies, run commands, test generated code, and start the application.
12. The running Next.js application is exposed as a live preview.
13. The user can chat with AI to modify the generated application and iterate directly on the existing codebase.

## Current Architecture

The current generation pipeline is:

```text
Website URL
    ↓
Extract HTML, CSS, and relevant page context
    ↓
Clean and truncate unnecessary content
    ↓
Build model context
    ↓
Send context to the AI provider
    ↓
Generate structured code files
    ↓
Parse and extract generated files
    ↓
Render preview
```

The target architecture is:

```text
Website URL
    ↓
Website extraction
    ↓
Context processing
    ↓
Design-reference retrieval
    ↓
Inngest background job
    ↓
AI model provider
    ↓
Next.js + React + TypeScript + Tailwind CSS
    ↓
Generated project files
    ↓
E2B container
    ↓
Install dependencies and run validation
    ↓
Run Next.js application
    ↓
Live application preview
    ↓
AI chat and code editing
    ↓
Validate changes and refresh preview
```

## Current Status

### Completed

* [x] HTML extraction pipeline
* [x] Gemini provider backend
* [x] Gemini model integration with generation prompts
* [x] Website context passed to the model
* [x] Generated code returned as structured text
* [x] Backend parsing for generated code files
* [x] Clean file extraction and stringification
* [x] Basic HTML/CSS preview of generated output

### Current Limitations

* [ ] E2B containers are not implemented
* [ ] Generated code does not run as a real Next.js application
* [ ] Preview currently renders generated HTML/CSS rather than a live Next.js environment
* [ ] Generated projects cannot currently install or execute their own dependencies
* [ ] Terminal-based build and type validation are not implemented
* [ ] Inngest background processing is not integrated
* [ ] Persistent database storage is not implemented
* [ ] Authentication is not implemented
* [ ] AI-assisted live editing is not implemented
* [ ] Design-reference retrieval is not implemented

## Roadmap

### Application

* [ ] Create the landing page
* [ ] Complete the generation dashboard
* [ ] Connect the frontend to the generation backend
* [ ] Pass extracted HTML and CSS context through the complete generation pipeline
* [ ] Generate complete Next.js application files
* [ ] Parse and persist generated project files
* [ ] Render generated files in a project file tree
* [ ] Add project creation and project history
* [ ] Add generation status and progress handling

### AI Generation

* [x] Integrate Gemini
* [x] Create the initial website-to-code generation prompt
* [x] Parse generated code into individual files
* [ ] Generate production-quality Next.js applications
* [ ] Generate fully typed TypeScript components
* [ ] Generate Tailwind CSS styling
* [ ] Support Motion for animations and interactions
* [ ] Support shadcn/ui and reusable UI component libraries
* [ ] Generate responsive desktop and mobile layouts
* [ ] Improve context extraction and truncation
* [ ] Improve generation prompts for visual accuracy
* [ ] Improve generated component architecture
* [ ] Add Anthropic SDK support
* [ ] Add OpenAI SDK support
* [ ] Add OpenRouter SDK support
* [ ] Support additional high-quality coding and design models
* [ ] Add provider and model selection

### Design Intelligence

* [ ] Build a large dataset of high-quality website and interface design references
* [ ] Extract reusable design patterns from reference websites
* [ ] Store structured information about layouts, typography, spacing, colors, components, and interactions
* [ ] Create embeddings for design references
* [ ] Add semantic design-reference retrieval
* [ ] Retrieve relevant references based on the website being generated
* [ ] Pass selected design references into the model context
* [ ] Optimize model context specifically for frontend and visual design generation
* [ ] Create reusable references for landing pages, dashboards, navigation, pricing, forms, and other common interface patterns
* [ ] Add visual comparison and evaluation for generated designs

### E2B Execution & Live Preview

* [ ] Integrate E2B containers
* [ ] Create an isolated E2B environment for each generated project
* [ ] Create generated Next.js projects inside E2B
* [ ] Write all AI-generated files into the container filesystem
* [ ] Install generated project dependencies
* [ ] Allow generated applications to use required npm packages
* [ ] Run terminal commands inside the container
* [ ] Start the actual Next.js development server
* [ ] Expose the running Next.js application as a live preview
* [ ] Replace the temporary HTML/CSS preview with the real Next.js preview
* [ ] Add desktop and mobile preview modes
* [ ] Run TypeScript type checks
* [ ] Run production builds
* [ ] Run linting and automated tests
* [ ] Capture build, runtime, and dependency errors
* [ ] Pass relevant terminal errors back to the AI for automated fixes
* [ ] Restart or refresh the application after code changes

### AI Chat & Editing

* [ ] Add an AI chat interface for generated projects
* [ ] Give the AI access to the existing project file structure
* [ ] Allow the AI to read relevant project files
* [ ] Allow the AI to create, modify, rename, and delete project files
* [ ] Apply AI-generated edits directly inside the E2B container
* [ ] Allow AI to install additional dependencies when required
* [ ] Run validation after AI-generated changes
* [ ] Give terminal and build errors back to the AI
* [ ] Allow the AI to automatically fix failed changes
* [ ] Refresh the live preview after successful edits
* [ ] Maintain conversation and project context across editing sessions

### Background Processing

* [ ] Integrate Inngest
* [ ] Move long-running website extraction and AI generation into background jobs
* [ ] Orchestrate extraction, generation, E2B setup, and validation workflows
* [ ] Add generation progress states
* [ ] Stream generation status to the frontend
* [ ] Handle failed and interrupted generations
* [ ] Add retries and generation recovery
* [ ] Add timeout handling for model and container operations

### Database

* [ ] Add Drizzle ORM
* [ ] Configure the database
* [ ] Create the database schema
* [ ] Add migrations
* [ ] Persist projects
* [ ] Persist generated files and project metadata
* [ ] Persist generation history
* [ ] Persist AI chat history
* [ ] Persist model and provider information
* [ ] Store E2B project and runtime metadata where required

### Authentication

* [ ] Integrate Better Auth
* [ ] Add Google OAuth
* [ ] Add authenticated user sessions
* [ ] Associate generated projects with users
* [ ] Protect authenticated application routes
* [ ] Add project ownership and authorization checks

### Production Readiness

* [ ] Add input validation
* [ ] Validate and sanitize submitted URLs
* [ ] Add structured error handling
* [ ] Add rate limiting
* [ ] Add security checks
* [ ] Secure E2B container execution
* [ ] Restrict unsafe terminal and filesystem operations
* [ ] Add automated testing
* [ ] Test the complete URL-to-Next.js generation pipeline
* [ ] Test AI-generated project builds
* [ ] Debug container and preview failures
* [ ] Test AI editing and automatic error recovery
* [ ] Test model-provider fallbacks
* [ ] Optimize context size and generation cost
* [ ] Optimize generation latency
* [ ] Add logging and observability
* [ ] Prepare production deployment
* [ ] Deploy Rows

## Stack

```text
Frontend        Next.js + React + TypeScript + Tailwind CSS
UI              shadcn/ui + reusable component libraries
Animation       Motion
AI              Gemini + Anthropic + OpenAI + OpenRouter
Background Jobs Inngest
Execution       E2B
Database        Drizzle ORM
Authentication  Better Auth + Google OAuth
```

## Goal

Rows aims to turn an existing website into a clean, editable, AI-generated Next.js codebase rather than producing a static visual copy.

The generated output should be a real Next.js application built with React, TypeScript, Tailwind CSS, Motion, and reusable UI components where appropriate.

The final workflow should allow a user to provide a URL, extract its design context, generate a complete project, run the application inside an isolated E2B environment, preview the real Next.js application, and continue modifying the existing codebase through AI.

Rows should also provide the model with a large, structured dataset of high-quality design references so that generation is optimized specifically for frontend design, visual structure, responsive behavior, and reusable interface patterns.
