# Specification: 01 - EUFM Core System Refactor
**Version:** 1.0
**Date:** 2025-09-13
**Status:** DRAFT
**Author:** citizen:ai:developer:002 (Gemini)

## 1. Overview

This document outlines the plan to refactor and stabilize the core EUFM system. The primary goal is to address critical bugs, resolve code quality issues, and prepare the codebase for the upgrade to the `openai-agents-python` SDK. This work is the prerequisite for all future development and monetization efforts.

## 2. Analysis of Current System State

### 2.1. Test Suite Failures

A full run of the test suite revealed one critical failure:

-   **`test:coord`:** This test, which covers the `MultiAgentCoordinator`, fails consistently.
    -   **Root Cause:** A `ZodError` indicates that the `header.type` property is missing from messages sent on the internal message bus. The `MultiAgentCoordinator` is not constructing messages that conform to the schema expected by the `AgentAdapter`.
    -   **Impact:** This is a critical bug that breaks the core multi-agent communication loop. It must be fixed before the system can be considered stable.

### 2.2. Code Quality Issues

-   **TypeScript Errors:** All TypeScript errors have been resolved. This is a significant improvement.
-   **ESLint Errors:** Over 1,300 ESLint errors remain. These are primarily:
    -   `@typescript-eslint/no-unused-vars`: Unused variables, which indicate dead or incomplete code.
    -   `@typescript-eslint/no-explicit-any`: The `any` type is used extensively, which undermines the benefits of TypeScript.
    -   `no-empty`: Empty code blocks, which can hide logic errors.
    -   Parsing errors in compiled JavaScript files in the `dist` directory.

## 3. Refactoring Plan

This plan is broken down into a series of sequential tasks.

### Task 1: Fix the `test:coord` Failure

-   **Objective:** Resolve the Zod validation error and get all tests to pass.
-   **Implementation Steps:**
    1.  Modify `src/utils/multiAgentCoordinator.ts`.
    2.  Locate the `runForSpec` function.
    3.  Update the message object passed to `this.bus.request` to correctly structure the `header` and `body` to match the `IncomingMessageSchema` in `src/messaging/agentAdapter.ts`.
-   **Validation:** Run `npm run test:coord --prefix ./UBOS` and confirm that it passes.

### Task 2: Comprehensive ESLint Cleanup

-   **Objective:** Eliminate the majority of the 1,300+ ESLint errors to improve code quality and maintainability.
-   **Implementation Steps:**
    1.  **Configure `.eslintignore`:** Create an `.eslintignore` file in the `UBOS` directory to exclude the `dist` and `node_modules` directories from the linting process. This will remove all errors related to compiled files.
    2.  **Fix Unused Variables:** Manually review and fix all instances of `@typescript-eslint/no-unused-vars`. This will involve removing unused imports and variables, and in some cases, identifying and completing unfinished code.
    3.  **Replace `any` Type:** Systematically replace the `any` type with more specific types. This will be a significant undertaking, but it is crucial for long-term stability. We will start with the most critical files (e.g., `agentAdapter.ts`, `multiAgentCoordinator.ts`).
    4.  **Address Other Errors:** Fix all other remaining ESLint errors.
-   **Validation:** Run `npm run lint --prefix ./UBOS` and confirm that the number of errors is significantly reduced (ideally to zero).

### Task 3: Refactor Core Logic for Clarity and Stability

-   **Objective:** Improve the overall structure and readability of the core application logic.
-   **Implementation Steps:**
    1.  **Centralize Type Definitions:** Consolidate all core type definitions (e.g., `AgentSpec`, `AgentResult`) into a single `src/types` directory to improve organization.
    2.  **Refactor `cli/index.ts`:** Break down the large `switch` statement into smaller, more manageable functions.
    3.  **Refactor `dashboardServer.ts`:** Separate the Express routes into a dedicated `routes` directory to improve organization.
-   **Validation:** All existing tests must continue to pass after the refactoring is complete.

## 4. Success Metrics

-   All test scripts in `package.json` pass without errors.
-   The number of ESLint errors is reduced by at least 90%.
-   The core application logic is demonstrably easier to read and understand.

---
This specification is now ready for your review.
