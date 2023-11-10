/* eslint-disable @typescript-eslint/no-explicit-any */
interface TestCase<INPUT = any, EXPECT = any> {
  input: INPUT
  expect: EXPECT
}

function tableTest<INPUT = any, EXPECT = any>(
  testCases: TestCase<INPUT, EXPECT>[],
  checkFn: (testCase: TestCase<INPUT, EXPECT>) => any,
) {
  for (const testCase of testCases) {
    checkFn(testCase)
  }
}

export { tableTest }
export type { TestCase }
