/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @public
 */
interface TestCase<INPUT = any, EXPECT = any> {
  input: INPUT
  expect: EXPECT
}

/**
 * @public
 */
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
