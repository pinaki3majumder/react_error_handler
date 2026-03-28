# React Error Handler Features

This project is a React + Vite route-based pages and centralized API error handling.

## Features Added

- Retry flow for failed API calls
  - First failure shows the error screen
  - User can retry the same API two times
  - After two failed retries, the button changes to `Back to home page`
- HTTP/network error reporting
  - Shows transport error like `ERR_NETWORK`
  - Shows HTTP status like `400`, `500`, `501` when available
- Centralized API response validation using `zod`
  - Validates users, recipes, and carts response shape
  - Detects missing fields, null values, wrong types, and malformed payloads
  - Stops rendering invalid data and shows the error screen instead
- Missing field details shown in the error UI through `h6`
  - Example: `users[0].firstName`
  - Example: `recipes[2].name`
- Automatic `/error-log` API call when the error screen renders
  - Sends the full error context as a stringified JSON payload
  - Deduplicated so the same visible error is not logged multiple times

## Error UI Reference

When an API call fails or the API response does not match the expected contract, the app renders an error screen with this structure:

```text
h1: API failed
h2: Failed API: <api url>
h3: Failed from: <page name> <function name>
h4: Error code: <axios/network code> | HTTP status: <status code or No HTTP response>
h5: Backend message: <backend message or validation message>
h6: Missing in API response: <missing field path and validation detail>

button: Retry
button after two failed retries: Back to home page
```

## Example Error UI

```text
API failed
Failed API: https://dummyjson.com/users
Failed from: Page A loadUsers
Error code: RESPONSE_SCHEMA_MISMATCH | HTTP status: 200
Backend message: API response validation failed.
Missing in API response: users[0].firstName: Invalid input: expected string, received undefined

[ Retry ]
```
