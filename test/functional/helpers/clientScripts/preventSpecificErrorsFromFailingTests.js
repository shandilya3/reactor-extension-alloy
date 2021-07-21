/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/**
 * This script is loaded by TestCafe onto the page that's under test. TestCafe by default
 * fails tests if it sees there were unhandled errors. In our case, we want to test foreseeable
 * error cases, like when the user doesn't have access to Adobe Experience Platform. In these cases,
 * we throw a UserReportableError, which is displayed by the ErrorBoundary with an appropriate message.
 * From a functional test, we then assert that the ErrorBoundary displays the error we expected to be
 * shown. The ErrorBoundary, however, does not prevent the error from continuing to bubble up through
 * the stack trace, so TestCafe would typically see that as an unhandled error. This script helps
 * ensure that errors we've foreseen and appropriately handled are not considered unhandled. We typically
 * only want the test to fail if there's something wrong with our code.
 */
window.addEventListener("error", event => {
  // UserReportableErrors are intended to be shown to the user within an error boundary.
  // Error boundaries, however, do not change the error from being considered unhandled to
  // handled. Because of this, the unhandled error would typically make TestCafe fail
  // the test. We often test these error cases though, so the fact that the error went
  // unhandled really shouldn't fail the test. This code prevents the error from failing
  // the test. Note that if the error is a UserReportableError but was _not_ displayed inside an
  // error boundary (for example, the error was thrown within async code and reportAsyncError
  // was not used), we would really prefer that it fail the test, but this is unfeasible
  // because the error boundary only exposes the error to our application code _after_ our
  // event listener here as been called. In other words, there's no robust way to know
  // whether the error will end up being reported in the error boundary. We're left to
  // assume it will.
  // https://github.com/facebook/react/issues/10474
  // https://github.com/facebook/react/issues/13681
  if (event.error && event.error.name === "UserReportableError") {
    console.error(event.error);
    event.preventDefault();
  }

  // This error comes through React-Spectrum but can be safely ignored and should
  // not automatically fail the test.
  // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded#comment86691361_49384120
  if (event.message === "ResizeObserver loop limit exceeded") {
    event.preventDefault();
  }
});
