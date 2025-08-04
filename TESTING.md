# Testing Guide

This document describes the testing setup and conventions for the dondecargo project.

## Overview

The project uses **Jest** with **React Testing Library** for comprehensive testing across all layers:

- **API Route Tests** - Test Next.js API endpoints
- **MCP Tools Tests** - Test Model Context Protocol tools
- **Service Layer Tests** - Test business logic and database interactions
- **UI Component Tests** - Test React components and user interactions

## Test Structure

```
__tests__/
├── api/                     # API route tests
├── mcp-tools/               # MCP tools tests
├── services/                # Service layer tests
├── components/              # UI component tests
├── utils/                   # Test utilities
└── mocks/                   # Mock data
```

## Configuration Files

- `jest.config.js` - Jest configuration with Next.js integration
- `jest.setup.js` - Global test setup and mocks
- `__tests__/utils/test-helpers.ts` - Test utility functions
- `__tests__/mocks/mock-data.ts` - Mock data for tests

## Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode (for development)
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### Specific Test Categories
```bash
# API tests only
pnpm test:api

# Component tests only
pnpm test:components

# MCP tools tests only
pnpm test:mcp

# Service layer tests only
pnpm test:services
```

## Test Categories

### 1. API Route Tests (`__tests__/api/`)

### 2. MCP Tools Tests (`__tests__/mcp-tools/`)

### 3. Service Layer Tests (`__tests__/services/`)

### 4. UI Component Tests (`__tests__/components/`)

## Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Mocking Strategy
- Mock external dependencies (database, APIs, services)
- Use mock data consistently across tests
- Reset mocks between tests with `beforeEach`

### 3. Component Testing
- Test user interactions, not implementation details
- Use `screen.getByRole` over `screen.getByTestId` when possible
- Test loading states, error states, and success states

### 4. API Testing
- Test both success and failure scenarios
- Verify authentication requirements
- Test input validation and error responses

### 5. Coverage Goals
- Aim for >80% code coverage
- Focus on critical paths and edge cases
- Don't test trivial getters/setters

## Common Patterns

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const promise = someAsyncFunction()
  await expect(promise).resolves.toEqual(expectedResult)
})
```

### Testing Error Handling
```typescript
it('should handle errors gracefully', async () => {
  mockService.method.mockRejectedValue(new Error('Test error'))
  const result = await toolHandler()
  expect(result.isError).toBe(true)
})
```

### Testing User Interactions
```typescript
it('should handle user clicks', async () => {
  const user = userEvent.setup()
  render(<Component />)
  await user.click(screen.getByRole('button'))
  expect(mockFunction).toHaveBeenCalled()
})
```

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are defined before imports
2. **Async test failures**: Use `await` with user interactions
3. **Database mock issues**: Check that all chained methods return `mockDb`
4. **Component test failures**: Verify required props are provided

### Debug Tips

1. Use `screen.debug()` to see rendered component
2. Add `console.log` in test to debug values
3. Check mock call history with `mockFn.mock.calls`
4. Use `--verbose` flag for detailed test output

## Contributing

When adding new tests:
1. Follow existing patterns and naming conventions
2. Add appropriate mocks for external dependencies
3. Include both success and failure scenarios
4. Update this guide if adding new testing patterns