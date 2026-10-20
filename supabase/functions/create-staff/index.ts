import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')
  if (!url || !anonKey || !serviceRoleKey || !authorization) {
    return Response.json({ error: 'Missing server configuration or authorization' }, { status: 401, headers: corsHeaders })
  }

  const token = authorization.replace(/^Bearer\s+/i, '')
  const authClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders })

  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  const { data: actor, error: actorError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()
  if (actorError || actor?.role !== 'super_admin' || !actor.is_active) {
    return Response.json({ error: 'Super-admin access required' }, { status: 403, headers: corsHeaders })
  }

  let body: { email?: string; fullName?: string; temporaryPassword?: string }
  try { body = await request.json() as typeof body }
  catch { return Response.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders }) }
  const email = body.email?.trim().toLowerCase()
  const fullName = body.fullName?.trim()
  const password = body.temporaryPassword
  if (!email || !fullName || !password || password.length < 12) {
    return Response.json({ error: 'Enter a name, email, and temporary password with at least 12 characters.' }, { status: 400, headers: corsHeaders })
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) {
    return Response.json({ error: createError?.message ?? 'Could not create the auth user' }, { status: 400, headers: corsHeaders })
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role: 'admin', is_active: true, full_name: fullName, email })
    .eq('id', created.user.id)
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id)
    return Response.json({ error: 'The auth user was created but the staff profile could not be set up.' }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ id: created.user.id }, { status: 201, headers: corsHeaders })
})
