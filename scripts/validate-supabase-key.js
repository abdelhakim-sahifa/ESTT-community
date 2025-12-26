// Supabase Anon Key Validator
// Run with: node scripts/validate-supabase-key.js

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYWllZG9jaWtudXRkeG9lemhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjE2NTMsImV4cCI6MjA4MDA5NzY1M30.ydJoZcnBWZUAWKnpq0rdGdqxHvo2fw-61HDJHfavZnk";

console.log('🔍 Validating Supabase Anon Key...\n');

try {
    // Check basic structure
    const parts = token.split('.');
    console.log(`✓ Token parts: ${parts.length} (expected: 3)`);

    if (parts.length !== 3) {
        throw new Error(`❌ Invalid token structure: has ${parts.length} parts, expected 3`);
    }

    // Decode header
    const headerBase64 = parts[0];
    const headerJson = Buffer.from(headerBase64, 'base64').toString('utf8');
    console.log(`\n📋 Header (raw):\n${headerJson}`);

    const header = JSON.parse(headerJson);
    console.log('\n📋 Header (parsed):');
    console.log(JSON.stringify(header, null, 2));

    // Decode payload
    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);

    console.log('\n📋 Payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Validate header
    console.log('\n🔍 Validating header...');

    if (!header.typ) {
        throw new Error('❌ Missing "typ" field in header');
    }

    if (header.typ !== 'JWT') {
        throw new Error(`❌ Invalid "typ": expected "JWT", got "${header.typ}"`);
    }
    console.log('✓ Header "typ" is correct: JWT');

    if (!header.alg) {
        throw new Error('❌ Missing "alg" field in header');
    }

    if (header.alg !== 'HS256') {
        console.warn(`⚠️ Unusual algorithm: ${header.alg} (expected HS256)`);
    } else {
        console.log('✓ Header "alg" is correct: HS256');
    }

    // Validate payload
    console.log('\n🔍 Validating payload...');

    if (!payload.role) {
        throw new Error('❌ Missing "role" field in payload');
    }

    if (payload.role !== 'anon') {
        throw new Error(`❌ Wrong role: expected "anon", got "${payload.role}"`);
    }
    console.log('✓ Role is correct: anon');

    if (!payload.iss) {
        throw new Error('❌ Missing "iss" field in payload');
    }

    if (payload.iss !== 'supabase') {
        throw new Error(`❌ Wrong issuer: expected "supabase", got "${payload.iss}"`);
    }
    console.log('✓ Issuer is correct: supabase');

    if (!payload.ref) {
        console.warn('⚠️ Missing "ref" field in payload');
    } else {
        console.log(`✓ Project ref: ${payload.ref}`);
    }

    // Check expiration
    console.log('\n🔍 Checking expiration...');

    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat;
    const exp = payload.exp;

    if (iat) {
        const issuedDate = new Date(iat * 1000);
        console.log(`✓ Issued at: ${issuedDate.toISOString()}`);
    }

    if (exp) {
        const expiresDate = new Date(exp * 1000);
        console.log(`✓ Expires at: ${expiresDate.toISOString()}`);

        if (now > exp) {
            throw new Error(`❌ Token expired on ${expiresDate.toISOString()}`);
        }

        const daysUntilExpiry = Math.floor((exp - now) / 86400);
        console.log(`✓ Token is valid for ${daysUntilExpiry} more days`);
    }

    // Final success message
    console.log('\n✅ All validations passed!');
    console.log('\n🎉 Your Supabase anon key is valid and correctly formatted.');

} catch (error) {
    console.error('\n❌ Validation failed:');
    console.error(error.message);
    console.error('\n💡 Recommendation:');
    console.error('   1. Go to Supabase Dashboard → Settings → API');
    console.error('   2. Copy the "anon public" key (NOT service_role)');
    console.error('   3. Update SUPABASE_ANON_KEY in lib/supabase.js');
    console.error('   4. Restart your development server');
    process.exit(1);
}
