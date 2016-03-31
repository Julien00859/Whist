var testrunner = require("qunit");
testrunner.setup({
  // logging options
  log: {
    // log assertions overview
    assertions: true,

    // log expected and actual values for failed tests
    errors: true,

    // log tests overview
    tests: true,

    // log summary
    summary: true,

    // log global summary (all files)
    globalSummary: true,

    // log coverage
    coverage: true,

    // log global coverage (all files)
    globalCoverage: true,

    // log currently testing code file
    testing: true
  }
});

testrunner.run(
  [
    // {
    //   code: "cards.js",
    //   tests: "unittest/cards_unittest.js"
    // },
    // {
    //   code: "whist.js",
    //   tests: "unittest/whist_unittest.js"
    // },
    {
      code: "whistNew.js",
      tests: "unittest/newWhist_unittest.js"
    }
  ]
);
