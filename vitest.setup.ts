// Any setup scripts you might need go here

import '@testing-library/jest-dom/vitest'

Element.prototype.scrollIntoView = () => {}

// Load .env files
import 'dotenv/config'
