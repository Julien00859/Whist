var testrunner = require("qunit");

testrunner.run(
  [{
    code: "cards.js",
    tests: "unittest/cards_unittest.js"
  },
  {
    code: "whist.js",
    tests: "unittest/whist_unittest.js"
  }]
);
