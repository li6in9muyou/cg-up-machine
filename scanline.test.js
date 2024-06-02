import { expect, it } from "vitest";
import { findScanlineMinMaxY } from "./scanline";

it("should take pixel rows that it covers more than 50%", () => {
  expect(
    findScanlineMinMaxY(10, 10, [
      // covers less than 50% of 1st row of pixels, starts from 2st row
      [1, 1.99, 1],
      // covers less than 50% of 9st row of pixels, ends at 8th row
      [1, 9.01, 1],
      [9, 5, 1],
    ]),
  ).toStrictEqual([2, 8]);
  expect(
    findScanlineMinMaxY(10, 10, [
      // covers more than 50% of 1st row of pixels, starts from 1st row
      [1, 1.49, 1],
      // covers more than 50% of 9st row of pixels, ends at 9th row
      [1, 9.51, 1],
      [9, 5, 1],
    ]),
  ).toStrictEqual([1, 9]);
  expect(
    findScanlineMinMaxY(10, 10, [
      // covers less than 50% of 1st row of pixels, starts from 2st row
      [1, 1.51, 1],
      // covers more than 50% of 9st row of pixels, ends at 9th row
      [1, 9.51, 1],
      [9, 5, 1],
    ]),
  ).toStrictEqual([2, 9]);
  expect(
    findScanlineMinMaxY(10, 10, [
      // covers more than 50% of 1st row of pixels, starts from 1st row
      [1, 1.25, 1],
      // covers less than 50% of 9st row of pixels, ends at 8th row
      [1, 9.25, 1],
      [9, 5, 1],
    ]),
  ).toStrictEqual([1, 8]);
});
