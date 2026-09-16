/**
 * SECURITY SENTINEL: ZERO BROWSER EXPOSURE GATEWAY
 * 
 * Direct client-side Supabase connections from the browser are strictly prohibited
 * to protect against credential harvesting and RLS bypasses.
 * 
 * All client operations must communicate exclusively through secure Next.js server API routes:
 * - /api/admissions
 * - /api/settings
 * - /api/audit-logs
 * - /api/admin/update-status
 * 
 * Server-only database operations are safely handled by `@/utils/supabaseServer`.
 */

export const supabase = null as any;
