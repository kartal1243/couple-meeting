# Backend Modules (`modules.js`)

Reusable utility functions extracted from `index.js` for use in new code.

## Usage

```javascript
const { sanitize, isValidEmail, createRoom } = require('./modules');
```

## Available Functions

| Function | Description |
|---|---|
| `sanitize(str, maxLen)` | Escapes HTML entities, trims, and truncates input |
| `isValidEmail(email)` | Basic email format validation |
| `isValidUsername(username)` | Validates 3-20 char lowercase alphanumeric + underscore |
| `createRateLimiter()` | Factory returning a per-type rate limit checker |
| `createRoom(id, password, maxUsers, userId, isVip)` | Creates a default room object |
| `generateId()` | Returns a random 16-char hex string |
| `sanitizePlaylistItem(item, username)` | Sanitizes a playlist entry |
| `sanitizeEmoji(emoji)` | Sanitizes emoji input (max 8 chars) |

## Notes

- `index.js` is **not modified**. These utilities are for new code only.
- When `index.js` is eventually refactored, it should import from this file instead of defining its own copies.
