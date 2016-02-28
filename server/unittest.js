var testrunner = require("qunit");

testrunner.run(
  [{
    code: "carts.js",
    tests: "unittest/carts_unittest.js"
  }]
  //{
  //  code: "whist.js",
  //  tests: "unittest/whist_unittest.js"
  //}]
);
