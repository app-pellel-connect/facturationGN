import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberRequest {
  email: string;
  password: string;
  full_name?: string;
  role: string;
  company_id: string;
  invited_by: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("create-team-member: request received", {
      method: req.method,
      hasAuthorization: !!req.headers.get("Authorization"),
    });

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create user client to verify the request
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.warn("create-team-member: invalid session", { userError });
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateMemberRequest = await req.json();
    const { email, password, full_name, role, company_id, invited_by } = body;

    // Validate required fields
    if (!email || !password || !role || !company_id || !invited_by) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is an admin of the company
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("company_members")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .single();

    if (membershipError || !membership || membership.role !== "company_admin" || !membership.is_active) {
      return new Response(
        JSON.stringify({ error: "Vous n'êtes pas autorisé à ajouter des membres" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the new user with admin client (won't affect current session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          error: authError.message.includes("already been registered") 
            ? "Cet email est déjà utilisé" 
            : authError.message 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du compte" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add user to company
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id,
        user_id: authData.user.id,
        role,
        invited_by,
        is_active: true,
      })
      .select()
      .single();

    if (memberError) {
      console.error("Member error:", memberError);
      // Cleanup: delete the created user if we can't add them to company
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'ajout à l'équipe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: memberData,
        user_id: authData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
