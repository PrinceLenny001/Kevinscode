// Mock the Buffer class if it's not available in the test environment
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Add any other global test setup here 