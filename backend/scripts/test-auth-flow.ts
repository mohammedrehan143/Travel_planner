import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthFlow() {
  console.log('=== TESTING REAL SUPABASE AUTH & PROFILE FLOW ===');
  
  const testEmail = `testuser_${Date.now()}@trippilot.test`;
  const testPassword = 'TestPassword123!';
  const testPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testName = 'Test Agent User';

  console.log(`\n1. Attempting signUp for: ${testEmail}`);
  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: testName,
        phone: testPhone,
        mobile_number: testPhone,
        terms_accepted: true,
      },
    },
  });

  if (signUpError) {
    console.error('❌ Sign up error:', signUpError);
    return;
  }

  const user = signUpData.user;
  console.log('✅ Sign up succeeded! User ID:', user?.id);
  console.log('   Session returned:', Boolean(signUpData.session));

  console.log('\n2. Checking if profiles row was created by trigger in Supabase...');
  // Wait 1 second for trigger
  await new Promise(r => setTimeout(r, 1000));

  const { data: adminProfile, error: adminProfileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (adminProfileError) {
    console.warn('⚠️ Admin query for profile returned error:', adminProfileError.message);
  } else {
    console.log('✅ Profile found in database via admin client:');
    console.log(adminProfile);
  }

  console.log('\n3. Testing signInWithPassword as the new user...');
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('❌ Sign in error:', signInError);
  } else {
    console.log('✅ Sign in succeeded! Access token obtained:', Boolean(signInData.session?.access_token));
    
    // Now test fetching the profile with the authenticated user client (matching browser behavior!)
    console.log('\n4. Testing profile fetch as the AUTHENTICATED user (RLS test)...');
    const authUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      },
    });

    const { data: userProfile, error: userProfileError } = await authUserClient
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (userProfileError) {
      console.error('❌ Authenticated user failed to fetch own profile:', userProfileError);
    } else {
      console.log('✅ Authenticated user successfully fetched own profile:', userProfile);
    }

    // Test upserting/updating profile as authenticated user
    console.log('\n5. Testing profile update as AUTHENTICATED user...');
    const { data: updatedProfile, error: updateError } = await authUserClient
      .from('profiles')
      .update({ full_name: 'Updated Name Test' })
      .eq('id', user?.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Authenticated user failed to update own profile:', updateError);
    } else {
      console.log('✅ Authenticated user successfully updated own profile:', updatedProfile.full_name);
    }
  }

  // Cleanup test user
  console.log('\n6. Cleaning up test user...');
  if (user?.id) {
    await adminClient.auth.admin.deleteUser(user.id);
    console.log('✅ Cleaned up test user from auth.users (cascade deletes profile).');
  }

  console.log('\n=== TEST AUTH FLOW FINISHED ===');
}

testAuthFlow().catch(console.error);
