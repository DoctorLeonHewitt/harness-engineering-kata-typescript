# Harness engineering kata - based on https://github.com/martinsson/harness-engineering-kata

Experiment with tweaking and tooling the harness of agents so they produce the result you want.

Implement the same feature over and over again, improve the harness to make it generate better an better versions of it

By harness in this context we mean whatever influences the agent's behavior, and whatever feedback mechanisms you put in place.
- the AGENTS.md / CLAUDE.md file
- skills
- scripts (making results predictable)
- Architectural documents, and constraints (like arch unit)
- Process / workflow descriptions
- the README.md and other visible files in the root dir


## Steps
For each step, throw away all code and get back to main, use this prompt, unless instructed otherwise:

    implement the feature from feature.md

### 1. No Harness

  Start without any harness files, and do not create AGENTS.md or CLAUDE.md.

### 2. Add a Minimal Agent Instruction File

  Create either AGENTS.md or CLAUDE.md and add a simple instruction such as: "Add full test coverage for new features."

### 3. Add Regression-Protection Guidance

  Assume the agent may skip tests for existing untested code, and add an instruction like: "To protect against regressions, always add full coverage for existing code before modifying it."

### 4. Refactor Until Quality Is Acceptable

  Assume the initial code quality is weak, ask the agent to refactor repeatedly until you are reasonably satisfied, and then ask it to extract design principles from the conversation into a file such as
  docs/design-principles.md.

  Commit the design principles, but revert the implementation and tests before proceeding to the next step 

### 5. Reuse Design Principles and Retry

  Reference docs/design-principles.md from AGENTS.md or CLAUDE.md, then restart from scratch and compare whether the resulting code is similar to the improved result from the first iteration.


### TypeScript

```bash
cd typescript
yarn install
yarn build
yarn start
```

