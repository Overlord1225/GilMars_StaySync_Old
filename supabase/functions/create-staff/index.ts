import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !anonKey || !serviceRoleKey || !authorization) {
    return Response.json(
      { error: "Missing server configuration or authorization" },
      { status: 401, headers: corsHeaders },
    );
  }

  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: corsHeaders },
    );
  }
  const token = tokenMatch[1];
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);
  if (authError || !user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: corsHeaders },
    );

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: actor, error: actorError } = await adminClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (actorError || actor?.role !== "super_admin" || !actor.is_active) {
    return Response.json(
      { error: "Super-admin access required" },
      { status: 403, headers: corsHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders },
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders },
    );
  }
  const input = body as Record<string, unknown>;
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName =
    typeof input.fullName === "string" ? input.fullName.trim() : "";
  const password =
    typeof input.temporaryPassword === "string" ? input.temporaryPassword : "";
  if (
    !email ||
    email.length > 320 ||
    !fullName ||
    fullName.length > 200 ||
    password.length < 11 ||
    password.length > 128
  ) {
    return Response.json(
      {
        error:
          "Enter a name, email, and temporary password with at least 11 characters.",
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  if (createError || !created.user) {
    return Response.json(
      {
        error:
          "Could not create the staff account. Check the email and try again.",
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .update({ role: "admin", is_active: true, full_name: fullName, email })
    .eq("id", created.user.id)
    .select("id")
    .maybeSingle();
  if (profileError || !profile) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(
      created.user.id,
    );
    if (rollbackError) {
      console.error(
        "Failed to remove auth user after profile setup failure",
        rollbackError,
      );
    }
    return Response.json(
      {
        error:
          "The auth user was created but the staff profile could not be set up.",
      },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json(
    { id: created.user.id },
    { status: 201, headers: corsHeaders },
  );
});
