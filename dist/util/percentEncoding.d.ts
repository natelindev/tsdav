/**
 * Encode every path segment the same way, so hrefs that differ only in
 * percent-encoding (`a@b` and `a%40b`, `%2f` and `%2F`) compare equal.
 * Only for comparisons: servers may expect the original form in requests.
 */
export declare const normalizePercentEncoding: (href: string) => string;
