
    // iPhone 7 Safari Compatibility Polyfills
    (function () {
      'use strict';

      // Polyfill for crypto.randomUUID for older browsers (iPhone 7 Safari)
      if (!window.crypto || !window.crypto.randomUUID) {
        if (!window.crypto) window.crypto = {};
        window.crypto.randomUUID = function () {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
      }

      // Old conflicting chatbot implementation removed
      // Now using comprehensive inline system below

    })();
  