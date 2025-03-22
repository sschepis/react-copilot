/**
 * Type definitions for state paths
 */

/**
 * Enhanced state path type with support for nested paths
 * Can be a dot-notation string ('user.profile.name') or an array of path segments (['user', 'profile', 'name'])
 */
export type StatePath = string | string[];